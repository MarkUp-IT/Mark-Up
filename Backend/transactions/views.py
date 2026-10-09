import logging
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError as DjangoValidationError

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
from accounts.models import UserRole, UserStatus, AuditAction
from accounts.utils import log_audit, notify_team, notify_admins, notify_user, is_rate_limited, tanggal_indo
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
            "sub_total": str(item.transaction.sub_total),
            "team_discount_amount": str(item.transaction.team_discount_amount),
            "discount_amount": str(item.transaction.discount_amount),
            "promo_code": item.transaction.promo_code,
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

            if product.type == ProductType.MENTORING and not item.mentor_availability:
                # Slot-nya sudah gak ada (pembayaran dipulihkan setelah
                # kedaluwarsa) -- sesi dibuat tanpa mentor, pembeli milih
                # mentor + jadwal sendiri dari dashboard.
                _create_mentoring_sessions(user_library, detail, None)
                notify_user(
                    txn.user,
                    "Pilih Mentor & Jadwal Mentoring",
                    f"Akses \"{detail.title if detail else 'mentoring'}\" sudah aktif. Silakan pilih mentor "
                    f"dan jadwal sesi kamu di halaman Produk Saya.",
                    url=f"/user/my-products/{product.id}",
                )
            elif product.type == ProductType.MENTORING and item.mentor_availability:
                _create_mentoring_sessions(user_library, detail, item.mentor_availability)
                # Notifikasi buat MENTOR-nya juga -- ini titik satu-satunya
                # baris MentoringSession beneran dibuat, jadi mentor yang
                # bersangkutan pasti kebagian tahu ada booking baru.
                mentor_user = item.mentor_availability.mentor_profile.user
                notify_user(
                    mentor_user,
                    "Booking Baru",
                    f"{txn.user.fullname} baru saja booking sesi \"{detail.title if detail else product.type}\" "
                    f"pada {tanggal_indo(item.mentor_availability.start_time)} WIB.",
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
            f"Pembayaran kamu sebesar Rp {txn.grand_total:,.0f}".replace(",", ".")
            + f" untuk \"{', '.join(judul_produk) or txn.id}\" sudah dikonfirmasi. "
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
        # Nyalain badge "Transaksi" pembeli sampai dia membukanya.
        Transaction.objects.filter(id=txn.id).update(buyer_seen=False)

    if decision == "failed":
        # Notifikasi ke pembeli CUMA buat penolakan yang dipicu admin --
        # BEDA dari pembatalan sendiri oleh pembeli (cancel_transaction) atau
        # kedaluwarsa reservasi iPaymu, yang keduanya sengaja diam-diam
        # (pembeli sendiri yang minta, atau memang gak sempat bayar).
        judul_produk = []
        for item in txn.items.select_related("product").all():
            detail = _get_checkout_detail(item.product)
            if detail is not None and getattr(detail, "title", None):
                judul_produk.append(detail.title)
        notify_user(
            txn.user,
            "Pembayaran Ditolak",
            f"Pembayaran kamu sebesar Rp {txn.grand_total:,.0f}".replace(",", ".")
            + f" untuk \"{', '.join(judul_produk) or txn.id}\" ditolak oleh tim kami."
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

    baru_ditandai_refund = txn.commitment_fee_refunded_at is None
    txn.commitment_fee_refunded_at = None if txn.commitment_fee_refunded_at else timezone.now()
    txn.save(update_fields=["commitment_fee_refunded_at"])

    log_audit(
        request, AuditAction.UPDATE, "transactions", object_id=txn.id,
        new_data={"commitment_fee_refunded_at": str(txn.commitment_fee_refunded_at)},
    )

    # Cuma notif pas BARU ditandai dikembalikan -- uang beneran balik ke
    # buyer, layak dikabari kayak "Refund Disetujui". Kebalikannya (admin
    # batal-tandai, mis. buat koreksi salah klik) sengaja diam-diam, sama
    # kayak koreksi administratif lain di platform ini.
    if baru_ditandai_refund and txn.commitment_fee_refunded_at:
        bootcamp_title = (
            txn.bootcamp_registration.package.bootcamp.title
            if txn.bootcamp_registration_id else "-"
        )
        notify_user(
            txn.user,
            "Commitment Fee Dikembalikan",
            f"Commitment fee kamu sebesar Rp {txn.commitment_fee_amount:,.0f}".replace(",", ".")
            + f" untuk \"{bootcamp_title}\" sudah kami kembalikan.",
            url="/user/transactions",
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

    # Pembeli membuka daftar transaksinya -> penolakan yang ada di situ
    # dianggap sudah dilihat (badge sidebar "Transaksi" padam).
    Transaction.objects.filter(user=request.user, buyer_seen=False).update(buyer_seen=True)

    items = (
        TransactionItem.objects.filter(transaction__user=request.user)
        .select_related(
            "transaction", "product",
            "mentor_availability__mentor_profile__user",
        )
        .order_by("-transaction__created_at")
    )

    # Info refund (nominal & bukti transfer) buat transaksi yang direfund --
    # akses produknya sudah dicabut, jadi halaman Transaksi satu-satunya
    # tempat pembeli bisa melihatnya.
    from products.models import RefundRequest
    refund_per_produk = {}
    for r in RefundRequest.objects.filter(
        user_library__user=request.user, status=RefundRequest.RefundStatus.APPROVED,
    ).select_related("user_library").order_by("created_at"):
        refund_per_produk[r.user_library.product_id] = r

    data = []
    for item in items:
        product_detail = _serialize_product_detail(item.product)
        refund = (refund_per_produk.get(item.product_id)
                  if item.transaction.payment_status == PaymentStatus.REFUNDED else None)
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
                "refund": {
                    "amount": str(refund.refund_amount) if refund.refund_amount is not None else None,
                    "admin_fee_percent": refund.admin_fee_percent,
                    "transfer_proof_url": refund.transfer_proof.url if refund.transfer_proof else None,
                    "transferred_at": refund.transferred_at.isoformat() if refund.transferred_at else None,
                } if refund else None,
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
    menunggu dijadwalkan user lewat dashboard.

    first_slot=None (mis. pembayaran yang dipulihkan setelah kedaluwarsa,
    slotnya sudah dilepas): SEMUA sesi dibuat tanpa mentor & menunggu
    dijadwalkan -- pembeli milih mentor + jadwalnya sendiri dari dashboard
    (lihat products.views.schedule_my_product_session)."""
    mentor_profile = first_slot.mentor_profile if first_slot else None
    sessions = []
    for order in range(1, mentoring_detail.session_count + 1):
        if order == 1 and first_slot is not None:
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
# Dulu 5 menit -- kependekan buat pembeli yang scan QRIS lalu buka app bank
# dulu, dinaikkan ke 15 menit (Okt 2026).
RESERVATION_MINUTES = 15


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

    SEBELUM dilepas, tiap transaksi IPAYMU dicek dulu ke API iPaymu -- kalau
    ternyata pembelinya SUDAH bayar (webhook-nya telat/gagal sampai), langsung
    ditandai lunas, BUKAN dikedaluwarsakan. Dulu langkah ini gak ada, dan
    gara-gara webhook selalu ditolak (signature), pembeli yang sudah bayar
    malah ke-cap "Kedaluwarsa". Kalau iPaymu-nya gak bisa dihubungi, tetap
    dilepas seperti biasa (biar reservasi gak ketahan selamanya) -- pembayaran
    yang ternyata masuk belakangan masih bisa dipulihkan lewat
    _settle_if_ipaymu_paid saat webhook/polling berikutnya datang.
    Return jumlah yang dilepas."""
    qs = queryset if queryset is not None else Transaction.objects.all()
    kadaluarsa = qs.filter(
        payment_status=PaymentStatus.PENDING,
        expires_at__isnull=False,
        expires_at__lt=timezone.now(),
    )
    dilepas = 0
    for transaction_id in list(kadaluarsa.values_list("id", flat=True)):
        hasil = _settle_if_ipaymu_paid(transaction_id)
        if hasil in ("paid", "skip"):
            # "paid" = ternyata sudah dibayar & barusan ditandai lunas.
            # "skip" = statusnya sudah bukan PENDING lagi (diproses jalur lain).
            continue
        try:
            _txn, sudah = _release_transaction(transaction_id, PaymentStatus.EXPIRED)
            if not sudah:
                dilepas += 1
        except Transaction.DoesNotExist:
            continue
    return dilepas


def _recover_late_ipaymu_payment(transaction_id):
    """Pulihkan transaksi IPAYMU yang SUDAH kami cap EXPIRED (reservasinya
    sudah dilepas) tapi belakangan terbukti LUNAS di iPaymu: ambil lagi
    stok yang tadi dibalikin, pasang lagi kode referral-nya, lalu tandai
    lunas lewat _mark_transaction_paid (jalur yang sama persis kayak
    pembayaran normal).

    MENTORING: slot & mentor pilihannya sudah dilepas waktu kedaluwarsa
    (link ke slotnya diputus, lihat _release_transaction), jadi sesinya
    dibuat TANPA mentor & menunggu dijadwalkan -- pembeli milih mentor +
    jadwal sendiri dari dashboard (lihat _create_mentoring_sessions).
    Produk ber-stok yang stoknya sekarang sudah habis dikembalikan ke admin.

    Return (berhasil: bool, alasan: str)."""
    with db_transaction.atomic():
        txn = Transaction.objects.select_for_update(of=("self",)).get(id=transaction_id)
        if txn.payment_status != PaymentStatus.EXPIRED:
            return False, f"status transaksi {txn.payment_status}, bukan EXPIRED"

        items = list(
            txn.items.select_related(
                "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail",
            )
        )

        terkunci = []
        for item in items:
            detail = _get_checkout_detail(item.product)
            if detail is None or getattr(detail, "stock", None) is None:
                continue
            detail_locked = type(detail).objects.select_for_update().get(pk=detail.pk)
            if (detail_locked.stock or 0) < item.quantity:
                return False, f"stok \"{getattr(detail_locked, 'title', item.product_id)}\" sudah habis"
            terkunci.append((detail_locked, item.quantity))

        for detail_locked, qty in terkunci:
            detail_locked.stock -= qty
            detail_locked.save(update_fields=["stock"])

        # Kode referral-nya dulu ikut dilepas (_release_transaction hapus
        # baris usage-nya) -- dipasang lagi biar kuota & riwayat promonya
        # tetap akurat, persis kayak transaksi yang gak pernah kedaluwarsa.
        if txn.promo_code and not ReferralCodeUsage.objects.filter(transaction=txn).exists():
            referral_code = ReferralCode.objects.filter(code__iexact=txn.promo_code).first()
            if referral_code is not None:
                ReferralCodeUsage.objects.create(
                    referral_code=referral_code,
                    transaction=txn,
                    user_id=txn.user_id,
                    discount_amount=txn.discount_amount,
                )
                referral_code.used_count = (referral_code.used_count or 0) + 1
                referral_code.save(update_fields=["used_count"])

        txn.payment_status = PaymentStatus.PENDING
        txn.save(update_fields=["payment_status"])
        _mark_transaction_paid(transaction_id)
        return True, ""


def _settle_if_ipaymu_paid(transaction_id):
    """Konfirmasi status bayar satu transaksi IPAYMU LANGSUNG ke API iPaymu
    (fetch_paid_entry -- sumber kebenaran, gak bisa dipalsukan), lalu
    bertindak sesuai hasilnya. Dipakai webhook, polling halaman kembalian,
    dan cron kedaluwarsa -- jadi pembayaran yang sah PASTI ketangkep dari
    salah satu jalur itu walau webhook-nya gagal.

    Return salah satu:
      "paid"     -- terbukti lunas & barusan ditandai lunas (termasuk yang
                    dipulihkan dari EXPIRED)
      "manual"   -- terbukti lunas tapi gak bisa dipulihkan otomatis, admin
                    sudah dikabari buat cek manual
      "unpaid"   -- iPaymu bilang belum ada pembayaran lunas
      "error"    -- iPaymu gak bisa dihubungi / respons aneh
      "skip"     -- bukan transaksi IPAYMU, atau sudah bukan PENDING/EXPIRED"""
    from mark_up.ipaymu import fetch_paid_entry, map_via_channel_to_payment_method

    try:
        txn = Transaction.objects.select_related("user").get(id=transaction_id)
    except Transaction.DoesNotExist:
        return "skip"
    if txn.gateway != PaymentGateway.IPAYMU or txn.payment_status not in (
        PaymentStatus.PENDING, PaymentStatus.EXPIRED,
    ):
        return "skip"

    entry, err = fetch_paid_entry(IpaymuSetting.get_solo(), txn.id)
    if err:
        logger.warning("iPaymu: gagal cek status transaksi %s: %s", txn.id, err)
        return "error"
    if entry is None:
        return "unpaid"

    try:
        dibayar = Decimal(str(entry.get("Amount") or 0))
    except Exception:
        dibayar = Decimal("0")
    if dibayar < txn.grand_total:
        logger.error(
            "iPaymu: transaksi %s lunas di iPaymu tapi nominalnya Rp %s < tagihan Rp %s -- gak diproses.",
            txn.id, dibayar, txn.grand_total,
        )
        notify_admins(
            f"[PERLU CEK MANUAL] Nominal iPaymu Kurang ({txn.id})",
            f"{txn.user.fullname} ({txn.user.email}) bayar Rp {dibayar:,.0f}".replace(",", ".")
            + f" lewat iPaymu, padahal tagihannya Rp {txn.grand_total:,.0f}".replace(",", ".")
            + ". Akses produk BELUM dibuka -- mohon dicek manual.",
            url="/admin/transactions",
        )
        return "manual"

    via = entry.get("PaymentMethod")
    channel = entry.get("PaymentChannel")
    terlambat = False

    txn, sudah = _mark_transaction_paid(txn.id)
    if sudah and txn.payment_status == PaymentStatus.EXPIRED:
        terlambat = True
        berhasil, alasan = _recover_late_ipaymu_payment(txn.id)
        if not berhasil:
            logger.error(
                "iPaymu: transaksi %s BAYAR SUKSES tapi sudah kedaluwarsa & gak bisa dipulihkan otomatis (%s).",
                txn.id, alasan,
            )
            notify_team(
                f"[PERLU CEK MANUAL] Pembayaran iPaymu terlambat ({txn.id})",
                f"Transaksi {txn.id} terbukti LUNAS di iPaymu, tapi sudah keburu kedaluwarsa di "
                f"sistem dan gak bisa dipulihkan otomatis: {alasan}.\n\n"
                f"Pembeli: {txn.user.fullname} ({txn.user.email})\n"
                f"Total: Rp {txn.grand_total}\n\n"
                f"Uangnya sudah masuk -- mohon diproses manual (kasih aksesnya atau refund).",
            )
            notify_admins(
                f"[PERLU CEK MANUAL] Pembayaran iPaymu Terlambat ({txn.id})",
                f"{txn.user.fullname} ({txn.user.email}) sudah BAYAR (Rp {txn.grand_total:,.0f}"
                .replace(",", ".") + f") lewat iPaymu, tapi transaksinya sudah kedaluwarsa dan "
                f"gak bisa dipulihkan otomatis ({alasan}). Mohon dicek manual.",
                url="/admin/transactions",
            )
            return "manual"
    elif sudah:
        # Sudah diproses jalur lain barusan (mis. webhook & polling barengan).
        return "skip"

    Transaction.objects.filter(pk=txn.pk).update(
        payment_method=map_via_channel_to_payment_method(via, channel)
    )
    logger.info(
        "iPaymu: transaksi %s LUNAS terkonfirmasi API (via=%s, channel=%s, dipulihkan_dari_expired=%s).",
        txn.id, via, channel, terlambat,
    )
    keterangan = " (sempat tercatat kedaluwarsa, sudah dipulihkan otomatis)" if terlambat else ""
    notify_team(
        f"Pembayaran iPaymu diterima ({txn.id})",
        f"Transaksi {txn.id} lunas otomatis lewat iPaymu{keterangan}.\n\n"
        f"Pembeli: {txn.user.fullname} ({txn.user.email})\n"
        f"Total: Rp {txn.grand_total}\n"
        f"Metode: {via}/{channel}\n\n"
        f"Akses produk sudah terbuka otomatis, gak perlu ACC manual.",
    )
    notify_admins(
        f"Pembayaran iPaymu Diterima ({txn.id})",
        f"{txn.user.fullname} ({txn.user.email}) lunas otomatis lewat iPaymu "
        f"sebesar Rp {txn.grand_total:,.0f}".replace(",", ".") + f" via {via}/{channel}{keterangan}. "
        "Akses produk sudah terbuka otomatis, gak perlu ACC manual.",
        url="/admin/transactions",
    )
    return "paid"


class _CheckoutDitolak(Exception):
    """Penolakan checkout dari DALAM blok atomic. Wajib dilempar (bukan
    `return JsonResponse`) supaya perubahan yang sudah terjadi di blok itu
    ikut di-rollback -- lihat penanganannya di checkout_product."""

    def __init__(self, pesan, status=400):
        super().__init__(pesan)
        self.pesan = pesan
        self.status = status


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
    except (Product.DoesNotExist, DjangoValidationError, ValueError):
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
                    raise _CheckoutDitolak(
                        "Kode referral tidak berlaku, kuotanya habis, atau sudah pernah kamu pakai."
                    )
                locked_referral.used_count += 1
                locked_referral.save()

            if product.type == ProductType.MENTORING:
                try:
                    mentor_availability = MentorAvailability.objects.select_for_update().select_related(
                        "mentor_profile__user"
                    ).get(id=mentor_availability_id)
                except (MentorAvailability.DoesNotExist, DjangoValidationError, ValueError):
                    raise _CheckoutDitolak("Slot jadwal tidak ditemukan.", status=404)

                if mentor_availability.start_time <= timezone.now():
                    raise _CheckoutDitolak("Jadwal ini sudah lewat, silakan pilih jadwal lain.")

                # Mentornya harus aktif & keahliannya cocok sama kategori
                # produk -- aturan yang sama persis dengan widget pilih-mentor
                # di checkout (mentors.views.get_mentors). Dulu cuma disaring
                # di tampilan, API-nya nerima slot mentor mana pun.
                mentor_user = mentor_availability.mentor_profile.user
                if (mentor_user.role != UserRole.MENTOR or mentor_user.status != UserStatus.ACTIVE
                        or not mentor_availability.mentor_profile.bisa_dipesan()):
                    raise _CheckoutDitolak("Mentor ini sedang tidak aktif, silakan pilih mentor lain.")
                expertise_ids = list(detail.expertise.values_list("id", flat=True))
                if expertise_ids and not mentor_availability.mentor_profile.mentor_expertises.filter(
                    expertise_id__in=expertise_ids
                ).exists():
                    raise _CheckoutDitolak("Mentor ini tidak tersedia untuk produk mentoring ini.")

                # Cek ulang PERSIS di sini, di dalam kuncinya -- kalau slot ini
                # kelihatan "dibooking" tapi ternyata itu reservasi IPAYMU yang
                # udah lewat batas waktunya tanpa dibayar, lepas dulu sebelum ditolak.
                # Ini yang bikin "klik Bayar" beneran ngecek ulang ketersediaan,
                # bukan cuma percaya status is_booked yang mungkin sudah basi.
                if mentor_availability.is_booked:
                    _release_expired_transactions(
                        Transaction.objects.filter(items__mentor_availability=mentor_availability)
                    )
                    mentor_availability.refresh_from_db()

                if mentor_availability.is_booked:
                    raise _CheckoutDitolak("Slot ini sudah dibooking orang lain.")

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
                        raise _CheckoutDitolak("Stok produk habis.")
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

    except _CheckoutDitolak as ditolak:
        # Penolakan "wajar" (slot keisi, stok habis, dst). Dilempar sebagai
        # exception -- BUKAN `return` di dalam blok atomic -- supaya semua yang
        # sudah diubah sebelumnya (mis. kuota kode referral) ikut dibatalkan.
        # Dulu `return` biasa bikin perubahan itu tetap tersimpan: kuota kode
        # referral kepakai padahal checkout-nya gagal.
        return JsonResponse({"detail": ditolak.pesan}, status=ditolak.status)
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
        notify_admins(
            f"Transaksi Baru Menunggu Verifikasi -- {product_title}",
            f"{request.user.fullname} ({request.user.email}) bayar sebesar "
            f"Rp {txn.grand_total:,.0f}".replace(",", ".") + f" (ID: {txn.id}).",
            url="/admin/transactions",
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
    kembalian iPaymu (2.4) & halaman QRIS buat polling tanpa perlu narik
    seluruh daftar transaksi.

    Selagi masih PENDING, endpoint ini juga ikut konfirmasi ke API iPaymu
    (paling sering sekali per 8 detik per transaksi) -- jadi pembeli yang
    barusan bayar langsung kelihatan lunas walau webhook-nya telat/gagal
    sampai, gak nunggu cron."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        txn = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return JsonResponse({"detail": "Transaksi tidak ditemukan."}, status=404)

    if (
        txn.gateway == PaymentGateway.IPAYMU
        and txn.payment_status == PaymentStatus.PENDING
        and not is_rate_limited(f"rl:ipaymu-status-check:{txn.id}", limit=1, window_seconds=8)
    ):
        if _settle_if_ipaymu_paid(txn.id) == "paid":
            txn.refresh_from_db()

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

    # Cuma transaksi iPaymu (belum ada uang masuk) yang boleh dibatalkan
    # sendiri. Transfer manual = bukti transfernya sudah diunggah, artinya
    # uangnya sudah dikirim -- kalau dibatalkan, transaksinya jadi GAGAL dan
    # hilang dari antrean verifikasi admin padahal dananya sudah masuk. Tombol
    # di UI memang cuma muncul buat iPaymu; ini nutup jalur lewat API langsung.
    if txn.gateway != PaymentGateway.IPAYMU:
        return JsonResponse(
            {"detail": "Transfer manual yang buktinya sudah kamu kirim tidak bisa dibatalkan sendiri. "
                       "Tim kami akan memverifikasinya -- hubungi kami kalau ada kesalahan."},
            status=400,
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

    # Halaman bayar iPaymu ikut kedaluwarsa BARENG sisa reservasi kita
    # (expires_at), bukan default_expired_hours (2 jam) -- dulu pembeli
    # bisa bayar di halaman iPaymu yang masih valid padahal reservasinya
    # di sisi kita sudah dilepas, ujungnya ke-cap "Kedaluwarsa" walau lunas.
    if txn.expires_at:
        sisa_detik = (txn.expires_at - timezone.now()).total_seconds()
        if sisa_detik < 60:
            return JsonResponse(
                {"detail": "Waktu pembayaran transaksi ini sudah habis. Silakan checkout ulang."}, status=400
            )
        expired_value, expired_type = int(sisa_detik // 60), "minutes"
    else:
        expired_value, expired_type = setting.default_expired_hours, "hours"

    session_id, url, err = create_payment_session(
        setting,
        transaction=txn,
        buyer_name=request.user.fullname,
        buyer_phone=txn.buyer_phone or getattr(request.user, "phone", "") or "",
        buyer_email=request.user.email,
        return_url=return_url,
        notify_url=notify_url,
        cancel_url=return_url,
        expired_hours=expired_value,
        expired_type=expired_type,
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
    # dalam jendela RESERVATION_MINUTES-nya.
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

        from mark_up.ipaymu import verify_webhook_signature

        # Signature CUMA dicatat, BUKAN penentu -- resepnya terbukti gak
        # cocok sama webhook production (lihat verify_webhook_signature).
        # Keamanannya sekarang di langkah konfirmasi API di bawah: isi
        # webhook gak pernah dipercaya buat ngasih akses, cuma dipakai
        # sebagai "colekan" supaya kita nanya status aslinya ke iPaymu.
        signature_ok = verify_webhook_signature(setting, request.headers, raw_body)

        payload = get_request_data(request)
        if payload is None:
            try:
                import json
                payload = json.loads(raw_body.decode() or "{}")
            except Exception:
                logger.warning("iPaymu webhook: body gak bisa di-parse sama sekali.")
                return HttpResponse(status=200)
        # Webhook iPaymu dikirim form-urlencoded (QueryDict) -- diratakan
        # jadi dict biasa biar aman disimpan ke JSONField.
        if hasattr(payload, "keys"):
            payload = {k: payload.get(k) for k in payload.keys()}

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

        # Batasi berapa kali satu transaksi bisa memicu panggilan API iPaymu
        # lewat URL webhook publik ini -- biar gak bisa dipakai buat
        # nge-spam kuota API kita.
        if is_rate_limited(f"rl:ipaymu-webhook:{txn.id}", limit=20, window_seconds=600):
            logger.warning("iPaymu webhook: %s kebanyakan dipanggil, dilewati sementara.", txn.id)
            return HttpResponse(status=200)

        hasil = _settle_if_ipaymu_paid(txn.id)
        logger.info(
            "iPaymu webhook: %s status_code=%r signature_ok=%s -> hasil konfirmasi API: %s",
            txn.id, status_code, signature_ok, hasil,
        )
        # status_code "-2" (kedaluwarsa) SENGAJA gak langsung melepas
        # reservasi di sini -- isi webhook gak terverifikasi, dan cron
        # _release_expired_transactions sudah ngurus pelepasan tepat waktu
        # berdasarkan expires_at kita sendiri.

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


def _validasi_referral_code(rc):
    """Cek nilai kode referral (sudah diisi ke instance) masuk akal SEBELUM
    disimpan. Balikin dict errors (kosong = valid) & sekaligus menormalkan
    tipe angkanya. Dulu gak ada validasi sama sekali: diskon 150% (produk jadi
    gratis), diskon MINUS (pembeli malah bayar lebih mahal), dan kuota minus /
    bukan angka (server crash 500) semuanya lolos."""
    errors = {}
    if not (rc.code or "").strip():
        errors["code"] = ["Kode wajib diisi."]
    elif ReferralCode.objects.filter(code__iexact=rc.code).exclude(pk=rc.pk).exists():
        errors["code"] = ["Kode ini sudah dipakai."]

    if rc.discount_type not in DiscountType.values:
        errors["discount_type"] = ["Tipe diskon tidak valid."]

    try:
        rc.discount_value = Decimal(str(rc.discount_value))
        if rc.discount_value <= 0:
            errors["discount_value"] = ["Nilai diskon harus lebih dari 0."]
        elif rc.discount_type == DiscountType.PERCENTAGE and rc.discount_value > 100:
            errors["discount_value"] = ["Diskon persen maksimal 100%."]
    except (InvalidOperation, ValueError, TypeError):
        errors["discount_value"] = ["Nilai diskon harus berupa angka."]

    if rc.max_discount not in (None, ""):
        try:
            rc.max_discount = Decimal(str(rc.max_discount))
            if rc.max_discount <= 0:
                errors["max_discount"] = ["Maksimal potongan harus lebih dari 0."]
        except (InvalidOperation, ValueError, TypeError):
            errors["max_discount"] = ["Maksimal potongan harus berupa angka."]
    else:
        rc.max_discount = None

    try:
        rc.quota = int(str(rc.quota))
        if rc.quota < 1:
            errors["quota"] = ["Kuota minimal 1."]
        elif rc.quota < (rc.used_count or 0):
            errors["quota"] = ["Kuota tidak boleh kurang dari jumlah yang sudah terpakai."]
    except (ValueError, TypeError):
        errors["quota"] = ["Kuota harus berupa angka bulat."]
    return errors


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

    referral_code = ReferralCode(
        code=(request_data.get("code") or "").strip().upper(),
        discount_type=request_data.get("discount_type"),
        discount_value=request_data.get("discount_value"),
        max_discount=request_data.get("max_discount") or None,
        quota=request_data.get("quota"),
        applies_to_all=request_data.get("applies_to_all", True),
    )
    errors = _validasi_referral_code(referral_code)
    if errors:
        return JsonResponse({"errors": errors}, status=400)
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

    if "is_active" in request_data and len(request_data) == 1:
        referral_code.is_active = request_data["is_active"]
    else:
        _apply_referral_code_data(referral_code, request_data)
        if "is_active" in request_data:
            referral_code.is_active = request_data["is_active"]
        errors = _validasi_referral_code(referral_code)
        if errors:
            return JsonResponse({"errors": errors}, status=400)

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
