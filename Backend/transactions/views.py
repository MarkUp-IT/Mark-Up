from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, When
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from .models import (
    PaymentStatus,
    Transaction,
    TransactionItem,
    ReferralCode,
    ReferralCodeUsage,
    DiscountType,
    MentorPayout,
    PayoutStatus,
)
from products.models import (
    Product,
    ProductType,
    UserLibrary,
    MentoringSession,
    BootcampSession,
)
from programs.models import BootcampSession as BootcampSessionTemplate
from django.utils.dateparse import parse_date
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole, AuditAction
from accounts.utils import log_audit
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncDate
from django.db import transaction as db_transaction
from mentors.models import MentorAvailability, MentorProfile
from .utils import get_request_data
from django.views.decorators.csrf import csrf_exempt

def _resolve_period_range(period: str):
    """
    Translate period key (all/day/week/month) jadi (start_date, end_date, prev_start, prev_end).
    prev_* dipakai untuk hitung trend dibanding periode sebelumnya.
    """
    today = timezone.localdate()

    if period == "day":
        start_date = end_date = today
        prev_start = prev_end = today - timedelta(days=1)
    elif period == "week":
        start_date = today - timedelta(days=today.weekday())  # Senin
        end_date = today
        length = (end_date - start_date).days + 1
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=length - 1)
    elif period == "month":
        start_date = today.replace(day=1)
        end_date = today
        length = (end_date - start_date).days + 1
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=length - 1)
    else:  # "all"
        start_date = end_date = prev_start = prev_end = None

    return start_date, end_date, prev_start, prev_end

