import logging
from decimal import Decimal

from django.conf import settings
from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, When
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest, HttpResponse
from django.urls import reverse
from .models import (
    PaymentStatus,
    PaymentMethod,
    PaymentGateway,
    Transaction,
    TransactionItem,
    ReferralCode,
    ReferralCodeUsage,
    DiscountType,
    MentorPayout,
    PayoutStatus,
    IpaymuSetting,
)
from products.models import (
    Product,
    ProductType,
    PaymentGatewayMode,
    UserLibrary,
    MentoringSession,
    BootcampSession,
    BootcampRegistration,
)
from programs.models import BootcampSession as BootcampSessionTemplate
from django.utils.dateparse import parse_date
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole, AuditAction
from accounts.utils import log_audit, notify_team, notify_user, is_rate_limited
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncDate
from django.db import transaction as db_transaction
from mentors.models import MentorAvailability, MentorProfile
from .utils import get_request_data
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


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
            "mentor_availability__mentor_profile__user",
        )
        .order_by("-transaction__created_at")
    )

    data = []

    for item in items:
        product_detail = _serialize_product_detail(item.product)
        slot = item.mentor_availability
        data.append({
            "transaction_id": item.transaction.id,
            "user_id": str(item.transaction.user.id),
            "user_name": item.transaction.user.fullname,
            "product_id": str(item.product.id),
            "product_title": product_detail.get("title") if product_detail else None,
            "date_time": item.transaction.created_at.isoformat(),
            "amount": str(item.transaction.grand_total),
            "method": item.transaction.payment_method,
            "gateway": item.transaction.gateway,
            "status": item.transaction.payment_status,
            "proof_of_payment": item.transaction.proof_of_payment.url if item.transaction.proof_of_payment else None,
            "notes": item.transaction.notes,
            "product_type": item.product.type,
            "mentor_name": slot.mentor_profile.user.fullname if slot else None,
            "session_time": timezone.localtime(slot.start_time).isoformat() if slot else None,
        })

    return JsonResponse(
        {"transactions": data},
        status=200
    )


def _provision_team_members(leader_txn):
    """Dipanggil SEKALI saat pembayaran KETUA tim di-ACC admin (lihat
    verify_transaction). Bikinkan BootcampRegistration + Transaction
    (nominal 0, langsung PAID -- duitnya sudah masuk lewat transaksi
    ketua) + UserLibrary + sesi buat SETIAP anggota yang diundang.
    No-op kalau transaksi ini bukan milik ketua tim (registrasi solo
    biasa tidak punya `led_team_group`)."""
    reg = leader_txn.bootcamp_registration
    grup = getattr(reg, "led_team_group", None)
    if grup is None:
        return

    bootcamp = reg.package.bootcamp
    product = bootcamp.product

    for invite in reg.team_invites.select_related("invitee").all():
        anggota = invite.invitee
        # Jaga-jaga -- kalau anggota ini SUDAH punya pendaftaran sendiri ke
        # bootcamp yang sama (mis. sempat daftar sendiri di tempat lain
        # SETELAH diundang tapi SEBELUM ketua dibayar-ACC, celah yang sudah
        # ditutup di register_bootcamp tapi tetap dicek ulang di sini),
        # lewati saja dia -- jangan bikin dobel atau batalkan seluruh
        # provisioning tim gara-gara satu orang.
        if BootcampRegistration.objects.filter(user=anggota, package__bootcamp=bootcamp).exists():
            logger.warning(
                "Provisioning tim: %s sudah py pendaftaran sendiri di bootcamp %s, dilewati.",
                anggota.email, bootcamp.title,
            )
            continue

        anggota_reg = BootcampRegistration.objects.create(
            user=anggota, package=reg.package,
            status=BootcampRegistration.Status.ACCEPTED,
            registration_group=grup,
        )
        BootcampRegistration.objects.filter(pk=anggota_reg.pk).update(reviewed_at=timezone.now())

        anggota_txn = Transaction.objects.create(
            user=anggota, bootcamp_registration=anggota_reg,
            sub_total=Decimal("0"), commitment_fee_amount=Decimal("0"), grand_total=Decimal("0"),
            payment_method=leader_txn.payment_method, payment_status=PaymentStatus.PAID,
            paid_at=leader_txn.paid_at,
            notes=f"Bagian dari tim -- sudah dibayar ketua ({leader_txn.user.email}).",
        )
        TransactionItem.objects.create(
            transaction=anggota_txn, product=product, price_at_checkout=Decimal("0"), quantity=1,
        )

        anggota_library, _ = UserLibrary.objects.get_or_create(user=anggota, product=product)
        if anggota_library.package_id != reg.package_id:
            anggota_library.package = reg.package
            anggota_library.save(update_fields=["package"])
        _create_bootcamp_sessions(anggota_library, product)

        # Headcount produk nambah per anggota (bukan cuma per transaksi) --
        # supaya sold_count tetap mencerminkan jumlah orang yang beneran
        # dapat akses, walau cuma 1 transaksi asli (punya ketua) yang bawa uang.
        bootcamp.sold_count = (bootcamp.sold_count or 0) + 1
        bootcamp.save(update_fields=["sold_count"])


