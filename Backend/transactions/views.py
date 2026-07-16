from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, When
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from .models import PaymentStatus, Transaction, TransactionItem
from products.models import Product, ProductType
from django.utils.dateparse import parse_date
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncDate
from django.db import transaction as db_transaction
from mentors.models import MentorAvailability
from .models import Transaction, TransactionItem, UserLibrary, PaymentStatus
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
        "price": str(detail.price),
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
        data.append({
            "transaction_id": item.transaction.id,
            "user_id": str(item.transaction.user.id),
            "user_name": item.transaction.user.fullname,
            "product_id": str(item.product.id),
            "date_time": item.transaction.created_at.isoformat(),
            "amount": str(item.transaction.grand_total),
            "method": item.transaction.payment_method,
            "status": item.transaction.payment_status,
        })

    return JsonResponse(
        {"transactions": data},
        status=200
    )

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
def get_product_revenue_summary(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    base_items = TransactionItem.objects.filter(
        transaction__payment_status=PaymentStatus.PAID
    )

    totals = base_items.aggregate(
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

    revenue_by_type = {
        ProductType.MENTORING: float(totals["mentoring_revenue"] or 0),
        ProductType.BOOTCAMP: float(totals["bootcamp_revenue"] or 0),
        ProductType.MODULE: float(totals["module_revenue"] or 0),
    }

    chart_qs = (
        base_items
        .values("product__type")
        .annotate(revenue=Sum(REVENUE_EXPRESSION))
    )

    revenue_map = {
        row["product__type"]: float(row["revenue"] or 0)
        for row in chart_qs
    }

    chart_data = [
        {
            "product": ProductType.MENTORING,
            "revenue": revenue_map.get(ProductType.MENTORING, 0),
        },
        {
            "product": ProductType.BOOTCAMP,
            "revenue": revenue_map.get(ProductType.BOOTCAMP, 0),
        },
        {
            "product": ProductType.MODULE,
            "revenue": revenue_map.get(ProductType.MODULE, 0),
        },
    ]

    return JsonResponse(
        {
            "total_revenue": float(totals["total_revenue"] or 0),
            "revenue_by_type": revenue_by_type,
            "chart_data": chart_data,
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

DISCOUNT_RATE = 0.10  # sementara: samain dengan logic frontend (10% flat kalau ada voucher)
# TODO: ganti dengan validasi voucher yang sebenarnya begitu ada model Voucher.

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

    if product.type == ProductType.MENTORING and not mentor_availability_id:
        return JsonResponse(
            {"detail": "availability_slot_id diperlukan untuk produk mentoring."},
            status=400,
        )

    price = detail.new_price if getattr(detail, "new_price", None) else detail.original_price
    discount_amount = round(float(price) * DISCOUNT_RATE, 2) if voucher_code else 0
    grand_total = float(price) - discount_amount

    try:
        with db_transaction.atomic():
            mentor_availability = None

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
        
                detail_locked = type(detail).objects.select_for_update().get(pk=detail.pk)

                if getattr(detail_locked, "stock", None) is not None:
                    if detail_locked.stock <= 0:
                        return JsonResponse({"detail": "Stok produk habis."}, status=400)
                    detail_locked.stock -= 1

                detail_locked.sold_count = (detail_locked.sold_count or 0) + 1
                detail_locked.save()

            if product.type == ProductType.MENTORING:
                detail_locked_mentoring = type(detail).objects.select_for_update().get(pk=detail.pk)
                detail_locked_mentoring.sold_count = (detail_locked_mentoring.sold_count or 0) + 1
                detail_locked_mentoring.save()

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

            UserLibrary.objects.create(
                user=request.user,
                transaction_item=item,
                active_date=timezone.now(),
            )

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