def _apply_date_filter(queryset, start_date, end_date):
    if start_date:
        queryset = queryset.filter(transaction__created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(transaction__created_at__date__lte=end_date)
    return queryset

def _sum_revenue(queryset):
    return queryset.aggregate(revenue=Sum(REVENUE_EXPRESSION))["revenue"] or 0


REVENUE_EXPRESSION = ExpressionWrapper(
    F("price_at_checkout") * F("quantity"),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)


def _serialize_product_detail(product):
    detail = None
    if product.type == ProductType.MENTORING:
        detail = getattr(product, "mentoring_detail", None)
    elif product.type == ProductType.MODULE:
        detail = getattr(product, "module_detail", None)
    elif product.type == ProductType.BOOTCAMP:
        detail = getattr(product, "bootcamp_detail", None)

    if detail is None:
        return None

    payload = {
        "title": detail.title,
        "description": detail.description,
        "image_url": detail.image_url,
        "original_price": str(detail.original_price) if detail.original_price is not None else None,
        "price": str(detail.new_price) if detail.new_price is not None else None,
        "is_active": detail.is_active,
    }

    if hasattr(detail, "file_pdf_url"):
        payload["file_pdf_url"] = detail.file_pdf_url

    if hasattr(detail, "stock"):
        payload["stock"] = detail.stock

    return payload

@jwt_required
@role_required(UserRole.ADMIN)
def get_transactions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = (
        TransactionItem.objects
        .select_related(
            "transaction",
            "transaction__user",
            "product",
        )
        .order_by("-transaction__created_at")
    )

    data = []

    for item in items:
        product_detail = _serialize_product_detail(item.product)
        data.append({
            "transaction_id": item.transaction.id,
            "user_id": str(item.transaction.user.id),
            "user_name": item.transaction.user.fullname,
            "product_id": str(item.product.id),
            "product_title": product_detail.get("title") if product_detail else None,
            "date_time": item.transaction.created_at.isoformat(),
            "amount": str(item.transaction.grand_total),
            "method": item.transaction.payment_method,
            "status": item.transaction.payment_status,
            "proof_of_payment": item.transaction.proof_of_payment.url if item.transaction.proof_of_payment else None,
        })

    return JsonResponse(
        {"transactions": data},
        status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def verify_transaction(request, transaction_id):
    if request.method != "PATCH":
        return HttpResponseNotAllowed(["PATCH"])

    try:
        txn = Transaction.objects.select_related("user").get(id=transaction_id)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if txn.payment_status != PaymentStatus.PENDING:
        return JsonResponse(
            {"detail": "Transaksi ini sudah diverifikasi sebelumnya."}, status=400
        )

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    decision = request_data.get("decision")
    if decision not in ("paid", "failed"):
        return JsonResponse(
            {"detail": "decision harus 'paid' atau 'failed'."}, status=400
        )

    items = list(
        txn.items.select_related(
            "product__mentoring_detail",
            "product__module_detail",
            "product__bootcamp_detail",
            "mentor_availability",
        )
    )

    with db_transaction.atomic():
        if decision == "paid":
            # Baru di sinilah akses produk beneran dikasih -- UserLibrary +
            # sesi-sesinya, plus sold_count baru nambah sekarang (bukan pas
            # checkout), karena transaksi resmi dianggap "terjual" setelah
            # admin approve buktinya, bukan pas user baru upload.
            txn.payment_status = PaymentStatus.PAID
            txn.paid_at = timezone.now()

            for item in items:
                product = item.product
                detail = _get_checkout_detail(product)

                user_library, _ = UserLibrary.objects.get_or_create(
                    user=txn.user, product=product,
                )

                if product.type == ProductType.MENTORING and item.mentor_availability:
                    _create_mentoring_sessions(user_library, detail, item.mentor_availability)
                elif product.type == ProductType.BOOTCAMP:
                    _create_bootcamp_sessions(user_library, product)

                if detail is not None:
                    detail.sold_count = (detail.sold_count or 0) + item.quantity
                    detail.save(update_fields=["sold_count"])
        else:
            # Ditolak -- lepas lagi semua yang di-reserve pas checkout (slot
            # mentor, stok, kuota kode referral) supaya bisa dipakai/dibeli
            # ulang oleh siapa aja, termasuk user yang sama.
            txn.payment_status = PaymentStatus.FAILED

            for item in items:
                detail = _get_checkout_detail(item.product)

                if item.mentor_availability_id:
                    item.mentor_availability.is_booked = False
                    item.mentor_availability.save(update_fields=["is_booked"])

                if detail is not None and getattr(detail, "stock", None) is not None:
                    detail.stock = (detail.stock or 0) + item.quantity
                    detail.save(update_fields=["stock"])

            usage = ReferralCodeUsage.objects.filter(transaction=txn).select_related("referral_code").first()
            if usage:
                referral_code = usage.referral_code
                referral_code.used_count = max(0, referral_code.used_count - 1)
                referral_code.save(update_fields=["used_count"])
                usage.delete()

        txn.save()

    log_audit(
        request, AuditAction.UPDATE, "transactions", object_id=txn.id,
        old_data={"status": "PENDING"}, new_data={"status": txn.payment_status},
    )

    return JsonResponse(
        {
            "detail": "Status transaksi berhasil diperbarui.",
            "transaction_id": txn.id,
            "status": txn.payment_status,
        },
        status=200,
    )


@jwt_required
def get_my_transactions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = (
        TransactionItem.objects.filter(transaction__user=request.user)
        .select_related("transaction", "product")
        .order_by("-transaction__created_at")
    )

    data = []
    for item in items:
        product_detail = _serialize_product_detail(item.product)
        data.append(
            {
                "transaction_id": item.transaction.id,
                "product_id": str(item.product.id),
                "product_type": item.product.type,
                "product_title": product_detail.get("title") if product_detail else None,
                "created_at": item.transaction.created_at.isoformat(),
                "amount": str(item.transaction.grand_total),
                "method": item.transaction.payment_method,
                "status": item.transaction.payment_status,
                "proof_of_payment": item.transaction.proof_of_payment.url if item.transaction.proof_of_payment else None,
            }
        )

    return JsonResponse({"transactions": data}, status=200)

@jwt_required
@role_required(UserRole.ADMIN)
def get_revenue_summary(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    period = request.GET.get("period", "all")
    if period not in ("all", "day", "week", "month"):
        return HttpResponseBadRequest("period harus salah satu dari: all, day, week, month")

    start_date, end_date, prev_start, prev_end = _resolve_period_range(period)

    base_items = TransactionItem.objects.filter(
        transaction__payment_status=PaymentStatus.PAID
    )
    items = _apply_date_filter(base_items, start_date, end_date)

    totals = items.aggregate(
        mentoring_revenue=Sum(
            Case(
                When(product__type=ProductType.MENTORING, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        module_revenue=Sum(
            Case(
                When(product__type=ProductType.MODULE, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        bootcamp_revenue=Sum(
            Case(
                When(product__type=ProductType.BOOTCAMP, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        total_revenue=Sum(REVENUE_EXPRESSION),
    )
    total_revenue = totals["total_revenue"] or 0

    trend_percentage = None
    if period != "all":
        prev_revenue = _sum_revenue(_apply_date_filter(base_items, prev_start, prev_end))
        if prev_revenue:
            trend_percentage = round(float((total_revenue - prev_revenue) / prev_revenue) * 100, 2)
        else:
            trend_percentage = 100.0 if total_revenue else 0.0

    chart_start = start_date or (timezone.localdate() - timedelta(days=29))
    chart_end = end_date or timezone.localdate()

    daily_qs = (
        _apply_date_filter(base_items, chart_start, chart_end)
        .annotate(date=TruncDate("transaction__created_at"))
        .values("date")
        .annotate(revenue=Sum(REVENUE_EXPRESSION))
        .order_by("date")
    )
    daily_map = {row["date"]: row["revenue"] or 0 for row in daily_qs}

    daily_chart = []
    cursor = chart_start
    while cursor <= chart_end:
        daily_chart.append({"day": cursor.strftime("%d/%m"), "revenue": float(daily_map.get(cursor, 0))})
        cursor += timedelta(days=1)

    return JsonResponse(
        {
            "period": period,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "revenue_by_type": {
                ProductType.MENTORING: str(totals["mentoring_revenue"] or 0),
                ProductType.MODULE: str(totals["module_revenue"] or 0),
                ProductType.BOOTCAMP: str(totals["bootcamp_revenue"] or 0),
            },
            "total_revenue": str(total_revenue),
            "trend_percentage": trend_percentage,
            "daily_chart": daily_chart,
        },
        status=200,
    )

@jwt_required
@role_required(UserRole.ADMIN)
def get_product_purchase_counts(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    period = request.GET.get("period", "all")
    if period not in ("all", "day", "week", "month"):
        return HttpResponseBadRequest("period harus salah satu dari: all, day, week, month")

    start_date, end_date, _, _ = _resolve_period_range(period)

    base_items = TransactionItem.objects.filter(transaction__payment_status=PaymentStatus.PAID)
    items = _apply_date_filter(base_items, start_date, end_date)

    counts = items.aggregate(
        mentoring_count=Sum(
            Case(
                When(product__type=ProductType.MENTORING, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
        module_count=Sum(
            Case(
                When(product__type=ProductType.MODULE, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
        bootcamp_count=Sum(
            Case(
                When(product__type=ProductType.BOOTCAMP, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
    )
    total_count = (counts["mentoring_count"] or 0) + (counts["module_count"] or 0) + (counts["bootcamp_count"] or 0)

    # "Penjualan Hari Ini" -- independen dari period yang dipilih FE,
    # jadi card ini selalu nunjukin angka hari ini apa pun filter aktif.
    today = timezone.localdate()
    today_count = base_items.filter(transaction__created_at__date=today).aggregate(
        qty=Sum("quantity")
    )["qty"] or 0

    return JsonResponse(
        {
            "period": period,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "counts_by_type": {
                ProductType.MENTORING: int(counts["mentoring_count"] or 0),
                ProductType.MODULE: int(counts["module_count"] or 0),
                ProductType.BOOTCAMP: int(counts["bootcamp_count"] or 0),
            },
            "total_count": int(total_count),
            "today_count": int(today_count),
        },
        status=200,
    )

@jwt_required
def get_user_purchased_products(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    items = (
        TransactionItem.objects.filter(
            transaction__user=request.user,
            transaction__payment_status=PaymentStatus.PAID,
        )
        .select_related("transaction", "product")
        .order_by("-transaction__created_at")
    )

    data = []
    for item in items:
        product_detail = _serialize_product_detail(item.product)
        data.append(
            {
                "transaction_item_id": str(item.id),
                "transaction_id": item.transaction.id,
                "product_id": str(item.product.id),
                "product_type": item.product.type,
                "quantity": item.quantity,
                "price_at_checkout": str(item.price_at_checkout),
                "purchased_at": item.transaction.created_at.isoformat(),
                "product": product_detail,
            }
        )

    return JsonResponse({"products": data}, status=200)

@jwt_required
def get_user_purchased_product_detail(request, product_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    item = (
        TransactionItem.objects.filter(
            transaction__user=request.user,
            transaction__payment_status=PaymentStatus.PAID,
            product=product,
        )
        .select_related("transaction", "product")
        .order_by("-transaction__created_at")
        .first()
    )

    if item is None:
        return JsonResponse({"detail": "Produk ini belum pernah dibeli oleh pengguna ini."}, status=404)

    product_detail = _serialize_product_detail(product)
    return JsonResponse(
        {
            "transaction_item_id": str(item.id),
            "transaction_id": item.transaction.id,
            "product_id": str(product.id),
            "product_type": product.type,
            "quantity": item.quantity,
            "price_at_checkout": str(item.price_at_checkout),
            "purchased_at": item.transaction.created_at.isoformat(),
            "product": product_detail,
        },
        status=200,
    )

def _get_checkout_detail(product):
    if product.type == ProductType.MENTORING:
        return getattr(product, "mentoring_detail", None)
    elif product.type == ProductType.MODULE:
        return getattr(product, "module_detail", None)
    elif product.type == ProductType.BOOTCAMP:
        return getattr(product, "bootcamp_detail", None)
    return None


def _create_mentoring_sessions(user_library, mentoring_detail, first_slot):
    """Bikin baris MentoringSession sejumlah session_count paket. Sesi pertama
    langsung terjadwal sesuai slot yang dipilih saat checkout, sisanya
    menunggu dijadwalkan user lewat dashboard."""
    mentor_profile = first_slot.mentor_profile
    sessions = []
    for order in range(1, mentoring_detail.session_count + 1):
        if order == 1:
            sessions.append(
                MentoringSession(
                    mentoring=mentoring_detail,
                    user_library=user_library,
                    order=order,
                    mentor=mentor_profile,
                    start_time=first_slot.start_time,
                    availability_slot=first_slot,
                    status=MentoringSession.SessionStatus.SCHEDULED,
                )
            )
        else:
            sessions.append(
                MentoringSession(
                    mentoring=mentoring_detail,
                    user_library=user_library,
                    order=order,
                    mentor=mentor_profile,
                    status=MentoringSession.SessionStatus.WAITING_SCHEDULE,
                )
            )
    MentoringSession.objects.bulk_create(sessions)


def _create_bootcamp_sessions(user_library, product):
    """Clone template sesi bootcamp (dikelola admin di app programs) jadi
    baris progress per-pembeli di products.BootcampSession."""
    templates = (
        BootcampSessionTemplate.objects.filter(bootcamp=product.id)
        .prefetch_related("session_mentors__mentor_profile")
        .order_by("start_time")
    )

    sessions = []
    for order, template in enumerate(templates, start=1):
        first_assignment = template.session_mentors.first()
        sessions.append(
            BootcampSession(
                bootcamp_id=product.id,
                user_library=user_library,
                template=template,
                order=order,
                title=template.title,
                mentor=first_assignment.mentor_profile if first_assignment else None,
                start_time=template.start_time,
                status=BootcampSession.SessionStatus.SCHEDULED,
                meeting_link=template.meeting_link or "",
            )
        )
    BootcampSession.objects.bulk_create(sessions)


@csrf_exempt
@jwt_required
def checkout_product(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    product_id = request_data.get("product_id")
    voucher_code = request_data.get("voucher_code")
    buyer_phone = request_data.get("buyer_phone")
    mentor_availability_id = request_data.get("availability_slot_id")
    proof_file = request.FILES.get("proof_of_payment")

    if not product_id:
        return JsonResponse({"detail": "product_id diperlukan."}, status=400)

    if not proof_file:
        return JsonResponse({"detail": "Bukti pembayaran diperlukan."}, status=400)
    
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
    MAX_FILE_SIZE = 5 * 1024 * 1024  

    ext = proof_file.name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return JsonResponse({"detail": "Format file tidak didukung."}, status=400)

    if proof_file.size > MAX_FILE_SIZE:
        return JsonResponse({"detail": "Ukuran file maksimal 5MB."}, status=400)

    try:
        product = Product.objects.select_related(
            "mentoring_detail", "module_detail", "bootcamp_detail"
        ).get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    detail = None
    if product.type == ProductType.MENTORING:
        detail = getattr(product, "mentoring_detail", None)
    elif product.type == ProductType.MODULE:
        detail = getattr(product, "module_detail", None)
    elif product.type == ProductType.BOOTCAMP:
        detail = getattr(product, "bootcamp_detail", None)

    if detail is None or not detail.is_active:
        return JsonResponse({"detail": "Produk tidak tersedia."}, status=400)

    if product.type == ProductType.MENTORING:
        required_profile_fields = {
            "phone": "Nomor WhatsApp",
            "institution": "Institusi",
            "current_status": "Status Saat Ini",
            "linkedin_url": "LinkedIn",
        }
        missing_fields = [
            label
            for field, label in required_profile_fields.items()
            if not (getattr(request.user, field) or "").strip()
        ]
        if missing_fields:
            return JsonResponse(
                {
                    "detail": (
                        "Lengkapi dulu data profil kamu di Pengaturan sebelum "
                        "membeli produk mentoring: " + ", ".join(missing_fields) + "."
                    ),
                    "missing_fields": missing_fields,
                },
                status=400,
            )

    if product.type == ProductType.MENTORING and not mentor_availability_id:
        return JsonResponse(
            {"detail": "availability_slot_id diperlukan untuk produk mentoring."},
            status=400,
        )

    price = detail.new_price if getattr(detail, "new_price", None) else detail.original_price

    referral_code = None
    discount_amount = 0
    if voucher_code:
        try:
            referral_code = ReferralCode.objects.get(code__iexact=voucher_code)
        except ReferralCode.DoesNotExist:
            return JsonResponse({"detail": "Kode referral tidak ditemukan."}, status=400)

        if not referral_code.is_valid_for_product(product, user=request.user):
            return JsonResponse(
                {"detail": "Kode referral tidak berlaku, sudah tidak aktif, atau sudah pernah kamu pakai."},
                status=400,
            )

        discount_amount = referral_code.compute_discount(price)

    grand_total = float(price) - float(discount_amount)

    try:
        with db_transaction.atomic():
            mentor_availability = None

            if referral_code is not None:
                locked_referral = ReferralCode.objects.select_for_update().get(pk=referral_code.pk)
                if not locked_referral.is_valid_for_product(product, user=request.user):
                    return JsonResponse(
                        {"detail": "Kode referral tidak berlaku, kuotanya habis, atau sudah pernah kamu pakai."},
                        status=400,
                    )
                locked_referral.used_count += 1
                locked_referral.save()

            if product.type == ProductType.MENTORING:
                try:
                    mentor_availability = MentorAvailability.objects.select_for_update().get(
                        id=mentor_availability_id
                    )
                except MentorAvailability.DoesNotExist:
                    return JsonResponse({"detail": "Slot jadwal tidak ditemukan."}, status=404)

                if mentor_availability.is_booked:
                    return JsonResponse({"detail": "Slot ini sudah dibooking orang lain."}, status=400)

                mentor_availability.is_booked = True
                mentor_availability.save()

            elif product.type in (ProductType.MODULE, ProductType.BOOTCAMP):
                # Stok di-reserve begitu checkout (biar nggak oversell selama
                # nunggu verifikasi admin, yang bisa makan waktu 1x24 jam),
                # tapi sold_count BARU nambah begitu admin approve (lihat
                # verify_transaction) -- supaya angka "terjual" yang tampil ke
                # publik nggak ikut kehitung transaksi yang masih pending/gagal.
                detail_locked = type(detail).objects.select_for_update().get(pk=detail.pk)

                if getattr(detail_locked, "stock", None) is not None:
                    if detail_locked.stock <= 0:
                        return JsonResponse({"detail": "Stok produk habis."}, status=400)
                    detail_locked.stock -= 1
                    detail_locked.save()

            txn = Transaction.objects.create(
                user=request.user,
                buyer_phone=buyer_phone,
                sub_total=price,
                promo_code=voucher_code,
                discount_amount=discount_amount,
                tax=0,
                grand_total=grand_total,
                proof_of_payment=proof_file,
                payment_status=PaymentStatus.PENDING,
            )

            item = TransactionItem.objects.create(
                transaction=txn,
                product=product,
                price_at_checkout=price,
                quantity=1,
                mentor_availability=mentor_availability,
            )

            if referral_code is not None:
                ReferralCodeUsage.objects.create(
                    referral_code=referral_code,
                    transaction=txn,
                    user=request.user,
                    discount_amount=discount_amount,
                )

            # UserLibrary (akses produk beneran) & sesi-sesinya SENGAJA belum
            # dibuat di sini -- baru dibuat begitu admin approve pembayaran
            # (lihat verify_transaction). Slot mentor & stok di atas cuma
            # di-reserve dulu supaya nggak direbut orang lain selama nunggu
            # verifikasi.

    except Exception as e:
        return JsonResponse({"detail": f"Checkout gagal: {str(e)}"}, status=500)

    return JsonResponse(
        {
            "detail": "Transaksi berhasil dibuat, menunggu verifikasi admin.",
            "transaction_id": txn.id,
            "status": txn.payment_status,
            "grand_total": str(txn.grand_total),
        },
        status=201,
    )


def _serialize_referral_code(code):
    return {
        "id": str(code.id),
        "code": code.code,
        "discount_type": code.discount_type,
        "discount_value": str(code.discount_value),
        "max_discount": str(code.max_discount) if code.max_discount is not None else None,
        "quota": code.quota,
        "used_count": code.used_count,
        "is_active": code.is_active,
        "applies_to_all": code.applies_to_all,
        "product_ids": [str(pid) for pid in code.products.values_list("id", flat=True)],
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_referral_codes(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    codes = ReferralCode.objects.prefetch_related("products").order_by("-created_at")
    return JsonResponse(
        {"referral_codes": [_serialize_referral_code(c) for c in codes]}, status=200
    )


def _apply_referral_code_data(referral_code, data):
    referral_code.code = data.get("code", referral_code.code).strip().upper()
    referral_code.discount_type = data.get("discount_type", referral_code.discount_type)
    referral_code.discount_value = data.get("discount_value", referral_code.discount_value)
    referral_code.max_discount = data.get("max_discount") or None
    referral_code.quota = data.get("quota", referral_code.quota)
    referral_code.applies_to_all = data.get("applies_to_all", referral_code.applies_to_all)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_referral_code(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    code_value = (request_data.get("code") or "").strip().upper()
    if not code_value:
        return JsonResponse({"errors": {"code": ["Kode wajib diisi."]}}, status=400)
    if ReferralCode.objects.filter(code__iexact=code_value).exists():
        return JsonResponse({"errors": {"code": ["Kode ini sudah dipakai."]}}, status=400)

    if request_data.get("discount_type") not in DiscountType.values:
        return JsonResponse({"errors": {"discount_type": ["Tipe diskon tidak valid."]}}, status=400)

    referral_code = ReferralCode(
        code=code_value,
        discount_type=request_data["discount_type"],
        discount_value=request_data.get("discount_value") or 0,
        max_discount=request_data.get("max_discount") or None,
        quota=request_data.get("quota") or 0,
        applies_to_all=request_data.get("applies_to_all", True),
    )
    referral_code.save()

    if not referral_code.applies_to_all:
        product_ids = request_data.get("product_ids") or []
        referral_code.products.set(Product.objects.filter(id__in=product_ids))

    log_audit(
        request, AuditAction.CREATE, "referral_codes", object_id=referral_code.id,
        new_data=_serialize_referral_code(referral_code),
    )

    return JsonResponse(
        {"detail": "Kode referral berhasil dibuat.", "referral_code": _serialize_referral_code(referral_code)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_referral_code(request, referral_code_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        referral_code = ReferralCode.objects.get(id=referral_code_id)
    except ReferralCode.DoesNotExist:
        return JsonResponse({"detail": "Kode referral tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    old_data = _serialize_referral_code(referral_code)

    new_quota = request_data.get("quota")
    if new_quota is not None and int(new_quota) < referral_code.used_count:
        return JsonResponse(
            {"errors": {"quota": ["Kuota tidak boleh kurang dari jumlah yang sudah terpakai."]}},
            status=400,
        )

    if "is_active" in request_data and len(request_data) == 1:
        referral_code.is_active = request_data["is_active"]
    else:
        _apply_referral_code_data(referral_code, request_data)
        if "is_active" in request_data:
            referral_code.is_active = request_data["is_active"]

    referral_code.save()

    if not referral_code.applies_to_all and "product_ids" in request_data:
        referral_code.products.set(Product.objects.filter(id__in=request_data["product_ids"]))
    elif referral_code.applies_to_all:
        referral_code.products.clear()

    log_audit(
        request, AuditAction.UPDATE, "referral_codes", object_id=referral_code.id,
        old_data=old_data, new_data=_serialize_referral_code(referral_code),
    )

    return JsonResponse(
        {"detail": "Kode referral berhasil diperbarui.", "referral_code": _serialize_referral_code(referral_code)},
        status=200,
    )


def _serialize_payout(payout):
    source_title = None
    session_date = None
    if payout.mentoring_session_id:
        session = payout.mentoring_session
        source_title = f"{session.mentoring.title} - Sesi {session.order}"
        session_date = session.start_time.isoformat() if session.start_time else None
    elif payout.bootcamp_session_id:
        session = payout.bootcamp_session
        source_title = f"{session.bootcamp.title} - Sesi {session.order}"
        session_date = session.start_time.isoformat() if session.start_time else None

    return {
        "id": str(payout.id),
        "mentor_id": str(payout.mentor_profile_id),
        "mentor_name": payout.mentor_profile.user.fullname,
        "source_type": payout.source_type,
        "source_title": source_title,
        "session_date": session_date,
        "gross_amount": str(payout.gross_amount),
        "fee_percent": payout.fee_percent,
        "net_amount": str(payout.net_amount),
        "status": payout.status,
        "bank_name": payout.mentor_profile.bank_name,
        "bank_account": payout.mentor_profile.bank_account,
        "bank_account_holder": payout.mentor_profile.bank_account_holder,
        "paid_at": payout.paid_at.isoformat() if payout.paid_at else None,
        "created_at": payout.created_at.isoformat(),
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_payouts(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    payouts = MentorPayout.objects.select_related(
        "mentor_profile__user",
        "mentoring_session__mentoring",
        "bootcamp_session__bootcamp",
    ).order_by("-created_at")

    status_filter = request.GET.get("status")
    if status_filter and status_filter != "Semua":
        payouts = payouts.filter(status=status_filter)

    return JsonResponse({"payouts": [_serialize_payout(p) for p in payouts]}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def mark_payout_paid(request, payout_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        payout = MentorPayout.objects.select_related("mentor_profile__user").get(id=payout_id)
    except MentorPayout.DoesNotExist:
        return JsonResponse({"detail": "Data pencairan tidak ditemukan."}, status=404)

    if payout.status == PayoutStatus.PAID:
        return JsonResponse({"detail": "Pencairan ini sudah ditandai lunas sebelumnya."}, status=400)

    payout.status = PayoutStatus.PAID
    payout.paid_at = timezone.now()
    payout.save()

    log_audit(
        request, AuditAction.UPDATE, "mentor_payouts", object_id=payout.id,
        old_data={"status": "pending"}, new_data={"status": "paid"},
    )

    return JsonResponse({"detail": "Pencairan berhasil ditandai lunas.", "payout": _serialize_payout(payout)}, status=200)


@jwt_required
@role_required(UserRole.MENTOR)
def get_my_payouts(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        mentor_profile = request.user.mentor_profile
    except MentorProfile.DoesNotExist:
        return JsonResponse({"detail": "Mentor profile tidak ditemukan."}, status=404)

    payouts = MentorPayout.objects.filter(mentor_profile=mentor_profile).select_related(
        "mentoring_session__mentoring", "bootcamp_session__bootcamp"
    ).order_by("-created_at")

    return JsonResponse({"payouts": [_serialize_payout(p) for p in payouts]}, status=200)