def _mark_transaction_paid(transaction_id):
    """Inti "tandai lunas" -- IDEMPOTENT & terkunci (select_for_update),
    jadi aman dipanggil berkali-kali dari mana pun (admin PATCH manual lewat
    verify_transaction, webhook iPaymu, atau webhook yang retry) tanpa
    pernah memberi akses dobel. Return (txn, sudah_diproses_sebelumnya: bool).
    Raises Transaction.DoesNotExist kalau id-nya gak ada.

    Ini SATU-SATUNYA tempat akses produk beneran diberikan -- baik dari
    ACC manual admin maupun konfirmasi otomatis iPaymu lewat jalur yang
    persis sama, supaya perilakunya gak pernah berbeda tergantung siapa
    yang memicunya."""
    with db_transaction.atomic():
        # of=("self",) -- kunci CUMA baris Transaction-nya sendiri, bukan ikut
        # mengunci tabel bootcamp_registration/package yang di-JOIN. Postgres
        # menolak "FOR UPDATE" di sisi nullable dari OUTER JOIN begitu aja
        # (bootcamp_registration nullable=True), jadi tanpa `of` di sini bakal
        # kena NotSupportedError persis di titik yang paling sering dipanggil.
        txn = Transaction.objects.select_for_update(of=("self",)).select_related(
            "user", "bootcamp_registration__package"
        ).get(id=transaction_id)

        if txn.payment_status != PaymentStatus.PENDING:
            return txn, True

        items = list(
            txn.items.select_related(
                "product__mentoring_detail",
                "product__module_detail",
                "product__bootcamp_detail",
                "mentor_availability",
            )
        )

        # Baru di sinilah akses produk beneran dikasih -- UserLibrary +
        # sesi-sesinya, plus sold_count baru nambah sekarang (bukan pas
        # checkout), karena transaksi resmi dianggap "terjual" setelah
        # diverifikasi (admin ACC atau webhook iPaymu), bukan pas user baru
        # upload/diarahkan bayar.
        txn.payment_status = PaymentStatus.PAID
        txn.paid_at = timezone.now()

        judul_produk = []
        for item in items:
            product = item.product
            detail = _get_checkout_detail(product)
            if detail is not None and getattr(detail, "title", None):
                judul_produk.append(detail.title)

            user_library, _ = UserLibrary.objects.get_or_create(
                user=txn.user, product=product,
            )

            # Catat paket yang dibeli (kalau ada) -- dipakai buat nge-gate
            # benefit per paket (resource/sesi eksklusif). Cuma keisi
            # buat pembayaran yang lewat alur BootcampRegistration; beli
            # langsung lewat checkout_product lama gak punya info paket.
            if (
                txn.bootcamp_registration_id
                and user_library.package_id != txn.bootcamp_registration.package_id
            ):
                user_library.package = txn.bootcamp_registration.package
                user_library.save(update_fields=["package"])

            if product.type == ProductType.MENTORING and item.mentor_availability:
                _create_mentoring_sessions(user_library, detail, item.mentor_availability)
                # Notifikasi buat MENTOR-nya juga -- ini titik satu-satunya
                # baris MentoringSession beneran dibuat, jadi mentor yang
                # bersangkutan pasti kebagian tahu ada booking baru.
                mentor_user = item.mentor_availability.mentor_profile.user
                notify_user(
                    mentor_user,
                    "Booking Baru",
                    f"{txn.user.fullname} baru saja booking sesi \"{detail.title if detail else product.type}\" "
                    f"pada {timezone.localtime(item.mentor_availability.start_time).strftime('%d %B %Y, %H:%M')} WIB.",
                    url="/mentor/mentoring-schedule",
                )
            elif product.type == ProductType.BOOTCAMP:
                _create_bootcamp_sessions(user_library, product)

            if detail is not None:
                detail.sold_count = (detail.sold_count or 0) + item.quantity
                detail.save(update_fields=["sold_count"])

        # Kalau transaksi ini punya bootcamp_registration yang berstatus
        # KETUA tim, begitu pembayarannya di-ACC di sinilah SEMUA anggota
        # yang diundang otomatis dapat pendaftaran + akses sekaligus --
        # mereka sendiri tidak pernah lewat alur bayar apa pun.
        if txn.bootcamp_registration_id:
            _provision_team_members(txn)

        txn.save()

        notify_user(
            txn.user,
            "Pembayaran Lunas",
            f"Pembayaran kamu untuk \"{', '.join(judul_produk) or txn.id}\" sudah dikonfirmasi. "
            f"Akses produknya sudah terbuka sekarang.",
            url="/user/transactions",
        )

        return txn, False


def _release_transaction(transaction_id, status):
    """Lawan dari _mark_transaction_paid -- lepas lagi semua yang di-reserve
    pas checkout (slot mentor, stok, kuota kode referral) supaya bisa
    dipakai/dibeli ulang. `status` = PaymentStatus.FAILED (ditolak admin/
    kadaluarsa dari sisi kita) atau .EXPIRED (sesi iPaymu kadaluarsa).
    IDEMPOTENT & terkunci, sama seperti _mark_transaction_paid. Return
    (txn, sudah_diproses_sebelumnya: bool)."""
    with db_transaction.atomic():
        txn = Transaction.objects.select_for_update(of=("self",)).select_related("user").get(id=transaction_id)

        if txn.payment_status != PaymentStatus.PENDING:
            return txn, True

        items = list(
            txn.items.select_related(
                "product__mentoring_detail",
                "product__module_detail",
                "product__bootcamp_detail",
                "mentor_availability",
            )
        )

        txn.payment_status = status

        for item in items:
            detail = _get_checkout_detail(item.product)

            if item.mentor_availability_id:
                item.mentor_availability.is_booked = False
                item.mentor_availability.save(update_fields=["is_booked"])
                # TransactionItem.mentor_availability itu OneToOneField --
                # kalau FK-nya TIDAK dilepas di sini, baris item yang sudah
                # gagal/kedaluwarsa ini bakal PERMANEN "mengunci" slot itu di
                # level database (unique constraint), walau is_booked-nya
                # sendiri sudah balik False. Akibatnya slot yang sama gak
                # akan PERNAH bisa dipesan orang lain lagi selamanya. Riwayat
                # transaksinya sendiri tetap utuh (cuma link ke slotnya yang
                # diputus), jadwal & waktunya masih kebaca dari kapan
                # transaksi ini dibuat kalau suatu saat perlu ditelusuri.
                item.mentor_availability = None
                item.save(update_fields=["mentor_availability"])

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
        return txn, False


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def verify_transaction(request, transaction_id):
    if request.method != "PATCH":
        return HttpResponseNotAllowed(["PATCH"])

    try:
        txn = Transaction.objects.get(id=transaction_id)
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

    if decision == "paid":
        txn, sudah = _mark_transaction_paid(transaction_id)
    else:
        txn, sudah = _release_transaction(transaction_id, PaymentStatus.FAILED)

    if sudah:
        return JsonResponse(
            {"detail": "Transaksi ini sudah diverifikasi sebelumnya."}, status=400
        )

    if decision == "failed":
        # Notifikasi ke pembeli CUMA buat penolakan yang dipicu admin --
        # BEDA dari pembatalan sendiri oleh pembeli (cancel_transaction) atau
        # kedaluwarsa reservasi iPaymu, yang keduanya sengaja diam-diam
        # (pembeli sendiri yang minta, atau memang gak sempat bayar).
        notify_user(
            txn.user,
            "Pembayaran Ditolak",
            f"Pembayaran kamu untuk transaksi {txn.id} ditolak oleh tim kami."
            + (f" Alasan: {txn.notes}" if txn.notes else " Hubungi tim support kami untuk info lebih lanjut."),
            url="/user/transactions",
        )

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


def _serialize_commitment_fee_refund(txn):
    reg = txn.bootcamp_registration
    package = reg.package if reg else None
    bootcamp = package.bootcamp if package else None

    sessions_completed = 0
    sessions_total = 0
    if bootcamp is not None:
        library = UserLibrary.objects.filter(user_id=txn.user_id, product_id=bootcamp.product_id).first()
        if library is not None:
            buyer_sessions = list(library.bootcamp_sessions.all())
            sessions_total = len(buyer_sessions)
            sessions_completed = sum(
                1 for s in buyer_sessions if s.status == BootcampSession.SessionStatus.COMPLETED
            )

    min_required = package.min_attendance_sessions if package else 0

    return {
        "transaction_id": txn.id,
        "user_name": txn.user.fullname,
        "user_email": txn.user.email,
        "bootcamp_title": bootcamp.title if bootcamp else None,
        "package_name": package.name if package else None,
        "commitment_fee_amount": str(txn.commitment_fee_amount),
        "paid_at": txn.paid_at.isoformat() if txn.paid_at else None,
        "sessions_completed": sessions_completed,
        "sessions_total": sessions_total,
        "min_attendance_sessions": min_required,
        "eligible": sessions_completed >= min_required,
        "refunded_at": txn.commitment_fee_refunded_at.isoformat() if txn.commitment_fee_refunded_at else None,
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_commitment_fee_refunds(request):
    """Daftar semua transaksi Mentee yang lunas & punya commitment fee --
    dipakai admin buat tracking pengembalian commitment fee menjelang akhir
    program. 'eligible' cuma indikator otomatis dari syarat kehadiran
    (kalau diatur admin di paket) -- keputusan kembalikan/tidak tetap
    manual, tombol toggle gak dikunci walau eligible=False."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    txns = (
        Transaction.objects.filter(commitment_fee_amount__gt=0, payment_status=PaymentStatus.PAID)
        .select_related("user", "bootcamp_registration__package__bootcamp")
        .order_by("-paid_at")
    )
    return JsonResponse(
        {"refunds": [_serialize_commitment_fee_refund(t) for t in txns]}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def toggle_commitment_fee_refund(request, transaction_id):
    """Tandai/batal-tandai commitment fee sebuah transaksi sudah
    dikembalikan -- murni pencatatan status, transfer beneran dilakukan
    admin di luar sistem (manual, sama kayak alur pengembalian lain di
    platform ini)."""
    if request.method != "PATCH":
        return HttpResponseNotAllowed(["PATCH"])

    try:
        txn = Transaction.objects.select_related(
            "user", "bootcamp_registration__package__bootcamp"
        ).get(id=transaction_id)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if txn.commitment_fee_amount <= 0:
        return JsonResponse({"detail": "Transaksi ini tidak memiliki commitment fee."}, status=400)
    if txn.payment_status != PaymentStatus.PAID:
        return JsonResponse({"detail": "Transaksi ini belum lunas."}, status=400)

    txn.commitment_fee_refunded_at = None if txn.commitment_fee_refunded_at else timezone.now()
    txn.save(update_fields=["commitment_fee_refunded_at"])

    log_audit(
        request, AuditAction.UPDATE, "transactions", object_id=txn.id,
        new_data={"commitment_fee_refunded_at": str(txn.commitment_fee_refunded_at)},
    )

    return JsonResponse(
        {"detail": "Status pengembalian commitment fee diperbarui.",
         "refund": _serialize_commitment_fee_refund(txn)},
        status=200,
    )


@jwt_required
def get_my_transactions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = (
        TransactionItem.objects.filter(transaction__user=request.user)
        .select_related(
            "transaction", "product",
            "mentor_availability__mentor_profile__user",
        )
        .order_by("-transaction__created_at")
    )

    data = []
    for item in items:
        product_detail = _serialize_product_detail(item.product)
        # Cuma keisi buat item MENTORING yang jadwalnya masih nyambung --
        # transaksi yang dilepas (gagal/kedaluwarsa) sengaja MEMUTUS FK ini
        # (lihat _release_transaction), jadi None di sini itu wajar buat
        # transaksi yang gak pernah kepakai jadwalnya.
        mentor_name = None
        session_time = None
        slot = item.mentor_availability
        if slot is not None:
            mentor_name = slot.mentor_profile.user.fullname
            session_time = timezone.localtime(slot.start_time).isoformat()

        data.append(
            {
                "transaction_id": item.transaction.id,
                "product_id": str(item.product.id),
                "product_type": item.product.type,
                "product_title": product_detail.get("title") if product_detail else None,
                "created_at": item.transaction.created_at.isoformat(),
                "amount": str(item.transaction.grand_total),
                "method": item.transaction.payment_method,
                "gateway": item.transaction.gateway,
                "status": item.transaction.payment_status,
                "proof_of_payment": item.transaction.proof_of_payment.url if item.transaction.proof_of_payment else None,
                "notes": item.transaction.notes,
                "mentor_name": mentor_name,
                "session_time": session_time,
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
    baris progress per-pembeli di products.BootcampSession. Template dengan
    required_benefit terisi cuma di-clone kalau paket pembeli (user_library.package)
    punya benefit_<required_benefit> True -- template kosong (sesi inti) tetap
    di-clone ke semua pembeli, sama kayak perilaku sebelumnya."""
    templates = (
        BootcampSessionTemplate.objects.filter(bootcamp=product.id)
        .prefetch_related("session_mentors__mentor_profile", "packages")
        .order_by("start_time")
    )
    package = user_library.package

    order = 0
    for template in templates:
        # Pembatasan sekarang per-paket & eksplisit. for_all_packages=True
        # berarti semua pembeli bootcamp ini dapat; kalau False, cuma paket
        # yang terdaftar. Sengaja TIDAK pakai aturan "daftar kosong = semua":
        # sesi yang dibatasi tapi belum dipilih paketnya harus tetap tertutup,
        # bukan malah kebuka ke semua orang.
        if not template.for_all_packages:
            if not package or not template.packages.filter(pk=package.pk).exists():
                continue
        elif template.required_benefit:
            # Jaring pengaman buat data/jalur lama yang masih pakai
            # required_benefit dan belum dipindah ke daftar paket. Tanpa ini,
            # sesi eksklusif yang dibuat cara lama diam-diam kebuka ke SEMUA
            # peserta -- pelonggaran izin yang gak kelihatan sampai ada yang
            # protes. Aturan lamanya tetap ditegakkan sampai datanya dipindah.
            if not package or not getattr(package, f"benefit_{template.required_benefit}", False):
                continue
        order += 1
        session = BootcampSession.objects.create(
            bootcamp_id=product.id,
            user_library=user_library,
            template=template,
            order=order,
            title=template.title,
            start_time=template.start_time,
            status=BootcampSession.SessionStatus.SCHEDULED,
            meeting_link=template.meeting_link or "",
        )
        mentor_profiles = [a.mentor_profile for a in template.session_mentors.all()]
        if mentor_profiles:
            session.mentors.set(mentor_profiles)


# Berkas yang boleh diunggah di alur checkout. Dipakai bareng buat bukti bayar
# DAN dokumen syarat bootcamp -- sebelumnya tiga dokumen bootcamp cuma dicek
# "ada atau nggak", tanpa batas ukuran maupun tipe, jadi bisa dipakai nitip
# file apa pun ke storage.
CHECKOUT_ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
CHECKOUT_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _validate_checkout_upload(f, label):
    """Balikin pesan error, atau None kalau berkasnya lolos.

    Ekstensi gampang dipalsukan, jadi isinya ikut diperiksa: yang ngaku gambar
    di-parse Pillow, yang ngaku PDF dicek penanda '%PDF' di awal berkas.
    """
    name = f.name or ""
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in CHECKOUT_ALLOWED_EXTENSIONS:
        return f"{label} harus berformat JPG, PNG, atau PDF."
    if f.size > CHECKOUT_MAX_FILE_SIZE:
        return f"Ukuran {label.lower()} maksimal 5MB."

    if ext == "pdf":
        try:
            f.seek(0)
            head = f.read(5)
            f.seek(0)
        except Exception:
            return None
        if head[:4] != b"%PDF":
            return f"{label} bukan berkas PDF yang valid."
    else:
        from mark_up.imaging import is_real_image
        if not is_real_image(f):
            return f"{label} bukan gambar yang valid."
    return None


# Berapa lama transaksi IPAYMU (belum dibayar, tanpa bukti apa pun) boleh
# menahan reservasi slot mentor / stok sebelum otomatis dilepas lagi.
# MANUAL sengaja TIDAK pakai ini -- lihat catatan di Transaction.expires_at.
RESERVATION_MINUTES = 5


def _release_expired_transactions(queryset=None):
    """Cari transaksi PENDING yang sudah lewat expires_at (cuma ada buat
    gateway=IPAYMU) dan lepas reservasinya satu per satu lewat
    _release_transaction yang sudah idempotent & row-locked. Dipanggil dari
    DUA tempat:
      1. Management command terjadwal (cron ~tiap 2 menit) -- jaring pengaman
         umum, gak nunggu ada yang bentrok baru kelepas.
      2. Lazy, PERSIS di titik kontensi (pas checkout_product/create_bootcamp_payment
         mau reservasi slot/stok yang sama) -- biar reservasi basi langsung
         kelepas SAAT itu juga, gak nunggu jadwal cron berikutnya.
    Return jumlah yang dilepas."""
    qs = queryset if queryset is not None else Transaction.objects.all()
    kadaluarsa = qs.filter(
        payment_status=PaymentStatus.PENDING,
        expires_at__isnull=False,
        expires_at__lt=timezone.now(),
    )
    dilepas = 0
    for transaction_id in list(kadaluarsa.values_list("id", flat=True)):
        try:
            _txn, sudah = _release_transaction(transaction_id, PaymentStatus.EXPIRED)
            if not sudah:
                dilepas += 1
        except Transaction.DoesNotExist:
            continue
    return dilepas


@csrf_exempt
@jwt_required
def checkout_product(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    if is_rate_limited(f"rl:checkout:user:{request.user.id}", limit=20, window_seconds=3600):
        return JsonResponse(
            {"detail": "Terlalu banyak percobaan checkout. Coba lagi nanti."}, status=429
        )

    # Gate profil dicek paling awal -- pesannya paling relevan buat user yang
    # profilnya belum lengkap (sebelum diminta bukti bayar dsb). FE juga udah
    # nge-redirect ke Pengaturan sebelum sampe sini, ini jaring pengaman.
    if not request.user.is_profile_complete():
        return JsonResponse(
            {"detail": "Mohon lengkapi profil kamu di halaman Pengaturan sebelum membeli produk."},
            status=400,
        )

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    product_id = request_data.get("product_id")
    voucher_code = request_data.get("voucher_code")
    buyer_phone = request_data.get("buyer_phone")
    mentor_availability_id = request_data.get("availability_slot_id")
    notes = (request_data.get("notes") or "").strip()
    proof_file = request.FILES.get("proof_of_payment")

    # payment_gateway OPT-IN -- kalau gak dikirim (persis perilaku frontend
    # yang sudah jalan sekarang), sama sekali gak ada yang berubah di bawah
    # ini, tetap jalur manual seperti biasa. iPaymu cuma aktif kalau field
    # ini eksplisit "IPAYMU" DAN _ipaymu_allowed_for_product(product) True
    # (saklar master IpaymuSetting.is_enabled DAN produk ini gak dipaksa
    # MANUAL_ONLY -- lihat products.models.PaymentGatewayMode).
    payment_gateway = (request_data.get("payment_gateway") or PaymentGateway.MANUAL).upper()
    if payment_gateway not in (PaymentGateway.MANUAL, PaymentGateway.IPAYMU):
        return JsonResponse({"detail": "payment_gateway tidak dikenali."}, status=400)

    if not product_id:
        return JsonResponse({"detail": "product_id diperlukan."}, status=400)

    try:
        product = Product.objects.select_related(
            "mentoring_detail", "module_detail", "bootcamp_detail"
        ).get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    if payment_gateway == PaymentGateway.MANUAL:
        if not proof_file:
            return JsonResponse({"detail": "Bukti pembayaran diperlukan."}, status=400)

        err = _validate_checkout_upload(proof_file, "Bukti pembayaran")
        if err:
            return JsonResponse({"detail": err}, status=400)
    else:
        if not _ipaymu_allowed_for_product(product):
            return JsonResponse(
                {"detail": "Pembayaran iPaymu belum aktif untuk produk ini, gunakan transfer bank manual."}, status=400
            )

    # Bootcamp WAJIB lewat jalur pendaftaran sendiri (daftar -> diseleksi/
    # di-ACC -> baru bayar), bukan checkout langsung -- endpoint ini gak
    # pernah nge-gate lewat seleksi/ACC admin sama sekali. Dulu jalur ini
    # masih menerima BOOTCAMP (dengan syarat bukti follow/share/commitment
    # letter terpisah), tapi begitu ada halaman pendaftaran khusus, gak ada
    # lagi UI yang mengarah ke sini untuk bootcamp -- ditutup di sini juga
    # supaya gak bisa dilewati manual lewat API.
    if product.type == ProductType.BOOTCAMP:
        return JsonResponse(
            {"detail": "Bootcamp harus didaftar lewat halaman pendaftaran bootcamp, bukan checkout langsung."},
            status=400,
        )

    detail = None
    if product.type == ProductType.MENTORING:
        detail = getattr(product, "mentoring_detail", None)
    elif product.type == ProductType.MODULE:
        detail = getattr(product, "module_detail", None)

    if detail is None or not detail.is_active:
        return JsonResponse({"detail": "Produk tidak tersedia."}, status=400)

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

                # Cek ulang PERSIS di sini, di dalam kuncinya -- kalau slot ini
                # kelihatan "dibooking" tapi ternyata itu reservasi IPAYMU yang
                # udah lewat 5 menit tanpa dibayar, lepas dulu sebelum ditolak.
                # Ini yang bikin "klik Bayar" beneran ngecek ulang ketersediaan,
                # bukan cuma percaya status is_booked yang mungkin sudah basi.
                if mentor_availability.is_booked:
                    _release_expired_transactions(
                        Transaction.objects.filter(items__mentor_availability=mentor_availability)
                    )
                    mentor_availability.refresh_from_db()

                if mentor_availability.is_booked:
                    return JsonResponse({"detail": "Slot ini sudah dibooking orang lain."}, status=400)

                mentor_availability.is_booked = True
                mentor_availability.save()

            elif product.type == ProductType.MODULE:
                # Stok di-reserve begitu checkout (biar nggak oversell selama
                # nunggu verifikasi admin, yang bisa makan waktu 1x24 jam),
                # tapi sold_count BARU nambah begitu admin approve (lihat
                # verify_transaction) -- supaya angka "terjual" yang tampil ke
                # publik nggak ikut kehitung transaksi yang masih pending/gagal.
                #
                # Lepas dulu reservasi IPAYMU basi (lihat catatan MENTORING di
                # atas, alasannya sama) sebelum nge-cek stok -- kalau ada
                # transaksi kadaluarsa yang masih nahan unit, itu harus balik
                # ke stok dulu sebelum kita putuskan stoknya habis atau tidak.
                _release_expired_transactions(
                    Transaction.objects.filter(items__product=product)
                )

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
                proof_of_payment=proof_file if payment_gateway == PaymentGateway.MANUAL else None,
                payment_status=PaymentStatus.PENDING,
                notes=notes,
                gateway=payment_gateway,
                # MANUAL: None -- gak ada batas waktu, bukti udah dilampirkan,
                # tinggal nunggu admin tinjau (lihat catatan di model).
                expires_at=(
                    timezone.now() + timedelta(minutes=RESERVATION_MINUTES)
                    if payment_gateway == PaymentGateway.IPAYMU else None
                ),
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

    except Exception:
        # Detail exception-nya SENGAJA nggak dikirim ke klien. str(e) di sini
        # bisa berisi nama tabel/kolom/constraint dari psycopg, atau nama
        # bucket & endpoint dari botocore -- itu peta gratis buat penyerang,
        # dan user sendiri nggak bisa berbuat apa-apa sama pesan begitu.
        # Traceback lengkapnya masuk log server buat tim.
        logger.exception("Checkout gagal untuk user %s", getattr(request.user, "id", None))
        return JsonResponse(
            {"detail": "Checkout gagal diproses. Coba lagi, atau hubungi tim kami kalau terus berulang."},
            status=500,
        )

    # Notifikasi ke tim -- ada transaksi baru yang nunggu diverifikasi admin.
    # Dikirim setelah DB transaction commit (di luar block atomic) biar
    # latency email nggak nahan lock DB. Cuma buat jalur MANUAL -- transaksi
    # iPaymu diverifikasi otomatis lewat webhook, gak butuh aksi admin, jadi
    # email "tolong verifikasi" di sini bakal nyasar/gak relevan buat itu.
    product_title = getattr(detail, "title", None) or "-"
    if payment_gateway == PaymentGateway.MANUAL:
        notify_team(
            f"Transaksi baru menunggu verifikasi ({txn.id})",
            f"Ada transaksi baru yang butuh diverifikasi admin.\n\n"
            f"ID Transaksi: {txn.id}\n"
            f"Pembeli: {request.user.fullname} ({request.user.email})\n"
            f"Produk: {product_title}\n"
            f"Total: Rp {txn.grand_total}\n\n"
            f"Cek & verifikasi di dashboard admin -> Transaksi.",
        )

    return JsonResponse(
        {
            "detail": "Transaksi berhasil dibuat, menunggu verifikasi admin.",
            "transaction_id": txn.id,
            "status": txn.payment_status,
            "grand_total": str(txn.grand_total),
        },
        status=201,
    )


# ============================================================================
# iPaymu -- pembeli
# ============================================================================

@jwt_required
def get_transaction_status(request, transaction_id):
    """Status ringkas satu transaksi milik sendiri -- dipakai halaman
    kembalian iPaymu (2.4) buat polling tanpa perlu narik seluruh daftar
    transaksi. Webhook, BUKAN halaman ini, yang benar-benar mengubah status;
    endpoint ini cuma baca."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        txn = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    return JsonResponse(
        {
            "transaction_id": txn.id,
            "payment_status": txn.payment_status,
            "payment_method": txn.payment_method,
            "gateway": txn.gateway,
            "grand_total": str(txn.grand_total),
            "paid_at": txn.paid_at.isoformat() if txn.paid_at else None,
        },
        status=200,
    )


@csrf_exempt
@jwt_required
def cancel_transaction(request, transaction_id):
    """Pembeli membatalkan sendiri transaksi PENDING miliknya -- dipakai
    tombol "Batalkan Pembayaran" di halaman Transaksi Saya, terutama buat
    transaksi IPAYMU yang link bayarnya sudah ditutup/gak jadi dibayar,
    biar slot/stoknya langsung lepas lagi tanpa perlu nunggu kedaluwarsa
    otomatis. Dipakai lewat _release_transaction yang sama persis dengan
    yang dipakai webhook & ACC admin -- idempotent & row-locked, jadi aman
    kalau pembeli klik dobel atau bentrok dengan webhook yang kebetulan
    masuk di saat bersamaan (siapa pun yang dapat lock duluan yang menang,
    yang belakangan cuma no-op)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        # Punya sendiri saja -- 404 (bukan 403) biar gak bocorin eksistensi
        # transaksi orang lain, sama seperti create_ipaymu_session.
        txn = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if txn.payment_status != PaymentStatus.PENDING:
        return JsonResponse(
            {"detail": "Transaksi ini sudah tidak bisa dibatalkan."}, status=400
        )

    txn, sudah = _release_transaction(transaction_id, PaymentStatus.FAILED)
    if sudah:
        return JsonResponse(
            {"detail": "Transaksi ini sudah tidak bisa dibatalkan."}, status=400
        )

    if not txn.notes:
        txn.notes = "Dibatalkan oleh pembeli."
        txn.save(update_fields=["notes"])

    log_audit(
        request, AuditAction.UPDATE, "transactions", object_id=txn.id,
        old_data={"status": "PENDING"}, new_data={"status": txn.payment_status, "cancelled_by": "buyer"},
    )

    return JsonResponse(
        {"detail": "Transaksi dibatalkan.", "transaction_id": txn.id, "status": txn.payment_status},
        status=200,
    )


@csrf_exempt
@jwt_required
def create_ipaymu_session(request, transaction_id):
    """Bikin sesi pembayaran iPaymu buat satu Transaction yang SUDAH ada
    (dibuat lewat checkout_product atau create_bootcamp_payment dengan
    payment_gateway=IPAYMU). Dipanggil sekali lagi SETELAH transaksinya
    dibuat, bukan digabung jadi satu langkah -- supaya endpoint ini bisa
    dipakai dua jalur checkout yang berbeda (beli langsung & bayar
    pendaftaran bootcamp) tanpa duplikasi logika, karena di titik ini
    keduanya sudah sama-sama cuma berupa baris Transaction biasa."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:ipaymu-session:user:{request.user.id}", limit=10, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        # Punya sendiri saja -- jangan bocorkan eksistensi transaksi orang
        # lain lewat 404 vs 403 yang beda.
        txn = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if txn.gateway != PaymentGateway.IPAYMU:
        return JsonResponse({"detail": "Transaksi ini bukan transaksi iPaymu."}, status=400)
    if txn.payment_status != PaymentStatus.PENDING:
        return JsonResponse({"detail": "Transaksi ini sudah tidak menunggu pembayaran."}, status=400)

    # Lapis kedua (bukan cuma dicek di checkout_product) -- jaga-jaga kalau
    # admin ngubah produk ini jadi MANUAL_ONLY SETELAH transaksinya kepalanjur
    # dibuat gateway=IPAYMU, atau ada jalur lain yang lolos dari cek pertama.
    item_pertama = txn.items.select_related("product").first()
    if item_pertama and not _ipaymu_allowed_for_product(item_pertama.product):
        return JsonResponse({"detail": "Pembayaran iPaymu belum aktif untuk produk ini."}, status=400)

    setting = IpaymuSetting.get_solo()
    if not setting.is_enabled:
        return JsonResponse({"detail": "Pembayaran iPaymu belum aktif."}, status=400)

    from mark_up.ipaymu import create_payment_session

    return_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/payment/ipaymu/return/?transaction_id={txn.id}"
    notify_url = request.build_absolute_uri(reverse("api_ipaymu_webhook"))

    session_id, url, err = create_payment_session(
        setting,
        transaction=txn,
        buyer_name=request.user.fullname,
        buyer_phone=txn.buyer_phone or getattr(request.user, "phone", "") or "",
        buyer_email=request.user.email,
        return_url=return_url,
        notify_url=notify_url,
        cancel_url=return_url,
        expired_hours=setting.default_expired_hours,
    )
    if err:
        logger.error("iPaymu: gagal bikin sesi buat transaksi %s: %s", txn.id, err)
        return JsonResponse(
            {"detail": "Gagal menghubungi iPaymu, coba lagi sebentar lagi."}, status=502
        )

    txn.ipaymu_session_id = session_id
    txn.save(update_fields=["ipaymu_session_id"])

    return JsonResponse({"redirect_url": url, "session_id": session_id}, status=200)


@csrf_exempt
@jwt_required
def create_ipaymu_qris(request, transaction_id):
    """QRIS Direct Payment -- BEDA dari create_ipaymu_session di atas: gak
    ada redirect_url, QR-nya (qr_string) digambar langsung di halaman
    MarkUp. Dipanggil dengan pola yang sama (SETELAH transaksinya dibuat
    lewat checkout_product/create_bootcamp_payment), dan idempotent-ish --
    kalau dipanggil ulang selagi qr_string yang lama masih berlaku
    (expires_at belum lewat), balikin yang LAMA apa adanya, gak minta QR
    baru ke iPaymu tiap kali pembeli reload halaman bayarnya."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:ipaymu-qris:user:{request.user.id}", limit=10, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        txn = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if txn.gateway != PaymentGateway.IPAYMU:
        return JsonResponse({"detail": "Transaksi ini bukan transaksi iPaymu."}, status=400)
    if txn.payment_status != PaymentStatus.PENDING:
        return JsonResponse({"detail": "Transaksi ini sudah tidak menunggu pembayaran."}, status=400)

    # Lapis kedua, sama alasannya kayak create_ipaymu_session.
    item_pertama = txn.items.select_related("product").first()
    if item_pertama and not _ipaymu_allowed_for_product(item_pertama.product):
        return JsonResponse({"detail": "Pembayaran iPaymu belum aktif untuk produk ini."}, status=400)

    setting = IpaymuSetting.get_solo()
    if not setting.is_enabled:
        return JsonResponse({"detail": "Pembayaran iPaymu belum aktif."}, status=400)

    # Reservasinya (expires_at) masih berlaku & QR lama masih ada -> gak
    # perlu minta yang baru, biar pembeli yang reload halaman bayar tetap
    # lihat QR yang SAMA (nominal & kode QR yang sama persis) selama masih
    # dalam jendela 5 menitnya.
    if txn.ipaymu_qr_string and txn.expires_at and txn.expires_at > timezone.now():
        return JsonResponse(
            {"qr_string": txn.ipaymu_qr_string, "total": int(txn.grand_total), "expires_at": txn.expires_at.isoformat()},
            status=200,
        )

    from mark_up.ipaymu import create_qris_payment

    notify_url = request.build_absolute_uri(reverse("api_ipaymu_webhook"))

    data, err = create_qris_payment(
        setting,
        transaction=txn,
        buyer_name=request.user.fullname,
        buyer_phone=txn.buyer_phone or getattr(request.user, "phone", "") or "",
        buyer_email=request.user.email,
        notify_url=notify_url,
        expired_minutes=RESERVATION_MINUTES,
    )
    if err:
        logger.error("iPaymu: gagal bikin QRIS buat transaksi %s: %s", txn.id, err)
        return JsonResponse(
            {"detail": "Gagal menghubungi iPaymu, coba lagi sebentar lagi."}, status=502
        )

    txn.ipaymu_qr_string = data["qr_string"]
    txn.save(update_fields=["ipaymu_qr_string"])

    return JsonResponse(
        {"qr_string": data["qr_string"], "total": data.get("total") or int(txn.grand_total),
         "expires_at": txn.expires_at.isoformat() if txn.expires_at else None},
        status=200,
    )


def _ipaymu_allowed_for_product(product):
    """True kalau iPaymu boleh ditawarkan buat SATU produk ini -- gabungan
    saklar MASTER (IpaymuSetting.is_enabled) + mode per-produk (lihat
    catatan lengkap di products.models.PaymentGatewayMode). `product` boleh
    None (dipanggil tanpa konteks produk tertentu) -- di titik itu cuma
    saklar master yang dicek, sama seperti perilaku lama sebelum field ini
    ada."""
    if not IpaymuSetting.get_solo().is_enabled:
        return False
    if product is None:
        return True
    mode = getattr(product, "payment_gateway_mode", PaymentGatewayMode.AUTO)
    return mode != PaymentGatewayMode.MANUAL_ONLY


def is_ipaymu_available(request):
    """PUBLIK, tanpa login -- dipakai halaman checkout buat tau apakah
    pemilih metode iPaymu perlu ditampilkan sama sekali. Sengaja gak
    membocorkan detail lain (VA, mode sandbox/production, dst).

    `?product_id=` OPSIONAL -- kalau dikirim, hasilnya juga memperhitungkan
    payment_gateway_mode produk itu (mis. produk yang dipaksa MANUAL_ONLY
    balik False walau saklar master nyala). Tanpa product_id, cuma saklar
    master yang dicek -- ini yang bikin endpoint ini tetap backward-compatible
    buat pemanggil yang belum tahu konteks produk mana."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    product = None
    product_id = request.GET.get("product_id")
    if product_id:
        product = Product.objects.filter(id=product_id).only("id", "payment_gateway_mode").first()

    return JsonResponse({"enabled": _ipaymu_allowed_for_product(product)}, status=200)


@csrf_exempt
def ipaymu_webhook(request):
    """Dipanggil iPaymu sendiri (unotify) -- BUKAN pembeli, BUKAN admin.
    SENGAJA cuma @csrf_exempt, TANPA @jwt_required: ini pemanggil eksternal
    yang gak pernah login ke MarkUp, jadi gak punya token bearer apa pun buat
    dikirim. Batas keamanannya di sini adalah verifikasi signature request,
    BUKAN autentikasi Django -- endpoint pertama di codebase ini dengan pola
    begitu, makanya dikomentari detail.

    Selalu balas 200 kalau requestnya sudah "ditangani" (termasuk yang
    ditolak/diabaikan) supaya iPaymu berhenti retry -- 200 cuma berarti
    "sudah kami terima & proses", bukan "pembayaran sukses"."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        setting = IpaymuSetting.get_solo()
        raw_body = request.body

        from mark_up.ipaymu import verify_webhook_signature, map_via_channel_to_payment_method

        if not verify_webhook_signature(setting, request.headers, raw_body):
            logger.warning(
                "iPaymu webhook: signature TIDAK VALID, diabaikan. body[:300]=%r", raw_body[:300]
            )
            return HttpResponse(status=200)

        # get_request_data aman dipakai SETELAH verifikasi signature (yang
        # sudah baca request.body mentah) -- Django cache body-nya, jadi bisa
        # dibaca ulang tanpa masalah lewat request.POST/json.loads di sini.
        payload = get_request_data(request)
        if payload is None:
            try:
                import json
                payload = json.loads(raw_body.decode() or "{}")
            except Exception:
                logger.warning("iPaymu webhook: body gak bisa di-parse sama sekali.")
                return HttpResponse(status=200)

        reference_id = str(payload.get("reference_id") or "").strip()
        status_code = str(payload.get("status_code") or "").strip()

        try:
            txn = Transaction.objects.get(id=reference_id, gateway=PaymentGateway.IPAYMU)
        except Transaction.DoesNotExist:
            # Termasuk sesi TESTCONN-* dari tombol Uji Koneksi -- memang
            # sengaja dirancang gak pernah cocok Transaction sungguhan.
            logger.info("iPaymu webhook: reference_id %r gak ketemu (mungkin sesi uji), diabaikan.", reference_id)
            return HttpResponse(status=200)

        # Audit -- disimpan lepas dari status_code apa pun, biar ada jejak
        # kalau nanti ada sengketa pembayaran.
        Transaction.objects.filter(pk=txn.pk).update(ipaymu_last_webhook=payload)

        if status_code == "1":
            txn, sudah = _mark_transaction_paid(reference_id)
            if not sudah:
                via = payload.get("via")
                channel = payload.get("channel")
                txn.payment_method = map_via_channel_to_payment_method(via, channel)
                txn.save(update_fields=["payment_method"])
                logger.info("iPaymu webhook: transaksi %s LUNAS (via=%s, channel=%s).", txn.id, via, channel)
                notify_team(
                    f"Pembayaran iPaymu diterima ({txn.id})",
                    f"Transaksi {txn.id} lunas otomatis lewat iPaymu.\n\n"
                    f"Pembeli: {txn.user.fullname} ({txn.user.email})\n"
                    f"Total: Rp {txn.grand_total}\n"
                    f"Metode: {via}/{channel}\n\n"
                    f"Akses produk sudah terbuka otomatis, gak perlu ACC manual.",
                )
            elif txn.payment_status == PaymentStatus.EXPIRED:
                # Kasus langka tapi serius: pembeli BENERAN bayar di iPaymu,
                # tapi baru sampai SETELAH reservasinya kami lepas duluan
                # (lewat 5 menit) -- uangnya sudah masuk, tapi slot/stoknya
                # mungkin sudah diambil orang lain. Sengaja TIDAK otomatis
                # dipaksa PAID lagi di sini (bisa nabrak reservasi baru punya
                # orang lain) -- butuh admin cek manual & putuskan sendiri.
                logger.error(
                    "iPaymu webhook: transaksi %s BAYAR SUKSES tapi reservasinya SUDAH KEDALUWARSA -- perlu cek manual.",
                    txn.id,
                )
                notify_team(
                    f"[PERLU CEK MANUAL] Pembayaran iPaymu terlambat ({txn.id})",
                    f"Transaksi {txn.id} baru dikonfirmasi LUNAS oleh iPaymu, tapi reservasinya "
                    f"(slot mentor/stok) SUDAH kami lepas duluan karena lewat {RESERVATION_MINUTES} "
                    f"menit tanpa kabar dari iPaymu.\n\n"
                    f"Pembeli: {txn.user.fullname} ({txn.user.email})\n"
                    f"Total: Rp {txn.grand_total}\n\n"
                    f"Uangnya sudah masuk -- mohon dicek manual apakah slot/stoknya masih bisa "
                    f"dikasih ke pembeli ini, atau perlu diproses refund kalau sudah terlanjur "
                    f"diambil orang lain.",
                )
        elif status_code == "-2":
            _release_transaction(reference_id, PaymentStatus.EXPIRED)
            logger.info("iPaymu webhook: transaksi %s KEDALUWARSA.", txn.id)
        else:
            logger.info("iPaymu webhook: transaksi %s status_code=%r, belum final, no-op.", txn.id, status_code)

        return HttpResponse(status=200)
    except Exception:
        # Kegagalan di sisi kita jangan bikin iPaymu retry selamanya percuma
        # buat bug yang gak akan pernah sembuh sendiri lewat retry -- tetap
        # balas 200, tapi tercatat lengkap di log server buat ditindaklanjuti.
        logger.exception("iPaymu webhook: gagal diproses.")
        return HttpResponse(status=200)


# ============================================================================
# iPaymu -- pengaturan admin
# ============================================================================

@jwt_required
@role_required(UserRole.ADMIN)
def get_ipaymu_setting(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from mark_up.ipaymu import decrypt_secret, IpaymuCredentialError

    setting = IpaymuSetting.get_solo()
    hint = ""
    if setting.api_key_encrypted:
        try:
            plain = decrypt_secret(setting.api_key_encrypted)
            hint = f"****{plain[-4:]}" if len(plain) >= 4 else "****"
        except IpaymuCredentialError:
            hint = "?"

    return JsonResponse(
        {
            "va_number": setting.va_number,
            "api_key_hint": hint,
            "is_sandbox": setting.is_sandbox,
            "is_enabled": setting.is_enabled,
            "default_expired_hours": setting.default_expired_hours,
            "key_ready": bool(getattr(settings, "IPAYMU_CRED_KEY", "")),
            "last_check_at": setting.last_check_at.isoformat() if setting.last_check_at else None,
            "last_check_ok": setting.last_check_ok,
            "last_check_note": setting.last_check_note,
            "last_check_url": setting.last_check_url,
        },
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_ipaymu_setting(request):
    if request.method not in ("PATCH", "PUT"):
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    from mark_up.ipaymu import encrypt_secret, IpaymuCredentialError

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    setting = IpaymuSetting.get_solo()
    errors = {}
    old_enabled, old_sandbox = setting.is_enabled, setting.is_sandbox

    if "va_number" in data:
        setting.va_number = (data["va_number"] or "").strip()

    # api_key WRITE-ONLY -- kosong/gak dikirim = jangan diubah. Ini yang
    # mencegah frontend perlu (dan gak pernah bisa) menampilkan ulang secret
    # yang sudah tersimpan.
    if data.get("api_key"):
        try:
            setting.api_key_encrypted = encrypt_secret(data["api_key"].strip())
        except IpaymuCredentialError as exc:
            errors["api_key"] = [str(exc)]

    if "is_sandbox" in data:
        setting.is_sandbox = bool(data["is_sandbox"])

    if "is_enabled" in data:
        if bool(data["is_enabled"]) and not setting.api_key_encrypted:
            errors["is_enabled"] = ["Isi API Key dulu sebelum mengaktifkan iPaymu."]
        else:
            setting.is_enabled = bool(data["is_enabled"])

    if "default_expired_hours" in data:
        try:
            jam = int(data["default_expired_hours"])
            if jam < 1:
                raise ValueError
            setting.default_expired_hours = jam
        except (TypeError, ValueError):
            errors["default_expired_hours"] = ["Harus angka jam, minimal 1."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    setting.save()

    log_audit(
        request, AuditAction.UPDATE, "ipaymu_setting", object_id="1",
        old_data={"is_enabled": old_enabled, "is_sandbox": old_sandbox},
        new_data={"is_enabled": setting.is_enabled, "is_sandbox": setting.is_sandbox},
    )

    return JsonResponse({"detail": "Pengaturan iPaymu tersimpan."}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def test_ipaymu_connection(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:ipaymutest:{request.user.id}", limit=20, window_seconds=300):
        return JsonResponse({"detail": "Terlalu banyak percobaan, tunggu sebentar."}, status=429)

    from mark_up.ipaymu import test_connection

    setting = IpaymuSetting.get_solo()
    notify_url = request.build_absolute_uri(reverse("api_ipaymu_webhook"))
    hasil = test_connection(setting, notify_url=notify_url)

    setting.last_check_at = timezone.now()
    setting.last_check_ok = hasil["ok"]
    setting.last_check_note = hasil["pesan"][:500]
    setting.last_check_url = hasil["url"] or ""
    setting.save(update_fields=["last_check_at", "last_check_ok", "last_check_note", "last_check_url"])

    return JsonResponse(hasil, status=200)


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

    notify_user(
        payout.mentor_profile.user,
        "Payout Dicairkan",
        f"Payout kamu sebesar Rp {payout.net_amount:,.0f}".replace(",", ".") + " sudah kami transfer.",
        url="/mentor/transactions",
    )

    return JsonResponse({"detail": "Pencairan berhasil ditandai lunas.", "payout": _serialize_payout(payout)}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_payout_fee(request, payout_id):
    """Admin atur fee_percent (persen ke MarkUp) sebuah payout -- dipakai buat
    BOOTCAMP yang komisinya diisi manual. Cuma boleh selama payout masih
    PENDING (belum dicairkan)."""
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        payout = MentorPayout.objects.select_related("mentor_profile__user").get(id=payout_id)
    except MentorPayout.DoesNotExist:
        return JsonResponse({"detail": "Data pencairan tidak ditemukan."}, status=404)

    if payout.status == PayoutStatus.PAID:
        return JsonResponse({"detail": "Pencairan sudah lunas, komisi tidak dapat diubah."}, status=400)

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        fee = int(data.get("fee_percent"))
    except (TypeError, ValueError):
        return JsonResponse({"detail": "fee_percent harus angka."}, status=400)

    if fee < 0 or fee > 100:
        return JsonResponse({"detail": "fee_percent harus antara 0 dan 100."}, status=400)

    payout.fee_percent = fee
    payout.save(update_fields=["fee_percent"])

    return JsonResponse({"detail": "Komisi diperbarui.", "payout": _serialize_payout(payout)}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def commission_setting(request):
    """GET/PATCH setelan komisi global mentoring (default 25% ke MarkUp)."""
    from .models import CommissionSetting

    setting = CommissionSetting.get_solo()

    if request.method == "GET":
        return JsonResponse({"mentoring_fee_percent": setting.mentoring_fee_percent}, status=200)

    if request.method in ("PATCH", "PUT"):
        data = get_request_data(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON payload."}, status=400)
        try:
            fee = int(data.get("mentoring_fee_percent"))
        except (TypeError, ValueError):
            return JsonResponse({"detail": "mentoring_fee_percent harus angka."}, status=400)
        if fee < 0 or fee > 100:
            return JsonResponse({"detail": "Harus antara 0 dan 100."}, status=400)
        setting.mentoring_fee_percent = fee
        setting.save()
        return JsonResponse({"mentoring_fee_percent": setting.mentoring_fee_percent}, status=200)

    return HttpResponseNotAllowed(["GET", "PATCH", "PUT"])


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

def get_bank_account(request):
    """Rekening tujuan transfer -- PUBLIK (tanpa login), karena halaman
    pembayaran perlu nampilin ini sebelum/selagi user bayar. Isinya memang
    ditujukan buat dibaca umum, sama kayak nomor rekening yang dipajang di
    halaman checkout."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from .models import BankAccountSetting

    setting = BankAccountSetting.get_solo()
    return JsonResponse(
        {
            "bank_name": setting.bank_name,
            "account_number": setting.account_number,
            "account_holder": setting.account_holder,
        },
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bank_account(request):
    """Admin ubah rekening tujuan transfer. Dulu ini hardcode di file frontend,
    jadi ganti rekening = ganti kode + deploy ulang."""
    if request.method not in ("PATCH", "PUT"):
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    from .models import BankAccountSetting

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    setting = BankAccountSetting.get_solo()
    errors = {}

    if "bank_name" in data:
        bank_name = (data["bank_name"] or "").strip()
        if not bank_name:
            errors["bank_name"] = ["Nama bank wajib diisi."]
        else:
            setting.bank_name = bank_name
    if "account_number" in data:
        account_number = (data["account_number"] or "").strip()
        if not account_number:
            errors["account_number"] = ["Nomor rekening wajib diisi."]
        else:
            setting.account_number = account_number
    if "account_holder" in data:
        account_holder = (data["account_holder"] or "").strip()
        if not account_holder:
            errors["account_holder"] = ["Nama pemilik rekening wajib diisi."]
        else:
            setting.account_holder = account_holder

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    setting.save()
    log_audit(request, AuditAction.UPDATE, "bank_account_setting", object_id=None)

    return JsonResponse(
        {
            "detail": "Rekening berhasil diperbarui.",
            "bank_name": setting.bank_name,
            "account_number": setting.account_number,
            "account_holder": setting.account_holder,
        },
        status=200,
    )
