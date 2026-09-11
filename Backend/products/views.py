import logging

from django.core.paginator import Paginator, EmptyPage
from decimal import Decimal, InvalidOperation
from datetime import timedelta
from zoneinfo import ZoneInfo
import random

from django.conf import settings
from django.core.mail import send_mail
import json
from django.db import IntegrityError, models, transaction as db_transaction
from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from mark_up.imaging import compress_or_original, is_real_image, MAX_DIM_POSTER
from django.utils.dateparse import parse_date, parse_datetime

from .utils import get_request_data
from .forms import MentoringProductForm, ModuleProductForm, BootcampProductForm
from .models import (
    BootcampProduct,
    BootcampRegistrationQuestion,
    BootcampRegistrationAnswer,
    BootcampRegistrationGroup,
    BootcampTeamInvite,
    BootcampReferredInvitee,
    BootcampSession,
    BootcampPackage,
    BootcampPackageExtraBenefit,
    BootcampRegistration,
    BootcampTimelineItem,
    BootcampQuiz,
    PromoPopupSetting,
    BootcampQuizQuestion,
    BootcampQuizAttempt,
    BootcampQuizAnswer,
    QuizChoiceKey,
    BootcampResource,
    BootcampResourceType,
    BootcampTeam,
    BootcampTeamMember,
    BootcampRequirementCategory,
    Certificate,
    CertificateType,
    MentoringSession,
    Product,
    ProductType,
    RefundRequest,
    Review,
    UserLibrary,
    create_default_bootcamp_packages,
    BootcampRequirement,
    create_default_bootcamp_requirements,
    ZoomAccount,
)
from accounts.decorators import jwt_required, role_required
from accounts.models import User, UserRole, AuditAction
from accounts.utils import log_audit, notify_team, get_client_ip, is_rate_limited, send_mail_async
from django.db.models import Q
from mentors.models import MentorAvailability
from transactions.models import (
    Transaction, TransactionItem, PaymentStatus, ReferralCode, ReferralCodeUsage,
    PaymentGateway, IpaymuSetting,
)
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

MAX_CERTIFICATE_SIZE = 5 * 1024 * 1024  # 5MB

DETAIL_FORM_MAP = {
    ProductType.MENTORING: (MentoringProductForm, "mentoring_detail"),
    ProductType.MODULE: (ModuleProductForm, "module_detail"),
    ProductType.BOOTCAMP: (BootcampProductForm, "bootcamp_detail"),
}


def _get_detail_form_class(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[0]


def _get_detail_attr(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[1]


def _get_product_image_url(detail):
    """URL gambar produk. Prioritas file yang di-upload (detail.image) --
    URL-nya di-generate fresh di sini (storage pakai presigned URL), fallback
    ke image_url (link eksternal legacy) kalau belum ada file."""
    img = getattr(detail, "image", None)
    if img:
        try:
            return img.url
        except Exception:
            pass
    return detail.image_url


def _format_product_response(product, detail):
    response = {
        "id": str(product.id),
        "type": product.type,
        "title": detail.title,
        "description": detail.description,
        "original_price": str(detail.original_price) if detail.original_price else None,
        "discount_percent": detail.discount_percent,
        "sold_count": detail.sold_count,
        "image_url": _get_product_image_url(detail),
        "registration_link": detail.registration_link,
        "is_active": detail.is_active,
    }

    if getattr(detail, "file_pdf_url", None) is not None:
        response["file_pdf_url"] = detail.file_pdf_url

    if getattr(detail, "stock", None) is not None:
        response["stock"] = detail.stock

    if getattr(detail, "session_count", None) is not None:
        response["session_count"] = detail.session_count

    return response


def _sync_bootcamp_session_slots(detail):
    """Generate slot sesi kosong (programs.BootcampSession) sejumlah
    session_count produk bootcamp ini, tinggal diisi tanggal/mentor/link-nya
    admin di Kelola Pesanan Bootcamp. Non-destruktif -- kalau session_count
    diturunin belakangan, slot yang udah ada (bisa aja udah keisi mentor/
    link/tanggal) dibiarin apa adanya, cuma nambahin kalau naik."""
    from programs.models import BootcampSession as BootcampSessionTemplate

    existing_count = BootcampSessionTemplate.objects.filter(bootcamp=detail).count()
    target_count = detail.session_count or 1
    if target_count <= existing_count:
        return

    new_slots = [
        BootcampSessionTemplate(bootcamp=detail, title=f"Sesi {i}", order=i)
        for i in range(existing_count + 1, target_count + 1)
    ]
    BootcampSessionTemplate.objects.bulk_create(new_slots)


def _get_product_detail(product):
    if product.type == ProductType.MENTORING:
        return getattr(product, "mentoring_detail", None)
    if product.type == ProductType.MODULE:
        return getattr(product, "module_detail", None)
    if product.type == ProductType.BOOTCAMP:
        return getattr(product, "bootcamp_detail", None)
    return None


def _get_session_progress(sessions):
    """Sesi yang jadwalnya udah lewat dihitung progress-nya juga di sini
    walau admin/mentor belum sempat nge-klik "Tandai Selesai" manual --
    murni buat tampilan progres belajar peserta, BUKAN ngubah status asli
    di DB (status completed yang beneran tetap keputusan manual admin/
    mentor, karena itu yang men-trigger pencairan payout mentor)."""
    total_sessions = len(sessions)
    now = timezone.now()
    completed_sessions = sum(
        1 for session in sessions
        if session.status == session.SessionStatus.COMPLETED
        or (session.start_time is not None and session.start_time < now)
    )
    status = "completed" if total_sessions > 0 and completed_sessions == total_sessions else "active"
    return {
        "current_session": completed_sessions,
        "total_sessions": total_sessions,
        "status": status,
    }


def _serialize_user_product_card(user_library, reviewed_product_ids):
    product = user_library.product
    detail = _get_product_detail(product)
    if detail is None:
        return None

    if product.type == ProductType.BOOTCAMP:
        sessions = list(user_library.bootcamp_sessions.all())
        progress = _get_session_progress(sessions)
        return {
            "id": str(product.id),
            "title": detail.title,
            "description": detail.description,
            "image_url": _get_product_image_url(detail),
            "current_session": progress["current_session"],
            "total_sessions": progress["total_sessions"],
            "status": progress["status"],
            "has_rating": progress["status"] == "completed" and product.id in reviewed_product_ids,
        }

    if product.type == ProductType.MENTORING:
        sessions = list(user_library.mentoring_sessions.all())
        progress = _get_session_progress(sessions)
        return {
            "id": str(product.id),
            "title": detail.title,
            "description": detail.description,
            "image_url": _get_product_image_url(detail),
            "current_session": progress["current_session"],
            "total_sessions": progress["total_sessions"],
            "status": progress["status"],
            "has_rating": progress["status"] == "completed" and product.id in reviewed_product_ids,
        }

    if product.type == ProductType.MODULE:
        return {
            "id": str(product.id),
            "title": detail.title,
            "description": detail.description,
            "image_url": _get_product_image_url(detail),
        }

    return None


def _serialize_product_item(p):
    item = {
        "id": str(p.id),
        "type": p.type,
        "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
    }
    detail = None
    if p.type == ProductType.MENTORING:
        detail = getattr(p, "mentoring_detail", None)
    elif p.type == ProductType.MODULE:
        detail = getattr(p, "module_detail", None)
    elif p.type == ProductType.BOOTCAMP:
        detail = getattr(p, "bootcamp_detail", None)

    if detail:
        item.update({
            "title": detail.title,
            "description": detail.description,
            "explanation": detail.explanation,
            "image_url": _get_product_image_url(detail),
            "original_price": str(detail.original_price) if detail.original_price is not None else None,
            "new_price": str(detail.new_price) if detail.new_price is not None else None,
            "discount_percent": detail.discount_percent,
            "sold_count": detail.sold_count,
            "registration_link": detail.registration_link,
            "is_active": detail.is_active,
        })
        if hasattr(detail, "file_pdf_url"):
            item["file_pdf_url"] = detail.file_pdf_url
        # stock ada di Module DAN Bootcamp -- dulu cuma di-serialize buat yang
        # punya file_pdf_url (Module doang), jadi stok Bootcamp ilang pas edit.
        if hasattr(detail, "stock"):
            item["stock"] = detail.stock
        if p.type == ProductType.MENTORING:
            item["session_count"] = detail.session_count
            item["duration_minutes"] = detail.duration_minutes
            item["expertise"] = list(detail.expertise.values_list("id", flat=True))
            item["expertise_names"] = list(detail.expertise.values_list("name", flat=True))
            item["highlights"] = list(
                detail.highlights.order_by("order").values_list("text", flat=True)
            )
        if p.type == ProductType.BOOTCAMP:
            item["session_count"] = detail.session_count

    return item


def _compute_active_counts(user_libraries):
    mentoring_active = 0
    bootcamp_active = 0
    module_active = 0

    for library in user_libraries:
        detail = _get_product_detail(library.product)
        if detail is None or not detail.is_active:
            continue

        if library.product.type == ProductType.MODULE:
            module_active += 1
            continue

        if library.product.type == ProductType.BOOTCAMP:
            progress = _get_session_progress(list(library.bootcamp_sessions.all()))
            if progress["status"] == "active":
                bootcamp_active += 1
            continue

        if library.product.type == ProductType.MENTORING:
            progress = _get_session_progress(list(library.mentoring_sessions.all()))
            if progress["status"] == "active":
                mentoring_active += 1

    return {
        "mentoring_active": mentoring_active,
        "bootcamp_active": bootcamp_active,
        "modul_active": module_active,
    }


def _serialize_bootcamp_session(session):
    mentors = list(session.mentors.all())
    return {
        "id": str(session.id),
        "order": session.order,
        "title": session.title,
        "mentor": ", ".join(m.user.fullname for m in mentors) if mentors else None,
        "mentor_id": str(mentors[0].id) if mentors else None,
        "mentor_ids": [str(m.id) for m in mentors],
        "mentor_names": [m.user.fullname for m in mentors],
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "status": session.status,
        "meeting_link": session.meeting_link,
        "recording_url": session.recording_url,
    }


def _serialize_unlocked_bootcamp_resources(user_library):
    """Resource (file) yang paket pembeli ini berhak akses -- kalau
    user_library.package kosong (mis. beli lewat checkout lama tanpa alur
    paket), gak dapat resource eksklusif apa pun."""
    package = user_library.package
    if package is None:
        return []

    # File yang boleh diunduh: yang ditandai untuk semua peserta, ATAU yang
    # paketnya cocok. Aksesnya tetap mensyaratkan sudah beli bootcamp ini
    # (fungsi ini cuma dipanggil buat user_library yang valid) -- bukan publik.
    resources = BootcampResource.objects.filter(
        bootcamp_id=user_library.product_id,
    ).filter(
        models.Q(for_all_packages=True) | models.Q(packages=package)
    ).distinct()
    return [
        {
            "id": str(r.id),
            "resource_type": r.resource_type,
            "resource_type_label": r.get_resource_type_display(),
            "title": r.title,
            "file": r.file.url if r.file else None,
        }
        for r in resources
    ]


def _serialize_my_team(user_library):
    """Info tim peserta ini (kalau paketnya punya benefit Team Pairing & udah
    di-assign admin) -- termasuk nama-nama rekan setim, gak termasuk dirinya
    sendiri di daftar teammates."""
    membership = getattr(user_library, "team_membership", None)
    if membership is None:
        return None

    teammates = [
        m.user_library.user.fullname
        for m in membership.team.members.select_related("user_library__user")
        if m.id != membership.id
    ]
    return {"team_name": membership.team.name, "teammates": teammates}


def _serialize_mentoring_session(session):
    mentor = session.mentor
    return {
        "id": str(session.id),
        "order": session.order,
        "mentor": mentor.user.fullname,
        "mentor_id": str(mentor.id),
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "status": session.status,
        "zoom_link": session.zoom_link,
        "recording_url": session.recording_url,
    }


def _get_user_library(request, product_id):
    try:
        return UserLibrary.objects.select_related(
            "product",
            "product__mentoring_detail",
            "product__module_detail",
            "product__bootcamp_detail",
        ).get(user=request.user, product_id=product_id, is_revoked=False)
    except UserLibrary.DoesNotExist:
        return None


def _parse_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _product_type_key(type_value):
    if type_value == ProductType.BOOTCAMP:
        return "bootcamp"
    if type_value == ProductType.MENTORING:
        return "mentoring"
    if type_value == ProductType.MODULE:
        return "modul"
    return None


@jwt_required
def get_my_products(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    filter_value = (request.GET.get("filter") or "semua").lower()
    user_libraries = list(
        UserLibrary.objects.filter(user=request.user, is_revoked=False)
        .select_related(
            "product",
            "product__mentoring_detail",
            "product__module_detail",
            "product__bootcamp_detail",
        )
        .prefetch_related(
            "bootcamp_sessions__mentors__user",
            "mentoring_sessions__mentor__user",
        )
    )

    reviewed_product_ids = set(
        Review.objects.filter(user=request.user, product__in=[lib.product for lib in user_libraries])
        .values_list("product_id", flat=True)
    )

    stats = _compute_active_counts(user_libraries)

    bootcamp_items = []
    mentoring_items = []
    modul_items = []

    for library in user_libraries:
        card = _serialize_user_product_card(library, reviewed_product_ids)
        if card is None:
            continue

        if library.product.type == ProductType.BOOTCAMP:
            bootcamp_items.append(card)
        elif library.product.type == ProductType.MENTORING:
            mentoring_items.append(card)
        elif library.product.type == ProductType.MODULE:
            modul_items.append(card)

    if filter_value == "riwayat":
        bootcamp_items = [item for item in bootcamp_items if item["status"] == "completed"]
        mentoring_items = [item for item in mentoring_items if item["status"] == "completed"]
        modul_items = []
    elif filter_value == "bootcamp":
        mentoring_items = []
        modul_items = []
    elif filter_value == "mentoring":
        bootcamp_items = []
        modul_items = []
    elif filter_value == "modul":
        bootcamp_items = []
        mentoring_items = []

    return JsonResponse(
        {
            "stats": stats,
            "bootcamp": bootcamp_items,
            "mentoring": mentoring_items,
            "modul": modul_items,
        },
        status=200,
    )


@jwt_required
def get_my_product_detail(request, product_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    user_library = _get_user_library(request, product_id)
    if user_library is None:
        return JsonResponse({"detail": "Produk ini belum pernah dibeli oleh pengguna ini."}, status=404)

    product = user_library.product
    detail = _get_product_detail(product)
    if detail is None:
        return JsonResponse({"detail": "Detail produk tidak ditemukan."}, status=404)

    if product.type == ProductType.BOOTCAMP:
        sessions = list(user_library.bootcamp_sessions.prefetch_related("mentors__user").all())
        return JsonResponse(
            {
                "type": "bootcamp",
                "title": detail.title,
                "description": detail.description,
                "image_url": _get_product_image_url(detail),
                "sessions": [_serialize_bootcamp_session(session) for session in sessions],
                "resources": _serialize_unlocked_bootcamp_resources(user_library),
                "team": _serialize_my_team(user_library),
            },
            status=200,
        )

    if product.type == ProductType.MENTORING:
        sessions = list(user_library.mentoring_sessions.select_related("mentor__user").all())
        return JsonResponse(
            {
                "type": "mentoring",
                "title": detail.title,
                "description": detail.description,
                "image_url": _get_product_image_url(detail),
                "sessions": [_serialize_mentoring_session(session) for session in sessions],
            },
            status=200,
        )

    if product.type == ProductType.MODULE:
        return JsonResponse(
            {
                "type": "modul",
                "title": detail.title,
                "description": detail.description,
                "image_url": _get_product_image_url(detail),
                "file_url": detail.file_pdf_url,
                "resources": [],  # TODO: backend belum menyediakan model resource terpisah
                "chapters": [],  # TODO: backend belum menyediakan chapters
            },
            status=200,
        )

    return JsonResponse({"detail": "Jenis produk tidak didukung."}, status=400)


@csrf_exempt
@jwt_required
def rate_my_product(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    user_library = _get_user_library(request, product_id)
    if user_library is None:
        return JsonResponse({"detail": "Produk ini belum pernah dibeli oleh pengguna ini."}, status=404)

    product = user_library.product
    if product.type == ProductType.MODULE:
        return JsonResponse({"detail": "Tidak dapat memberi rating untuk produk modul."}, status=400)

    progress = _get_session_progress(list(user_library.bootcamp_sessions.all() if product.type == ProductType.BOOTCAMP else user_library.mentoring_sessions.all()))
    if progress["status"] != "completed":
        return JsonResponse({"detail": "Produk belum selesai sehingga belum bisa dirating."}, status=400)

    if Review.objects.filter(user=request.user, product=product).exists():
        return JsonResponse({"detail": "Review untuk produk ini sudah ada."}, status=400)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    rating = request_data.get("rating")
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Rating harus berupa angka antara 1 dan 5."}, status=400)

    if rating < 1 or rating > 5:
        return JsonResponse({"detail": "Rating harus antara 1 dan 5."}, status=400)

    review_text = request_data.get("review_text")
    review = Review.objects.create(
        user=request.user,
        product=product,
        rating=rating,
        review_text=review_text,
    )

    from mentors.utils import get_mentors_for_product, recompute_mentor_rating

    for mentor in get_mentors_for_product(product.id):
        recompute_mentor_rating(mentor)

    return JsonResponse(
        {
            "id": str(review.id),
            "user_id": str(request.user.id),
            "product_id": str(product.id),
            "rating": float(review.rating),
            "review_text": review.review_text,
        },
        status=201,
    )


@csrf_exempt
@jwt_required
def schedule_my_product_session(request, session_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    session_type = request_data.get("session_type")
    if session_type != "mentoring":
        return JsonResponse({"detail": "Hanya mentored session yang bisa dijadwalkan di endpoint ini."}, status=403)

    availability_slot_id = request_data.get("availability_slot_id")
    if not availability_slot_id:
        return JsonResponse({"detail": "availability_slot_id diperlukan."}, status=400)

    try:
        session = MentoringSession.objects.select_related(
            "mentor",
            "availability_slot",
            "user_library",
            "user_library__user",
        ).get(id=session_id, user_library__user=request.user)
    except MentoringSession.DoesNotExist:
        return JsonResponse({"detail": "Sesi tidak ditemukan atau tidak dimiliki oleh user."}, status=404)

    try:
        slot = MentorAvailability.objects.get(id=availability_slot_id)
    except MentorAvailability.DoesNotExist:
        return JsonResponse({"detail": "Slot ketersediaan tidak ditemukan."}, status=404)

    if slot.mentor_profile != session.mentor:
        return JsonResponse({"detail": "Slot tidak milik mentor sesi ini."}, status=400)

    if slot.is_booked:
        return JsonResponse({"detail": "Slot sudah dibooking."}, status=400)

    # Urutan waktu antar-sesi harus konsisten: sesi ke-N harus dijadwalkan
    # SETELAH sesi sebelumnya (order lebih kecil) yang udah punya jadwal, dan
    # SEBELUM sesi berikutnya (order lebih besar) yang udah dijadwalkan. Jadi
    # gak mungkin sesi 2 waktunya sebelum sesi 1.
    sibling_sessions = MentoringSession.objects.filter(
        user_library=session.user_library
    ).exclude(id=session.id)

    earlier_times = [
        s.start_time for s in sibling_sessions
        if s.order < session.order and s.start_time
    ]
    if earlier_times and slot.start_time <= max(earlier_times):
        return JsonResponse(
            {"detail": "Jadwal sesi ini harus setelah sesi sebelumnya."},
            status=400,
        )

    later_times = [
        s.start_time for s in sibling_sessions
        if s.order > session.order and s.start_time
    ]
    if later_times and slot.start_time >= min(later_times):
        return JsonResponse(
            {"detail": "Jadwal sesi ini harus sebelum sesi berikutnya yang sudah dijadwalkan."},
            status=400,
        )

    now = timezone.now()
    cutoff = now + timedelta(hours=3)
    if session.status == MentoringSession.SessionStatus.SCHEDULED:
        if session.start_time and session.start_time <= cutoff:
            return JsonResponse({"detail": "Reschedule tidak boleh dalam waktu 3 jam sebelum sesi."}, status=400)
        if session.availability_slot and session.availability_slot != slot:
            old_slot = session.availability_slot
            old_slot.is_booked = False
            old_slot.save(update_fields=["is_booked"])
            # TransactionItem.mentor_availability itu OneToOneField -- kalau
            # TIDAK dipindah ke slot BARU di sini, dua masalah sekaligus:
            # (1) datanya jadi nyimpen slot LAMA yang udah gak relevan, dan
            # (2) constraint unique bakal PERMANEN "mengunci" slot lama itu
            # walau is_booked-nya sendiri sudah balik False, jadi gak akan
            # PERNAH bisa dibooking orang lain lagi. Bug yang sama persis
            # ditemukan & diperbaiki di _release_transaction & approve
            # refund (lihat update_refund_request) -- ternyata pola yang
            # sama belum diterapkan di jalur reschedule ini juga.
            from transactions.models import TransactionItem
            TransactionItem.objects.filter(mentor_availability=old_slot).update(mentor_availability=slot)

    slot.is_booked = True
    slot.save()

    jadwal_bergeser = session.start_time != slot.start_time

    session.availability_slot = slot
    session.start_time = slot.start_time
    session.status = MentoringSession.SessionStatus.SCHEDULED
    session.save()

    # Kalau link Zoom-nya sudah dibuat otomatis tapi jadwalnya bergeser, meeting
    # lama harus dilepas: jamnya sudah salah, dan selama masih tercatat, jendela
    # waktu itu tetap dianggap "milik" akun tersebut sehingga bisa memblokir
    # sesi lain. Dikosongkan saja, biar cron membuat ulang di akun yang cocok
    # dengan jadwal baru.
    if jadwal_bergeser and session.zoom_meeting_id:
        _lepas_meeting_zoom(session)

    return JsonResponse(_serialize_mentoring_session(session), status=200)


def _lepas_meeting_zoom(session):
    """Hapus meeting Zoom sebuah sesi lalu kosongkan jejaknya.

    Sengaja gagal-aman: kalau Zoom tidak bisa dihubungi, field lokal tetap
    dibersihkan supaya sesi bisa dapat link baru. Efek terburuknya cuma satu
    meeting yatim di akun Zoom, jauh lebih ringan daripada peserta memegang
    link dengan jam yang salah.
    """
    akun = session.zoom_account
    meeting_id = session.zoom_meeting_id
    session.zoom_link = ""
    session.zoom_meeting_id = ""
    session.zoom_account = None
    session.zoom_generated_at = None
    session.zoom_error = ""
    session.save(update_fields=[
        "zoom_link", "zoom_meeting_id", "zoom_account",
        "zoom_generated_at", "zoom_error",
    ])

    if not akun or not meeting_id:
        return

    def _hapus():
        try:
            from mark_up.zoom import delete_meeting

            delete_meeting(akun, meeting_id)
        except Exception:
            logger.warning("Gagal menghapus meeting Zoom %s", meeting_id, exc_info=True)

    # Di thread terpisah supaya reschedule user tidak menunggu panggilan ke Zoom.
    import threading

    threading.Thread(target=_hapus, daemon=True).start()


@csrf_exempt
@jwt_required
def refund_my_product(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:refund:user:{request.user.id}", limit=10, window_seconds=3600):
        return JsonResponse(
            {"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429
        )

    user_library = _get_user_library(request, product_id)
    if user_library is None:
        return JsonResponse({"detail": "Produk ini belum pernah dibeli oleh pengguna ini."}, status=404)

    if user_library.product.type == ProductType.MODULE:
        return JsonResponse({"detail": "Refund tidak tersedia untuk modul."}, status=403)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    reason = request_data.get("reason")
    if not reason:
        return JsonResponse({"detail": "Alasan refund diperlukan."}, status=400)

    now = timezone.now()
    cutoff = now + timedelta(hours=3)

    scheduled_sessions = []
    if user_library.product.type == ProductType.BOOTCAMP:
        scheduled_sessions = [s for s in user_library.bootcamp_sessions.all() if s.status == BootcampSession.SessionStatus.SCHEDULED and s.start_time]
    elif user_library.product.type == ProductType.MENTORING:
        scheduled_sessions = [s for s in user_library.mentoring_sessions.all() if s.status == MentoringSession.SessionStatus.SCHEDULED and s.start_time]

    if scheduled_sessions:
        next_session = min(scheduled_sessions, key=lambda s: s.start_time)
        if next_session.start_time <= cutoff:
            return JsonResponse({"detail": "Refund ditutup karena sesi terdekat kurang dari 3 jam."}, status=400)

    refund = RefundRequest.objects.create(
        user_library=user_library,
        reason=reason,
    )

    detail = _get_product_detail(user_library.product)
    notify_team(
        "Pengajuan refund baru",
        f"Ada pengajuan refund baru yang butuh ditinjau admin.\n\n"
        f"Pemohon: {request.user.fullname} ({request.user.email})\n"
        f"Produk: {detail.title if detail else '-'}\n"
        f"Alasan: {reason}\n\n"
        f"Tinjau di dashboard admin -> Pengajuan Refund.",
    )

    return JsonResponse(
        {
            "id": str(refund.id),
            "user_library_id": str(user_library.id),
            "status": refund.status,
            "reason": refund.reason,
        },
        status=201,
    )

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_product(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    product_type = request_data.get("type")
    if product_type not in DETAIL_FORM_MAP:
        return JsonResponse({"errors": {"type": ["Tipe produk tidak valid."]}}, status=400)

    form_class = _get_detail_form_class(product_type)
    detail_form = form_class(request_data)

    if not detail_form.is_valid():
        errors = {k: list(v) for k, v in detail_form.errors.items()}
        non_field = detail_form.non_field_errors()
        if non_field:
            errors["non_field_errors"] = list(non_field)
        return JsonResponse({"errors": errors}, status=400)

    product = Product.objects.create(type=product_type)
    detail = detail_form.save(commit=False)
    detail.product = product
    # image_key = path file yang udah di-upload duluan lewat upload-image/.
    # Di-assign ke ImageField (Django nyimpen string path-nya sebagai .name).
    image_key = request_data.get("image_key")
    if image_key:
        detail.image = image_key
    detail.save()
    detail_form.save_m2m()

    if product_type == ProductType.BOOTCAMP:
        _sync_bootcamp_session_slots(detail)
        # Langsung siapkan 4 paket standar (Mentee/Basic/Premium/Elite).
        create_default_bootcamp_packages(detail)
        create_default_bootcamp_requirements(detail)

    log_audit(
        request, AuditAction.CREATE, "products", object_id=product.id,
        new_data=_format_product_response(product, detail),
    )

    return JsonResponse(
        {
            "detail": "Penambahan produk berhasil.",
            "product": _format_product_response(product, detail),
        },
        status=201,
    )


def get_products(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    # `all` cuma matiin paginasi (dipakai storefront publik buat ambil
    # seluruh katalog sekaligus) -- BUKAN izin buat liat produk nonaktif,
    # dua hal itu sengaja dipisah. Cuma `include_inactive` (dikirim admin,
    # selalu bareng all=true di halaman manajemen produk) yang boleh
    # nge-bypass filter aktif; storefront publik yang cuma kirim all=true
    # doang harus tetap kefilter, kalau nggak produk yang baru dinonaktifkan
    # admin bakal tetap nongol ke pengunjung biasa.
    fetch_all = request.GET.get("all") == "true"
    include_inactive = request.GET.get("include_inactive") == "true"

    # Product tanpa detail sama sekali (baris yatim -- biasanya sisa proses
    # tambah produk yang keputus di tengah jalan) bukan produk valid di
    # tampilan manapun, jadi selalu dikecualikan di sini, terlepas dari flag
    # all/include_inactive (yang bedain aktif/nonaktif, bukan ada/nggaknya
    # detail sama sekali).
    base_qs = Product.objects.select_related(
		"mentoring_detail", "module_detail", "bootcamp_detail"
	).prefetch_related(
		"mentoring_detail__highlights", "mentoring_detail__expertise"
	).filter(
		Q(mentoring_detail__isnull=False) |
		Q(module_detail__isnull=False) |
		Q(bootcamp_detail__isnull=False)
	).order_by("-created_at")

    if include_inactive:
        products = base_qs
    else:
        products = base_qs.filter(
            Q(mentoring_detail__is_active=True) |
            Q(module_detail__is_active=True) |
            Q(bootcamp_detail__is_active=True)
        )

    if fetch_all:
        page_obj = None
        object_list = products
        pagination = None
    else:
        page_number = request.GET.get("page", 1)
        page_size = request.GET.get("page_size", 10)
        try:
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_number = 1
        try:
            page_size = int(page_size)
        except (TypeError, ValueError):
            page_size = 10
        page_size = max(1, min(page_size, 100))

        paginator = Paginator(products, page_size)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages or 1)
        object_list = page_obj.object_list
        pagination = {
            "page": page_obj.number,
            "page_size": page_obj.paginator.per_page,
            "total_items": paginator.count,
            "total_pages": paginator.num_pages,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }

    data = [_serialize_product_item(p) for p in object_list]

    response = {"products": data}
    if pagination:
        response["pagination"] = pagination
    return JsonResponse(response, status=200)

def get_product(request, product_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        product = Product.objects.select_related(
            "mentoring_detail", "module_detail", "bootcamp_detail"
        ).prefetch_related(
            "mentoring_detail__highlights"
        ).get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    detail = _get_product_detail(product)
    if detail is None or not detail.is_active:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    return JsonResponse(_serialize_product_item(product), status=200)

def _serialize_refund_request(refund):
    user_library = refund.user_library
    detail = _get_product_detail(user_library.product)
    return {
        "id": str(refund.id),
        "user_name": user_library.user.fullname,
        "product_title": detail.title if detail else None,
        "reason": refund.reason,
        "status": refund.status,
        "admin_fee_percent": refund.admin_fee_percent,
        "admin_notes": refund.admin_notes,
        "created_at": refund.created_at.isoformat(),
        "resolved_at": refund.resolved_at.isoformat() if refund.resolved_at else None,
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_refund_requests(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    refunds = RefundRequest.objects.select_related(
        "user_library__user",
        "user_library__product__mentoring_detail",
        "user_library__product__module_detail",
        "user_library__product__bootcamp_detail",
    ).order_by("-created_at")

    status_filter = request.GET.get("status")
    if status_filter:
        refunds = refunds.filter(status=status_filter)

    return JsonResponse(
        {"refund_requests": [_serialize_refund_request(r) for r in refunds]},
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_refund_request(request, refund_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        refund = RefundRequest.objects.select_related("user_library__user", "user_library__product").get(id=refund_id)
    except RefundRequest.DoesNotExist:
        return JsonResponse({"detail": "Pengajuan refund tidak ditemukan."}, status=404)

    if refund.status != RefundRequest.RefundStatus.PENDING:
        return JsonResponse({"detail": "Pengajuan ini sudah diproses sebelumnya."}, status=400)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    decision = request_data.get("decision")
    if decision not in ("approved", "rejected"):
        return JsonResponse({"detail": "decision harus 'approved' atau 'rejected'."}, status=400)

    old_status = refund.status
    refund.status = decision
    refund.admin_notes = request_data.get("admin_notes", "")
    refund.resolved_at = timezone.now()

    if decision == "approved":
        from transactions.models import Transaction, TransactionItem, PaymentStatus as TxPaymentStatus

        user_library = refund.user_library
        user_library.is_revoked = True
        user_library.save()

        # Bebasin lagi slot mentor yang masih terjadwal biar bisa dibooking user lain.
        for session in user_library.mentoring_sessions.filter(status="scheduled", availability_slot__isnull=False):
            slot = session.availability_slot
            slot.is_booked = False
            slot.save(update_fields=["is_booked"])
            # TransactionItem.mentor_availability itu OneToOneField -- kalau FK-nya
            # TIDAK ikut dilepas di sini, constraint unique di database bakal
            # PERMANEN "mengunci" slot ini walau is_booked-nya sendiri sudah
            # balik False, jadi gak akan PERNAH bisa dibooking orang lain lagi.
            # Bug yang sama persis pernah ditemukan & diperbaiki di
            # _release_transaction (transactions/views.py) buat kasus
            # kedaluwarsa/ditolak -- ternyata perbaikan yang sama belum
            # diterapkan di jalur approve refund ini.
            TransactionItem.objects.filter(mentor_availability=slot).update(mentor_availability=None)

        # Cari transaksi PAID yang paling cocok (user+produk) buat ditandai REFUNDED.
        # products.UserLibrary belum nyimpen link balik langsung ke Transaction,
        # jadi ini best-effort match berdasarkan user+produk+status PAID terbaru.
        matching_item = (
            TransactionItem.objects.filter(
                transaction__user=user_library.user,
                product=user_library.product,
                transaction__payment_status=TxPaymentStatus.PAID,
            )
            .select_related("transaction")
            .order_by("-transaction__created_at")
            .first()
        )
        if matching_item:
            matching_item.transaction.payment_status = TxPaymentStatus.REFUNDED
            matching_item.transaction.save()

    refund.save()

    log_audit(
        request, AuditAction.UPDATE, "refund_requests", object_id=refund.id,
        old_data={"status": old_status}, new_data={"status": refund.status},
    )

    return JsonResponse(_serialize_refund_request(refund), status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_product_summary(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    active_by_type = {
        ProductType.MENTORING: Product.objects.filter(
            type=ProductType.MENTORING,
            mentoring_detail__is_active=True,
        ).count(),
        ProductType.MODULE: Product.objects.filter(
            type=ProductType.MODULE,
            module_detail__is_active=True,
        ).count(),
        ProductType.BOOTCAMP: Product.objects.filter(
            type=ProductType.BOOTCAMP,
            bootcamp_detail__is_active=True,
        ).count(),
    }

    total_active = sum(active_by_type.values())
    total_products = Product.objects.count()

    return JsonResponse(
        {
            "active_by_type": {
                ProductType.MENTORING: active_by_type[ProductType.MENTORING],
                ProductType.MODULE: active_by_type[ProductType.MODULE],
                ProductType.BOOTCAMP: active_by_type[ProductType.BOOTCAMP],
            },
            "total_active": total_active,
            "total": total_products,
        },
        status=200,
    )

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_product(request, product_id):
	if request.method not in ["PUT", "PATCH"]:
		return HttpResponseNotAllowed(["PUT", "PATCH"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	try:
		product = Product.objects.get(id=product_id)
	except Product.DoesNotExist:
		return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

	requested_type = request_data.get("type")
	if requested_type and requested_type != product.type:
		return JsonResponse({"errors": {"type": ["Tidak dapat mengubah tipe produk."]}}, status=400)

	product_type = product.type
	detail_attr = _get_detail_attr(product_type)
	detail = getattr(product, detail_attr, None)
	if detail is None:
		return JsonResponse({"detail": "Detail produk tidak ditemukan."}, status=404)

	form_class = _get_detail_form_class(product_type)
	detail_form = form_class(request_data, instance=detail)

	if not detail_form.is_valid():
		errors = {k: list(v) for k, v in detail_form.errors.items()}
		non_field = detail_form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	old_data = _format_product_response(product, detail)
	detail = detail_form.save(commit=False)
	image_key = request_data.get("image_key")
	if image_key:
		detail.image = image_key
	detail.save()
	detail_form.save_m2m()

	if product_type == ProductType.BOOTCAMP:
		_sync_bootcamp_session_slots(detail)

	log_audit(
		request, AuditAction.UPDATE, "products", object_id=product.id,
		old_data=old_data, new_data=_format_product_response(product, detail),
	)

	return JsonResponse(
		{
			"detail": "Produk berhasil diperbarui.",
			"product": _format_product_response(product, detail),
		},
		status=200,
	)


@csrf_exempt
def product_detail_view(request, product_id):
	# get_product & update_product sebelumnya nabrak di satu path yang sama
	# (`<uuid:product_id>/` didaftarin 2x di urls.py) -- karena Django resolve
	# URL pattern secara berurutan tanpa peduli method, request PATCH/PUT ke
	# situ selalu ke-tangkep get_product duluan dan update_product jadi dead
	# code. Satu dispatcher ini gantiin keduanya di urls.py.
	if request.method == "GET":
		return get_product(request, product_id)
	return update_product(request, product_id)


def _serialize_certificate(cert):
    detail = _get_product_detail(cert.product) if cert.product_id else None
    return {
        "id": str(cert.id),
        "number": cert.number,
        "type": cert.type,
        "recipient_id": str(cert.recipient_id),
        "recipient_name": cert.recipient.fullname,
        "product_id": str(cert.product_id) if cert.product_id else None,
        "product_title": detail.title if detail else None,
        "file_url": cert.file.url if cert.file else None,
        "issued_at": cert.issued_at.isoformat(),
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_certificates(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    certs = Certificate.objects.select_related(
        "recipient", "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail"
    ).order_by("-issued_at")

    search = request.GET.get("search")
    if search:
        certs = certs.filter(
            Q(number__icontains=search) | Q(recipient__fullname__icontains=search)
        )

    return JsonResponse(
        {"certificates": [_serialize_certificate(c) for c in certs]}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def issue_certificate(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = request.POST if request.content_type.startswith("multipart") else get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid payload."}, status=400)

    number = request_data.get("number")
    cert_type = request_data.get("type")
    recipient_id = request_data.get("recipient_id")
    product_id = request_data.get("product_id")
    file = request.FILES.get("file")

    errors = {}
    if not number:
        errors["number"] = ["Nomor sertifikat wajib diisi."]
    elif Certificate.objects.filter(number=number).exists():
        errors["number"] = ["Nomor sertifikat sudah dipakai."]
    if cert_type not in CertificateType.values:
        errors["type"] = ["Tipe sertifikat tidak valid."]
    if not recipient_id:
        errors["recipient_id"] = ["Penerima wajib dipilih."]
    # Sertifikat cuma buat produk bootcamp -- produknya wajib dipilih.
    if not product_id:
        errors["product_id"] = ["Produk bootcamp wajib dipilih."]
    if not file:
        errors["file"] = ["File PDF wajib diunggah."]
    else:
        ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
        if ext != "pdf":
            errors["file"] = ["File sertifikat harus berformat PDF."]
        elif file.size > MAX_CERTIFICATE_SIZE:
            errors["file"] = ["Ukuran file maksimal 5MB."]
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return JsonResponse({"errors": {"recipient_id": ["Penerima tidak ditemukan."]}}, status=404)

    product = None
    if product_id:
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({"errors": {"product_id": ["Produk tidak ditemukan."]}}, status=404)
        if product.type != ProductType.BOOTCAMP:
            return JsonResponse(
                {"errors": {"product_id": ["Sertifikat hanya bisa diterbitkan untuk produk bootcamp."]}},
                status=400,
            )

    cert = Certificate.objects.create(
        number=number, type=cert_type, recipient=recipient, product=product, file=file,
    )

    log_audit(
        request, AuditAction.CREATE, "certificates", object_id=cert.id,
        new_data={"number": cert.number, "type": cert.type, "recipient": recipient.fullname},
    )

    return JsonResponse(
        {"detail": "Sertifikat berhasil diterbitkan.", "certificate": _serialize_certificate(cert)},
        status=201,
    )


@jwt_required
def get_my_certificates(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    certs = Certificate.objects.filter(recipient=request.user).select_related(
        "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail"
    ).order_by("-issued_at")

    return JsonResponse(
        {"certificates": [_serialize_certificate(c) for c in certs]}, status=200
    )


@jwt_required
@role_required(UserRole.ADMIN)
def get_mentoring_orders(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    libraries = (
        UserLibrary.objects.filter(product__type=ProductType.MENTORING)
        .select_related("user", "product__mentoring_detail")
        .prefetch_related("mentoring_sessions__mentor__user")
        .order_by("-purchased_at")
    )

    data = []
    for library in libraries:
        sessions = list(library.mentoring_sessions.all())
        if not sessions:
            continue
        detail = library.product.mentoring_detail
        first_mentor = sessions[0].mentor
        data.append({
            "user_library_id": str(library.id),
            "user_name": library.user.fullname,
            "product_title": detail.title if detail else None,
            "mentor_name": first_mentor.user.fullname if first_mentor else None,
            "total_sessions": len(sessions),
            "completed_sessions": sum(1 for s in sessions if s.status == "completed"),
            "scheduled_sessions": sum(1 for s in sessions if s.status == "scheduled"),
            "unscheduled_sessions": sum(1 for s in sessions if s.status == "waiting_schedule"),
            "pending_links": sum(1 for s in sessions if s.status == "scheduled" and not s.zoom_link),
        })

    return JsonResponse({"packages": data}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_mentoring_order_detail(request, user_library_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        library = UserLibrary.objects.select_related(
            "user", "product__mentoring_detail"
        ).get(id=user_library_id, product__type=ProductType.MENTORING)
    except UserLibrary.DoesNotExist:
        return JsonResponse({"detail": "Paket mentoring tidak ditemukan."}, status=404)

    sessions = library.mentoring_sessions.select_related("mentor__user").order_by("order")
    detail = library.product.mentoring_detail

    return JsonResponse(
        {
            "user_name": library.user.fullname,
            "user_email": library.user.email,
            "product_title": detail.title if detail else None,
            "sessions": [
                {
                    "id": str(s.id),
                    "order": s.order,
                    "status": s.status,
                    "mentor_name": s.mentor.user.fullname if s.mentor else None,
                    "start_time": s.start_time.isoformat() if s.start_time else None,
                    "zoom_link": s.zoom_link,
                    "recording_url": s.recording_url,
                }
                for s in sessions
            ],
        },
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_mentoring_order_session(request, session_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        session = MentoringSession.objects.select_related(
            "mentor", "mentoring", "user_library"
        ).get(id=session_id)
    except MentoringSession.DoesNotExist:
        return JsonResponse({"detail": "Sesi tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "zoom_link" in request_data:
        from accounts.utils import normalize_and_validate_url

        link, link_error = normalize_and_validate_url(request_data["zoom_link"])
        if link_error:
            return JsonResponse(
                {"errors": {"zoom_link": ["Link Zoom harus berupa link yang valid (contoh: https://...)."]}},
                status=400,
            )
        session.zoom_link = link

    if request_data.get("status") == "completed" and session.status != "completed":
        session.status = MentoringSession.SessionStatus.COMPLETED

        from transactions.models import MentorPayout, PayoutSourceType, CommissionSetting

        if session.mentor_id and not hasattr(session, "payout"):
            gross = session.mentoring.new_price or session.mentoring.original_price or 0
            session_count = session.mentoring.session_count or 1
            # Fee mentoring ngikutin override per-mentor kalau diisi admin di
            # User Management (mentoring_fee_percent_override), kalau kosong
            # jatuh ke setelan global (default 25% ke MarkUp, 75% mentor) di
            # halaman Pencairan Mentor.
            fee_percent = (
                session.mentor.mentoring_fee_percent_override
                if session.mentor.mentoring_fee_percent_override is not None
                else CommissionSetting.get_solo().mentoring_fee_percent
            )
            MentorPayout.objects.create(
                mentor_profile=session.mentor,
                source_type=PayoutSourceType.MENTORING,
                mentoring_session=session,
                gross_amount=(gross / session_count),
                fee_percent=fee_percent,
            )

    session.save()

    log_audit(request, AuditAction.UPDATE, "mentoring_sessions", object_id=session.id)

    return JsonResponse({"detail": "Sesi berhasil diperbarui."}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_orders(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    libraries = (
        UserLibrary.objects.filter(product__type=ProductType.BOOTCAMP)
        .select_related("user", "product__bootcamp_detail")
        .prefetch_related("bootcamp_sessions__mentors__user")
        .order_by("-purchased_at")
    )

    product_id = request.GET.get("product_id")
    if product_id:
        libraries = libraries.filter(product_id=product_id)

    data = []
    for library in libraries:
        sessions = list(library.bootcamp_sessions.all())
        if not sessions:
            continue
        detail = library.product.bootcamp_detail
        data.append({
            "user_library_id": str(library.id),
            "user_name": library.user.fullname,
            "product_id": str(library.product_id),
            "product_title": detail.title if detail else None,
            "total_sessions": len(sessions),
            "completed_sessions": sum(1 for s in sessions if s.status == "completed"),
            "scheduled_sessions": sum(1 for s in sessions if s.status == "scheduled"),
            "unscheduled_sessions": sum(1 for s in sessions if s.status == "waiting_schedule"),
            "pending_links": sum(1 for s in sessions if s.status == "scheduled" and not s.meeting_link),
        })

    return JsonResponse({"packages": data}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_order_detail(request, user_library_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        library = UserLibrary.objects.select_related(
            "user", "product__bootcamp_detail"
        ).get(id=user_library_id, product__type=ProductType.BOOTCAMP)
    except UserLibrary.DoesNotExist:
        return JsonResponse({"detail": "Paket bootcamp tidak ditemukan."}, status=404)

    sessions = library.bootcamp_sessions.prefetch_related("mentors__user").order_by("order")
    detail = library.product.bootcamp_detail

    return JsonResponse(
        {
            "user_name": library.user.fullname,
            "user_email": library.user.email,
            "product_title": detail.title if detail else None,
            "sessions": [
                {
                    "id": str(s.id),
                    "order": s.order,
                    "title": s.title,
                    "status": s.status,
                    "mentor_name": ", ".join(m.user.fullname for m in s.mentors.all()) or None,
                    "start_time": s.start_time.isoformat() if s.start_time else None,
                    "meeting_link": s.meeting_link,
                    "recording_url": s.recording_url,
                }
                for s in sessions
            ],
        },
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_order_session(request, session_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        session = BootcampSession.objects.select_related(
            "bootcamp", "user_library"
        ).prefetch_related("mentors", "payouts").get(id=session_id)
    except BootcampSession.DoesNotExist:
        return JsonResponse({"detail": "Sesi tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "meeting_link" in request_data:
        session.meeting_link = request_data["meeting_link"]

    if request_data.get("status") == "completed" and session.status != "completed":
        session.status = BootcampSession.SessionStatus.COMPLETED

        from transactions.models import MentorPayout, PayoutSourceType

        # Satu sesi bisa diajar >1 mentor -- tiap mentor yang ditugaskan
        # dapat baris payout sendiri, masing-masing nominal penuh sesuai
        # perhitungan per-sesi (bukan dibagi). Kalau perlu dibagi/disesuaikan
        # antar-mentor, itu diatur manual di luar sistem oleh tim keuangan.
        already_paid_out_ids = {p.mentor_profile_id for p in session.payouts.all()}
        mentors_to_pay = [m for m in session.mentors.all() if m.id not in already_paid_out_ids]
        if mentors_to_pay:
            gross = session.bootcamp.new_price or session.bootcamp.original_price or 0
            total_sessions = session.user_library.bootcamp_sessions.count() or 1
            per_mentor_gross = gross / total_sessions
            MentorPayout.objects.bulk_create([
                MentorPayout(
                    mentor_profile=mentor,
                    source_type=PayoutSourceType.BOOTCAMP,
                    bootcamp_session=session,
                    gross_amount=per_mentor_gross,
                )
                for mentor in mentors_to_pay
            ])

    session.save()

    log_audit(request, AuditAction.UPDATE, "bootcamp_sessions", object_id=session.id)

    return JsonResponse({"detail": "Sesi berhasil diperbarui."}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_all_reviews(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    reviews = Review.objects.select_related(
        "user", "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail"
    ).order_by("-created_at")

    # Buka daftar ini nandain semua ulasan yang belum dilihat jadi "sudah
    # dilihat" -- sumber badge notifikasi "ulasan baru" di sidebar.
    Review.objects.filter(is_seen_by_admin=False).update(is_seen_by_admin=True)

    data = []
    for r in reviews:
        detail = _get_product_detail(r.product)
        data.append({
            "id": str(r.id),
            "reviewer_name": r.user.fullname,
            "reviewer_email": r.user.email,
            "product_title": detail.title if detail else None,
            "rating": float(r.rating),
            "review_text": r.review_text,
            "is_hidden": r.is_hidden,
            "created_at": r.created_at.isoformat(),
        })

    return JsonResponse({"reviews": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def toggle_review_visibility(request, review_id):
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return JsonResponse({"detail": "Ulasan tidak ditemukan."}, status=404)

    review.is_hidden = not review.is_hidden
    review.save()

    from mentors.utils import get_mentors_for_product, recompute_mentor_rating

    for mentor in get_mentors_for_product(review.product_id):
        recompute_mentor_rating(mentor)

    log_audit(
        request, AuditAction.UPDATE, "reviews", object_id=review.id,
        new_data={"is_hidden": review.is_hidden},
    )

    return JsonResponse({"detail": "Status ulasan berhasil diperbarui.", "is_hidden": review.is_hidden}, status=200)


ALLOWED_PRODUCT_IMAGE_EXT = {"jpg", "jpeg", "png", "webp"}
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def upload_product_image(request):
    """Upload gambar produk ke storage, balikin key + URL. Key-nya dipakai FE
    buat dikirim balik di payload add/update produk (field image_key) -- baru
    di sana di-assign ke produknya. Kepisah gini karena pas bikin produk baru,
    produknya belum ada waktu gambar di-upload."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    from django.core.files.storage import default_storage

    image = request.FILES.get("image")
    if not image:
        return JsonResponse({"detail": "File gambar diperlukan."}, status=400)

    ext = image.name.rsplit(".", 1)[-1].lower() if "." in image.name else ""
    if ext not in ALLOWED_PRODUCT_IMAGE_EXT:
        return JsonResponse({"detail": "Format harus JPG, PNG, atau WEBP."}, status=400)

    if image.size > MAX_PRODUCT_IMAGE_SIZE:
        return JsonResponse({"detail": "Ukuran file maksimal 5MB."}, status=400)

    # Ekstensi gampang dipalsukan -- pastikan isinya beneran gambar.
    if not is_real_image(image):
        return JsonResponse({"detail": "File ini bukan gambar yang valid."}, status=400)

    # Dikompres dulu (WebP, maks 1600px) -- poster dari desainer sering 1-2 MB
    # PNG, padahal di layar cuma dipajang ~800px.
    image, image_name = compress_or_original(image, max_dim=MAX_DIM_POSTER)

    now = timezone.now()
    key = f"product_images/{now.year}/{now.month:02d}/{image_name}"
    saved_key = default_storage.save(key, image)

    return JsonResponse(
        {"key": saved_key, "url": default_storage.url(saved_key)}, status=201
    )


# ==================== BOOTCAMP: PAKET & PENDAFTARAN ====================

MAX_REGISTRATION_DOC_SIZE = 10 * 1024 * 1024  # 10MB (PDF gabungan bisa agak besar)
MAX_COMMITMENT_LETTER_SIZE = 5 * 1024 * 1024  # 5MB (cuma surat teks, gak sebesar PDF gabungan)
MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024  # 5MB, sama kayak checkout_product biasa
ALLOWED_PAYMENT_PROOF_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}

_BENEFIT_LABELS = [
    ("benefit_session_material", "Sesi & Materi Bootcamp"),
    ("benefit_record_incubation", "Record Incubation"),
    ("benefit_framework_template", "Framework Template"),
    ("benefit_winning_deck", "Winning Deck"),
    ("benefit_mentoring_case", "Mentoring Case Competition"),
    ("benefit_career_coaching", "Career Coaching"),
    ("benefit_team_pairing", "Team Pairing"),
    ("benefit_networking", "Networking Session"),
    ("benefit_ecertificate", "E-Certificate"),
]


def _parse_wib_datetime_or_none(value):
    """Parse string datetime dari request (JSON ISO string ATAU nilai mentah
    <input type=datetime-local> yang gak punya info timezone) jadi objek
    datetime aware. String naive (tanpa offset, mis. dari datetime-local)
    diasumsikan WIB, konsisten sama TIME_ZONE='Asia/Jakarta' -- assignment
    string mentah ke field model TIDAK di-parse otomatis oleh Django, jadi
    ini wajib dipanggil sebelum diassign supaya serialize_package's
    .isoformat() gak crash pas dipanggil di response yang sama (belum
    sempat refresh dari DB)."""
    if not value:
        return None
    dt = parse_datetime(value)
    if dt is None:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def _package_registration_status(pkg):
    """'not_open_yet' | 'open' | 'closed' -- dibanding sama waktu sekarang.
    Paket tanpa jendela (opens/closes kosong) dianggap selalu 'open'."""
    now = timezone.now()
    if pkg.registration_opens_at and now < pkg.registration_opens_at:
        return "not_open_yet"
    if pkg.registration_closes_at and now > pkg.registration_closes_at:
        return "closed"
    return "open"


def _serialize_package(pkg):
    return {
        "id": str(pkg.id),
        "slug": pkg.slug,
        "name": pkg.name,
        "price": str(pkg.price),
        "commitment_fee": str(pkg.commitment_fee),
        "total_price": str(pkg.price + pkg.commitment_fee),
        "requires_selection": pkg.requires_selection,
        "selection_quota": pkg.selection_quota,
        "accepted_count": (
            pkg.registrations.filter(status=BootcampRegistration.Status.ACCEPTED).count()
            if pkg.requires_selection else None
        ),
        "is_active": pkg.is_active,
        "registration_opens_at": pkg.registration_opens_at.isoformat() if pkg.registration_opens_at else None,
        "registration_closes_at": pkg.registration_closes_at.isoformat() if pkg.registration_closes_at else None,
        "payment_deadline_at": pkg.payment_deadline_at.isoformat() if pkg.payment_deadline_at else None,
        "registration_status": _package_registration_status(pkg),
        "quiz_duration_minutes": pkg.quiz_duration_minutes,
        "quiz_passing_score_percent": pkg.quiz_passing_score_percent,
        "min_attendance_sessions": pkg.min_attendance_sessions,
        "benefits": [
            {"key": field, "label": label, "included": getattr(pkg, field)}
            for field, label in _BENEFIT_LABELS
        ],
        # Benefit tambahan bebas (cuma tampilan). Selalu dianggap "included" --
        # kalau admin gak mau nampilin, tinggal dihapus itemnya.
        "extra_benefits": [
            {"id": str(b.id), "label": b.label, "order": b.order}
            for b in pkg.extra_benefits.all()
        ],
        # Dua fitur harga dinamis -- dipakai formulir publik buat menentukan
        # apakah section "Sudah Punya Tim?" / "Ajak Teman?" perlu ditampilkan
        # sama sekali. group_size=0 / referral_invite_enabled=False = mati.
        "group_size": pkg.group_size,
        "group_price": str(pkg.group_price) if pkg.group_price is not None else None,
        "referral_invite_enabled": pkg.referral_invite_enabled,
        "referral_invite_discount_percent": pkg.referral_invite_discount_percent,
    }


def _serialize_timeline_item(item):
    return {
        "id": str(item.id),
        "title": item.title,
        "start_date": item.start_date.isoformat(),
        "end_date": item.end_date.isoformat() if item.end_date else None,
        "order": item.order,
    }


def get_bootcamp_packages(request, product_id):
    """Daftar paket sebuah produk bootcamp (publik)."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    packages = BootcampPackage.objects.filter(
        bootcamp_id=product_id, is_active=True
    ).order_by("order")
    return JsonResponse(
        {"packages": [_serialize_package(p) for p in packages]}, status=200
    )


def _serialize_team_info(reg):
    """None kalau `reg` tidak terkait tim mana pun. Kalau `reg` adalah
    KETUA (dia yang mendaftar & mengundang), tampilkan daftar anggota yang
    diundangnya. Kalau `reg` adalah ANGGOTA (dibuat otomatis pas
    pembayaran ketuanya di-ACC), tampilkan siapa ketuanya."""
    grup = getattr(reg, "led_team_group", None)
    if grup is not None:
        return {
            "role": "leader",
            "target_size": reg.package.group_size,
            "members": [
                {"name": inv.invitee.fullname, "email": inv.invitee.email}
                for inv in reg.team_invites.select_related("invitee").all()
            ],
        }
    if reg.registration_group_id:
        leader_user = reg.registration_group.leader_registration.user
        return {
            "role": "member",
            "target_size": reg.package.group_size,
            "leader_name": leader_user.fullname,
            "leader_email": leader_user.email,
        }
    return None


def _serialize_registration(reg, for_admin=False):
    doc_url = None
    if reg.requirement_doc:
        try:
            doc_url = reg.requirement_doc.url
        except Exception:
            doc_url = None

    def _file_url(f):
        """URL file kalau ada; None kalau kosong atau storage-nya lagi rewel --
        biar satu file bermasalah gak bikin seluruh daftar pendaftaran error."""
        if not f:
            return None
        try:
            return f.url
        except Exception:
            return None

    commitment_letter_url = None
    if reg.commitment_letter:
        try:
            commitment_letter_url = reg.commitment_letter.url
        except Exception:
            commitment_letter_url = None

    # Skor & status lulus/tidak CUMA dikirim ke admin (for_admin=True) --
    # peserta sendiri cuma tahu status pengerjaan, gak pernah lihat skornya.
    quizzes = []
    if reg.package.requires_selection:
        attempts_by_quiz = {a.quiz_id: a for a in reg.quiz_attempts.all()}
        for q in BootcampQuiz.objects.filter(
            bootcamp_id=reg.package.bootcamp_id, is_active=True
        ).order_by("order", "created_at"):
            attempt = attempts_by_quiz.get(q.id)
            item = {
                "quiz_id": str(q.id),
                "title": q.title,
                "timeline_item_id": str(q.timeline_item_id) if q.timeline_item_id else None,
                "duration_minutes": q.duration_minutes,
                "status": attempt.status if attempt else "not_started",
            }
            if for_admin and attempt is not None:
                item["score_percent"] = (
                    str(attempt.score_percent) if attempt.score_percent is not None else None
                )
                item["passed"] = attempt.passed
                item["submitted_at"] = attempt.submitted_at.isoformat() if attempt.submitted_at else None
            quizzes.append(item)

    # Pembayaran (kalau ada) -- beda dari quiz, ini boleh dilihat peserta
    # sendiri (bukan info yang perlu disembunyikan), makanya gak digerbang
    # for_admin. Ambil transaksi terbaru yang terhubung ke pendaftaran ini.
    payment = None
    txn = reg.payment_transactions.order_by("-created_at").first()
    if txn is not None:
        proof_url = None
        if txn.proof_of_payment:
            try:
                proof_url = txn.proof_of_payment.url
            except Exception:
                proof_url = None
        payment = {
            "transaction_id": txn.id,
            "status": txn.payment_status,
            "sub_total": str(txn.sub_total),
            "commitment_fee_amount": str(txn.commitment_fee_amount),
            "grand_total": str(txn.grand_total),
            "discount_amount": str(txn.discount_amount or 0),
            "promo_code": txn.promo_code or None,
            "proof_of_payment": proof_url,
            "created_at": txn.created_at.isoformat(),
            "paid_at": txn.paid_at.isoformat() if txn.paid_at else None,
        }

    # Batas waktu bayar (kalau diatur admin di paket) -- cuma relevan buat
    # pendaftaran yang sudah Diterima & belum lunas. Dihitung on-the-fly,
    # gak nyimpen status "expired" terpisah di DB -- endpoint bayar
    # (create_bootcamp_payment) yang beneran nolak kalau ini True.
    payment_deadline_passed = False
    if (
        reg.status == BootcampRegistration.Status.ACCEPTED
        and reg.package.payment_deadline_at
        and (payment is None or payment["status"] != "PAID")
        and timezone.now() > reg.package.payment_deadline_at
    ):
        payment_deadline_passed = True

    return {
        "id": str(reg.id),
        "status": reg.status,
        "status_label": reg.get_status_display(),
        "created_at": reg.created_at.isoformat(),
        "reviewed_at": reg.reviewed_at.isoformat() if reg.reviewed_at else None,
        "admin_notes": reg.admin_notes,
        "requirement_doc": doc_url,
        "commitment_letter": commitment_letter_url,
        "cv": _file_url(reg.cv),
        "portfolio": _file_url(reg.portfolio),
        # Jawaban pertanyaan pendaftaran. Dikirim ke pendaftar sendiri juga
        # (bukan info rahasia -- dia yang menulisnya), dan admin memakainya
        # sebagai bahan pertimbangan menerima/menolak.
        "answers": [
            {
                "question": a.question_text,
                "answer": a.answer_text,
            }
            for a in reg.answers.all().order_by("order", "id")
        ],
        # Status tim -- None kalau pendaftaran ini bukan bagian tim mana pun.
        # Bentuknya beda tergantung reg ini KETUA (lihat siapa saja yang dia
        # undang) atau ANGGOTA (lihat siapa ketuanya) -- lihat catatan di
        # BootcampRegistrationGroup soal alur "ketua ngundang, anggota
        # diprovisikan otomatis pas pembayaran ketua di-ACC".
        "team": _serialize_team_info(reg),
        # Orang yang berhasil diklaim pendaftar ini sebagai "yang diajak".
        "invited": [
            {"email": inv.invitee_email}
            for inv in reg.referred_invitees.all()
        ],
        "package": {
            "id": str(reg.package_id),
            "slug": reg.package.slug,
            "name": reg.package.name,
            "requires_selection": reg.package.requires_selection,
            "selection_quota": reg.package.selection_quota,
            "accepted_count": (
                reg.package.registrations.filter(status=BootcampRegistration.Status.ACCEPTED).count()
                if reg.package.requires_selection else None
            ),
            "price": str(reg.package.price),
            "commitment_fee": str(reg.package.commitment_fee),
            "payment_deadline_at": reg.package.payment_deadline_at.isoformat() if reg.package.payment_deadline_at else None,
            "group_size": reg.package.group_size,
            "group_price": str(reg.package.group_price) if reg.package.group_price is not None else None,
            "referral_invite_enabled": reg.package.referral_invite_enabled,
            "referral_invite_discount_percent": reg.package.referral_invite_discount_percent,
        },
        "payment_deadline_passed": payment_deadline_passed,
        "bootcamp_id": str(reg.package.bootcamp_id),
        "bootcamp_title": reg.package.bootcamp.title,
        "quizzes": quizzes,
        "payment": payment,
    }


def _validasi_calon_anggota_tim(email, bootcamp, ketua):
    """Cek apakah `email` boleh diundang `ketua` jadi anggota tim di
    `bootcamp` ini. Dipakai DUA tempat: tombol "Cek" di form (feedback
    instan, tanpa lock) dan register_bootcamp saat submit beneran (re-cek
    dengan lock di dalam transaksi). Return (ok, pesan_kalau_gagal, User|None).
    """
    if email.lower() == ketua.email.lower():
        return False, "tidak bisa mengundang diri sendiri.", None
    try:
        user_obj = User.objects.get(email__iexact=email, role=UserRole.STUDENT)
    except User.DoesNotExist:
        return False, "belum punya akun Markup (atau bukan akun peserta).", None
    if BootcampRegistration.objects.filter(user=user_obj, package__bootcamp=bootcamp).exists():
        return False, "sudah terdaftar sendiri di bootcamp ini.", None
    if BootcampTeamInvite.objects.filter(
        invitee=user_obj, leader_registration__package__bootcamp=bootcamp,
    ).exclude(leader_registration__status=BootcampRegistration.Status.REJECTED).exists():
        return False, "sudah diundang tim lain untuk bootcamp ini.", None
    return True, "", user_obj


def _validasi_ajak_teman(email, bootcamp, pengajak):
    """Cek apakah `email` boleh disebut `pengajak` sebagai orang yang dia ajak
    di `bootcamp` ini. KEBALIKAN dari _validasi_calon_anggota_tim: anggota tim
    justru HARUS BELUM terdaftar, sedangkan orang yang diajak HARUS SUDAH
    terdaftar (promonya memang buat ngajak orang yang udah gabung duluan).

    Dipakai DUA tempat, persis pola tim: tombol "Cek" di form (feedback
    instan, tanpa lock) dan register_bootcamp saat submit beneran (re-cek
    dengan lock). Return (ok, pesan_kalau_gagal, BootcampRegistration|None).
    """
    if email.lower() == pengajak.email.lower():
        return False, "tidak bisa mengajak dirimu sendiri.", None
    kandidat = (
        BootcampRegistration.objects.filter(
            user__email__iexact=email, package__bootcamp=bootcamp,
        )
        .select_related("user")
        .first()
    )
    if kandidat is None:
        return False, "belum terdaftar di bootcamp ini.", None
    if BootcampReferredInvitee.objects.filter(
        bootcamp=bootcamp, invitee_email__iexact=email,
    ).exists():
        return False, "sudah diklaim pendaftar lain.", None
    return True, "", kandidat


@jwt_required
def check_referral_invitee(request, product_id):
    """Kembaran check_team_invitee, tapi buat promo AJAK TEMAN. Dipisah
    endpoint-nya (bukan satu endpoint pakai parameter mode) karena aturan
    validasinya memang berkebalikan -- lihat catatan di _validasi_ajak_teman."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    email = (request.GET.get("email") or "").strip()
    if not email:
        return JsonResponse({"detail": "Parameter email wajib diisi."}, status=400)

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Bootcamp tidak ditemukan."}, status=404)

    ok, pesan, reg_obj = _validasi_ajak_teman(email, bootcamp, request.user)
    return JsonResponse(
        {
            "valid": ok,
            "reason": None if ok else pesan,
            "name": reg_obj.user.fullname if reg_obj else None,
        },
        status=200,
    )


@jwt_required
def check_team_invitee(request, product_id):
    """Dipakai tombol "Cek" di form pendaftaran tim -- validasi RINGAN
    (tanpa row lock) buat kasih feedback instan ke ketua sambil ngetik.
    Validasi SUNGGUHAN (dengan lock) tetap diulang lagi di register_bootcamp
    pas submit beneran -- ini cuma bantuan UX, bukan satu-satunya penjaga."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    email = (request.GET.get("email") or "").strip()
    if not email:
        return JsonResponse({"detail": "Parameter email wajib diisi."}, status=400)

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Bootcamp tidak ditemukan."}, status=404)

    ok, pesan, user_obj = _validasi_calon_anggota_tim(email, bootcamp, request.user)
    return JsonResponse(
        {
            "valid": ok,
            "reason": None if ok else pesan,
            "name": user_obj.fullname if user_obj else None,
        },
        status=200,
    )


@csrf_exempt
@jwt_required
def register_bootcamp(request):
    """Daftar ke sebuah paket bootcamp (upload 1 PDF gabungan syarat).
    Belum bayar -- nunggu diseleksi (Mentee) / di-ACC admin (paket lain)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:bootcamp-register:user:{request.user.id}", limit=20, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    package_id = request.POST.get("package_id")
    doc = request.FILES.get("requirement_doc")
    commitment_letter = request.FILES.get("commitment_letter")
    cv = request.FILES.get("cv")
    portfolio = request.FILES.get("portfolio")

    errors = {}
    if not package_id:
        errors["package_id"] = ["Paket wajib dipilih."]
    if not doc:
        errors["requirement_doc"] = ["Dokumen syarat (PDF) wajib diunggah."]
    else:
        ext = doc.name.rsplit(".", 1)[-1].lower() if "." in doc.name else ""
        if ext != "pdf":
            errors["requirement_doc"] = ["Dokumen harus berformat PDF (gabungkan semua bukti jadi satu PDF)."]
        elif doc.size > MAX_REGISTRATION_DOC_SIZE:
            errors["requirement_doc"] = ["Ukuran file maksimal 10MB."]
    # Wajib atau tidaknya commitment letter bergantung saklar di bootcamp-nya,
    # dan bootcamp baru diketahui setelah paketnya diresolusi di bawah. Di sini
    # cuma format & ukuran yang dicek; cek "wajib" menyusul setelah itu.
    if commitment_letter:
        ext = commitment_letter.name.rsplit(".", 1)[-1].lower() if "." in commitment_letter.name else ""
        if ext != "pdf":
            errors["commitment_letter"] = ["Commitment letter harus berformat PDF."]
        elif commitment_letter.size > MAX_COMMITMENT_LETTER_SIZE:
            errors["commitment_letter"] = ["Ukuran file maksimal 5MB."]

    # CV wajib; portofolio boleh kosong. Keduanya divalidasi dengan aturan yang
    # sama (PDF, maks 5MB) supaya pesan errornya konsisten buat pendaftar.
    if not cv:
        errors["cv"] = ["CV (PDF) wajib diunggah."]
    else:
        ext = cv.name.rsplit(".", 1)[-1].lower() if "." in cv.name else ""
        if ext != "pdf":
            errors["cv"] = ["CV harus berformat PDF."]
        elif cv.size > MAX_COMMITMENT_LETTER_SIZE:
            errors["cv"] = ["Ukuran file maksimal 5MB."]

    if portfolio:
        ext = portfolio.name.rsplit(".", 1)[-1].lower() if "." in portfolio.name else ""
        if ext != "pdf":
            errors["portfolio"] = ["Portofolio harus berformat PDF."]
        elif portfolio.size > MAX_COMMITMENT_LETTER_SIZE:
            errors["portfolio"] = ["Ukuran file maksimal 5MB."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        package = BootcampPackage.objects.select_related("bootcamp").get(id=package_id, is_active=True)
    except BootcampPackage.DoesNotExist:
        return JsonResponse({"errors": {"package_id": ["Paket tidak ditemukan."]}}, status=404)

    reg_status = _package_registration_status(package)
    if reg_status == "not_open_yet":
        opens_local = timezone.localtime(package.registration_opens_at).strftime("%d %B %Y")
        return JsonResponse(
            {"detail": f"Pendaftaran paket {package.name} belum dibuka. Dibuka mulai {opens_local}."},
            status=400,
        )
    if reg_status == "closed":
        return JsonResponse(
            {"detail": f"Pendaftaran paket {package.name} sudah ditutup."}, status=400,
        )

    if BootcampRegistration.objects.filter(user=request.user, package=package).exists():
        return JsonResponse(
            {"detail": "Kamu sudah mendaftar untuk paket ini."}, status=400
        )

    bootcamp = package.bootcamp

    # --- Isian yang wajib menurut pengaturan bootcamp ini ---------------
    lanjutan_errors = {}
    if bootcamp.require_commitment_letter and not commitment_letter:
        lanjutan_errors["commitment_letter"] = ["Commitment letter (PDF) wajib diunggah."]

    # --- Tim pendaftaran (opsional, cuma kalau paketnya mengizinkan) ----
    # Ketua mendaftar SEKALI sambil langsung menyebut SELURUH anggota lain
    # lewat email -- harus akun yang sudah ada (dicek _validasi_calon_anggota_tim,
    # sama persis yang dipakai tombol "Cek" di form). Tim wajib LENGKAP saat
    # submit ini juga -- tidak ada anggota yang menyusul belakangan.
    mentah_anggota = request.POST.get("team_member_emails") or ""
    email_anggota = [
        e.strip().lower() for e in mentah_anggota.replace(",", "\n").splitlines() if e.strip()
    ]

    # --- Ajak teman (opsional) -------------------------------------------
    # SATU email saja: potongannya flat (persen tetap, lihat
    # referral_invite_discount_percent), jadi menyebut banyak nama gak nambah
    # apa-apa -- mending sekalian dibatasi satu biar gak menyesatkan.
    #
    # Dua promo ini SENGAJA saling meniadakan: pendaftar memilih SALAH SATU,
    # gak bisa dobel. Dicek di sini (bukan cuma di UI) supaya tetap ditegakkan
    # walau ada yang nembak endpoint-nya langsung.
    email_ajak = (request.POST.get("invited_email") or "").strip().lower()
    invitee_valid = None
    if email_ajak and email_anggota:
        lanjutan_errors["invited_email"] = [
            "Pilih salah satu saja: daftar sebagai tim ATAU ajak teman, tidak bisa dua-duanya."
        ]
    elif email_ajak:
        if not package.referral_invite_enabled:
            lanjutan_errors["invited_email"] = ["Paket ini tidak punya promo ajak teman."]
        else:
            ok, pesan, reg_obj = _validasi_ajak_teman(email_ajak, bootcamp, request.user)
            if ok:
                invitee_valid = reg_obj
            else:
                lanjutan_errors["invited_email"] = [f"{email_ajak}: {pesan}"]

    anggota_valid = []
    if email_anggota:
        if package.group_size <= 1:
            lanjutan_errors["team_member_emails"] = ["Paket ini tidak mendukung pendaftaran tim."]
        elif package.group_price is None:
            lanjutan_errors["team_member_emails"] = ["Admin belum mengatur harga tim untuk paket ini."]
        elif len(email_anggota) != len(set(email_anggota)):
            lanjutan_errors["team_member_emails"] = ["Ada email yang ditulis berulang."]
        elif len(email_anggota) != package.group_size - 1:
            lanjutan_errors["team_member_emails"] = [
                f"Tim paket ini harus {package.group_size} orang -- sebutkan tepat "
                f"{package.group_size - 1} email anggota lain (di luar kamu sendiri)."
            ]
        else:
            error_list = []
            for email in email_anggota:
                ok, pesan, user_obj = _validasi_calon_anggota_tim(email, bootcamp, request.user)
                if ok:
                    anggota_valid.append(user_obj)
                else:
                    error_list.append(f"{email}: {pesan}")
            if error_list:
                lanjutan_errors["team_member_emails"] = error_list

    jawaban_masuk = {}
    if bootcamp.enable_registration_questions:
        mentah = request.POST.get("answers") or "{}"
        try:
            jawaban_masuk = json.loads(mentah)
            if not isinstance(jawaban_masuk, dict):
                raise ValueError
        except (ValueError, TypeError):
            lanjutan_errors["answers"] = ["Format jawaban tidak valid."]
            jawaban_masuk = {}

    pertanyaan = (
        _pertanyaan_untuk_paket(bootcamp, package)
        if bootcamp.enable_registration_questions else []
    )

    for q in pertanyaan:
        isi = (jawaban_masuk.get(str(q.id)) or "").strip()
        if q.is_required and not isi:
            lanjutan_errors[f"question_{q.id}"] = ["Pertanyaan ini wajib dijawab."]
        elif isi and q.max_words and hitung_kata(isi) > q.max_words:
            lanjutan_errors[f"question_{q.id}"] = [
                f"Jawaban melebihi batas {q.max_words} kata."
            ]

    if lanjutan_errors:
        return JsonResponse({"errors": lanjutan_errors}, status=400)

    # Pendaftaran + jawabannya disimpan sebagai satu kesatuan: jangan sampai
    # ada pendaftaran yang tercatat tapi jawabannya hilang separuh.
    with db_transaction.atomic():
        if anggota_valid:
            # Dikunci & dicek ULANG di sini (bukan cuma di atas, yang tanpa
            # lock) supaya dua ketua yang kebetulan mengundang orang yang
            # sama nyaris berbarengan tidak bisa dua-duanya lolos. Belum ada
            # tulisan apa pun sebelum titik ini, jadi early-return di bawah
            # aman (tidak menyisakan baris setengah jadi).
            for user_obj in anggota_valid:
                sudah_daftar = BootcampRegistration.objects.select_for_update().filter(
                    user=user_obj, package__bootcamp=bootcamp,
                ).exists()
                if sudah_daftar:
                    return JsonResponse(
                        {"errors": {"team_member_emails": [
                            f"{user_obj.email}: baru saja terdaftar sendiri di bootcamp ini."
                        ]}},
                        status=400,
                    )
                sudah_diundang = BootcampTeamInvite.objects.select_for_update().filter(
                    invitee=user_obj, leader_registration__package__bootcamp=bootcamp,
                ).exclude(leader_registration__status=BootcampRegistration.Status.REJECTED).exists()
                if sudah_diundang:
                    return JsonResponse(
                        {"errors": {"team_member_emails": [
                            f"{user_obj.email}: baru saja diundang tim lain untuk bootcamp ini."
                        ]}},
                        status=400,
                    )

        if invitee_valid is not None:
            # Dikunci & dicek ULANG, alasannya sama persis seperti blok tim di
            # atas: dua pendaftar yang menyebut orang yang sama nyaris
            # berbarengan gak boleh dua-duanya lolos. Klaimnya dicatat SEKARANG
            # (saat daftar, bukan saat bayar) karena promonya memang dipilih di
            # form pendaftaran -- kalau baru diklaim saat bayar, orang yang
            # sudah menyebut nama duluan bisa keduluan orang lain.
            sudah_diklaim = BootcampReferredInvitee.objects.select_for_update().filter(
                bootcamp=bootcamp, invitee_email__iexact=email_ajak,
            ).exists()
            if sudah_diklaim:
                return JsonResponse(
                    {"errors": {"invited_email": [
                        f"{email_ajak}: baru saja diklaim pendaftar lain."
                    ]}},
                    status=400,
                )

        reg = BootcampRegistration.objects.create(
            user=request.user, package=package, requirement_doc=doc,
            commitment_letter=commitment_letter, cv=cv, portfolio=portfolio,
        )
        if invitee_valid is not None:
            BootcampReferredInvitee.objects.create(
                bootcamp=bootcamp,
                referrer_registration=reg,
                invitee_email=email_ajak,
                invitee_registration=invitee_valid,
            )
        if anggota_valid:
            grup = BootcampRegistrationGroup.objects.create(package=package, leader_registration=reg)
            reg.registration_group = grup
            reg.save(update_fields=["registration_group"])
            BootcampTeamInvite.objects.bulk_create([
                BootcampTeamInvite(leader_registration=reg, invitee=u) for u in anggota_valid
            ])
        if pertanyaan:
            BootcampRegistrationAnswer.objects.bulk_create([
                BootcampRegistrationAnswer(
                    registration=reg,
                    question=q,
                    # Teks pertanyaan DISALIN, lihat catatan di modelnya.
                    question_text=q.text,
                    answer_text=(jawaban_masuk.get(str(q.id)) or "").strip(),
                    order=q.order,
                )
                for q in pertanyaan
            ])

    notify_team(
        "Pendaftaran bootcamp baru",
        f"Ada pendaftaran bootcamp baru yang perlu ditinjau admin.\n\n"
        f"Pendaftar: {request.user.fullname} ({request.user.email})\n"
        f"Bootcamp: {package.bootcamp.title}\n"
        f"Paket: {package.name}\n\n"
        f"Tinjau di dashboard admin -> Pendaftaran Bootcamp.",
    )

    return JsonResponse(
        {"detail": "Pendaftaran berhasil dikirim. Menunggu ditinjau admin.",
         "registration": _serialize_registration(reg)},
        status=201,
    )


@jwt_required
def get_my_bootcamp_registrations(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    regs = (
        BootcampRegistration.objects.filter(user=request.user)
        .select_related("package__bootcamp").prefetch_related("quiz_attempts")
        .prefetch_related("payment_transactions")
        .order_by("-created_at")
    )
    return JsonResponse(
        {"registrations": [_serialize_registration(r) for r in regs]}, status=200
    )


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_registrations(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    regs = (
        BootcampRegistration.objects.select_related("package__bootcamp", "user").prefetch_related("quiz_attempts")
        .prefetch_related("payment_transactions")
        .order_by("-created_at")
    )
    status_filter = request.GET.get("status")
    if status_filter:
        regs = regs.filter(status=status_filter)

    data = []
    for r in regs:
        item = _serialize_registration(r, for_admin=True)
        item["user_name"] = r.user.fullname
        item["user_email"] = r.user.email
        data.append(item)
    return JsonResponse({"registrations": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def review_bootcamp_registration(request, registration_id):
    """Admin terima/tolak pendaftaran (hasil seleksi Mentee / ACC paket lain)."""
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        reg = BootcampRegistration.objects.select_related("package__bootcamp", "user").get(id=registration_id)
    except BootcampRegistration.DoesNotExist:
        return JsonResponse({"detail": "Pendaftaran tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    decision = request_data.get("decision")
    if decision not in ("accepted", "rejected"):
        return JsonResponse({"detail": "decision harus 'accepted' atau 'rejected'."}, status=400)

    # Keputusan yang SAMA dengan status sebelumnya dianggap "sentuhan ulang",
    # bukan keputusan baru -- emailnya tidak dikirim lagi. Ini yang melindungi
    # peserta lama saat admin memproses daftar campuran (lama + baru) setelah
    # jendela pendaftaran diperpanjang: pendaftaran lama yang sudah pernah
    # Diterima tidak akan menerima email "Diterima" kedua kalinya hanya karena
    # tersentuh lagi di tinjauan berikutnya. Kalau keputusannya benar-benar
    # berubah (mis. dari Ditolak jadi Diterima), email tetap terkirim seperti
    # biasa -- itu memang kabar baru buat pendaftar tersebut.
    keputusan_berubah = reg.status != decision

    reg.status = decision
    reg.admin_notes = request_data.get("admin_notes", "")
    reg.reviewed_at = timezone.now()
    reg.save(update_fields=["status", "admin_notes", "reviewed_at"])

    log_audit(
        request, AuditAction.UPDATE, "bootcamp_registrations", object_id=reg.id,
        new_data={"status": reg.status},
    )

    if keputusan_berubah:
        _send_bootcamp_review_email(reg)

    return JsonResponse(
        {
            "detail": "Pendaftaran berhasil diperbarui.",
            "registration": _serialize_registration(reg),
            # Transparan ke admin: apakah email hasil seleksi BENERAN terkirim
            # kali ini, atau dilewati karena keputusannya sama seperti
            # sebelumnya (lihat catatan keputusan_berubah di atas).
            "email_sent": keputusan_berubah,
        },
        status=200,
    )


def _send_bootcamp_review_email(reg):
    """Email ke PENDAFTAR sendiri (bukan cuma notify_team ke admin) begitu
    statusnya diputuskan -- sebelumnya cuma admin yang dapat notifikasi,
    pendaftar harus buka web sendiri buat tau hasilnya."""
    package = reg.package
    bootcamp_title = package.bootcamp.title

    bootcamp = package.bootcamp
    total = package.price + package.commitment_fee
    pay_link = f"{settings.FRONTEND_BASE_URL}/bootcamp/{package.bootcamp_id}/pay/{reg.id}"

    # Nilai yang boleh dipakai admin di templatenya. Semua sudah jadi teks siap
    # tampil supaya admin tidak perlu memikirkan format angka.
    nilai = {
        "nama": reg.user.fullname,
        "bootcamp": bootcamp_title,
        "paket": package.name,
        "total": f"Rp{total:,.0f}",
        "commitment_fee": f"Rp{package.commitment_fee:,.0f}",
        "link_bayar": pay_link,
        "catatan_admin": reg.admin_notes or "",
    }

    def pakai_template(subjek, badan):
        """Isi placeholder di template admin.

        Placeholder yang tidak dikenal DIBIARKAN apa adanya, bukan bikin
        pengiriman gagal -- salah ketik satu kata jangan sampai membuat
        pendaftar tidak menerima kabar sama sekali.
        """
        class Aman(dict):
            def __missing__(self, key):
                return "{" + key + "}"
        try:
            return subjek.format_map(Aman(nilai)), badan.format_map(Aman(nilai))
        except Exception:
            return subjek, badan

    if reg.status == BootcampRegistration.Status.ACCEPTED:
        if (bootcamp.email_accepted_body or "").strip():
            subject, message = pakai_template(
                (bootcamp.email_accepted_subject or "").strip()
                or f"Pendaftaran Bootcamp Diterima -- {bootcamp_title}",
                bootcamp.email_accepted_body,
            )
            send_mail_async(subject=subject, message=message, recipient_list=[reg.user.email])
            return

        commitment_line = (
            f" (termasuk commitment fee Rp{package.commitment_fee:,.0f} yang dikembalikan penuh di akhir program)"
            if package.commitment_fee > 0 else ""
        )
        subject = f"Pendaftaran Bootcamp Diterima -- {bootcamp_title}"
        message = (
            f"Halo {reg.user.fullname},\n\n"
            f"Selamat! Pendaftaran kamu untuk paket {package.name} di {bootcamp_title} DITERIMA.\n\n"
            f"Langkah selanjutnya, lakukan pembayaran sebesar Rp{total:,.0f}{commitment_line} lewat tautan berikut:\n{pay_link}\n\n"
            "Setelah bukti transfer kamu unggah, tim admin akan memverifikasi dalam waktu 1x24 jam.\n\n"
            "Sampai jumpa di kelas!"
        )
    else:
        if (bootcamp.email_rejected_body or "").strip():
            subject, message = pakai_template(
                (bootcamp.email_rejected_subject or "").strip()
                or f"Update Pendaftaran Bootcamp -- {bootcamp_title}",
                bootcamp.email_rejected_body,
            )
            send_mail_async(subject=subject, message=message, recipient_list=[reg.user.email])
            return

        subject = f"Update Pendaftaran Bootcamp -- {bootcamp_title}"
        reason_line = f"\n\nCatatan dari admin: {reg.admin_notes}" if reg.admin_notes else ""
        message = (
            f"Halo {reg.user.fullname},\n\n"
            f"Mohon maaf, pendaftaran kamu untuk paket {package.name} di {bootcamp_title} belum bisa kami terima kali ini."
            f"{reason_line}\n\n"
            "Kamu tetap bisa mendaftar paket lain yang masih terbuka di bootcamp ini kalau tersedia. "
            "Terima kasih sudah mendaftar di MARK-UP."
        )

    send_mail_async(
        subject=subject,
        message=message,
        recipient_list=[reg.user.email],
    )


# ---------- Timeline utama program (milestone, bukan jadwal sesi kelas) ----------

def get_bootcamp_timeline(request, product_id):
    """Garis waktu utama sebuah bootcamp (publik)."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = BootcampTimelineItem.objects.filter(bootcamp_id=product_id).order_by("order", "start_date")
    return JsonResponse(
        {"timeline": [_serialize_timeline_item(i) for i in items]}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_timeline_item(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    title = (request_data.get("title") or "").strip()
    raw_start_date = request_data.get("start_date")
    raw_end_date = request_data.get("end_date") or None

    errors = {}
    if not title:
        errors["title"] = ["Judul milestone wajib diisi."]
    start_date = parse_date(raw_start_date) if raw_start_date else None
    if not raw_start_date:
        errors["start_date"] = ["Tanggal mulai wajib diisi."]
    elif start_date is None:
        errors["start_date"] = ["Format tanggal mulai tidak valid (YYYY-MM-DD)."]
    end_date = None
    if raw_end_date:
        end_date = parse_date(raw_end_date)
        if end_date is None:
            errors["end_date"] = ["Format tanggal selesai tidak valid (YYYY-MM-DD)."]
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        quiz = BootcampQuiz.objects.get(id=quiz_id)
    except BootcampQuiz.DoesNotExist:
        return JsonResponse({"detail": "Tes tidak ditemukan."}, status=404)

    next_order = BootcampTimelineItem.objects.filter(bootcamp_id=product_id).count() + 1
    item = BootcampTimelineItem.objects.create(
        bootcamp_id=product_id, title=title, start_date=start_date,
        end_date=end_date, order=next_order,
    )

    return JsonResponse(
        {"detail": "Milestone berhasil ditambahkan.", "item": _serialize_timeline_item(item)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_timeline_item(request, item_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        item = BootcampTimelineItem.objects.get(id=item_id)
    except BootcampTimelineItem.DoesNotExist:
        return JsonResponse({"detail": "Milestone tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        item.delete()
        return JsonResponse({"detail": "Milestone berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    if "title" in request_data:
        item.title = request_data["title"]
    if "start_date" in request_data:
        raw_start_date = request_data["start_date"]
        if not raw_start_date:
            errors["start_date"] = ["Tanggal mulai wajib diisi."]
        else:
            parsed = parse_date(raw_start_date)
            if parsed is None:
                errors["start_date"] = ["Format tanggal mulai tidak valid (YYYY-MM-DD)."]
            else:
                item.start_date = parsed
    if "end_date" in request_data:
        raw_end_date = request_data["end_date"] or None
        if raw_end_date is None:
            item.end_date = None
        else:
            parsed = parse_date(raw_end_date)
            if parsed is None:
                errors["end_date"] = ["Format tanggal selesai tidak valid (YYYY-MM-DD)."]
            else:
                item.end_date = parsed
    if "order" in request_data:
        item.order = request_data["order"]
    if errors:
        return JsonResponse({"errors": errors}, status=400)
    item.save()

    return JsonResponse(
        {"detail": "Milestone berhasil diperbarui.", "item": _serialize_timeline_item(item)},
        status=200,
    )


# ---------- Syarat pendaftaran (dulu hardcoded di frontend) ----------

def _serialize_requirement(item):
    return {
        "id": str(item.id),
        "category": item.category,
        "text": item.text,
        "order": item.order,
    }


def get_bootcamp_requirements(request, product_id):
    """Daftar syarat pendaftaran & struktur commitment letter sebuah
    bootcamp (publik) -- dibedain lewat field `category` tiap item."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = BootcampRequirement.objects.filter(bootcamp_id=product_id).order_by("category", "order")

    max_words = None
    require_letter = True
    questions = []
    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
        max_words = bootcamp.commitment_letter_max_words
        require_letter = bootcamp.require_commitment_letter
        # Cuma pertanyaan AKTIF yang dikirim ke formulir publik. Yang sudah
        # dimatikan tetap ada di database supaya jawaban lama tidak yatim.
        if bootcamp.enable_registration_questions:
            # Semua pertanyaan aktif dikirim BESERTA info paketnya; formulir yang
            # menyaring sesuai paket yang sedang dipilih pendaftar. Dengan begitu
            # pertanyaannya langsung berubah saat pilihan paket diganti, tanpa
            # perlu memuat ulang dari server.
            questions = [
                _serialize_registration_question(q)
                for q in bootcamp.registration_questions.filter(is_active=True)
                .prefetch_related("packages").order_by("order", "id")
            ]
    except BootcampProduct.DoesNotExist:
        pass

    return JsonResponse(
        {
            "requirements": [_serialize_requirement(i) for i in items],
            "commitment_letter_max_words": max_words,
            "require_commitment_letter": require_letter,
            "questions": questions,
        },
        status=200,
    )


def _serialize_registration_question(q):
    return {
        "id": str(q.id),
        "text": q.text,
        "helper_text": q.helper_text,
        "is_required": q.is_required,
        "max_words": q.max_words,
        "order": q.order,
        "is_active": q.is_active,
        "for_all_packages": q.for_all_packages,
        "package_ids": [str(x.id) for x in q.packages.all()],
    }


def _pertanyaan_untuk_paket(bootcamp, package):
    """Pertanyaan aktif yang berlaku untuk paket tertentu.

    Sengaja TIDAK memakai aturan "daftar paket kosong berarti semua": kalau
    admin menandai sebuah pertanyaan khusus paket tapi belum memilih paketnya,
    pertanyaan itu tidak ditanyakan ke siapa pun. Membiarkannya terbuka ke
    semua orang adalah kebalikan dari yang dimaksud admin.
    """
    hasil = []
    for q in bootcamp.registration_questions.filter(is_active=True).prefetch_related("packages").order_by("order", "id"):
        if q.for_all_packages:
            hasil.append(q)
        elif package is not None and q.packages.filter(pk=package.pk).exists():
            hasil.append(q)
    return hasil


def hitung_kata(teks):
    """Jumlah kata versi server. Dipakai buat menegakkan batas kata jawaban --
    batas di formulir cuma bantuan tampilan, gampang dilewati."""
    return len([w for w in (teks or "").split() if w.strip()])


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_requirement(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    text = (request_data.get("text") or "").strip()
    if not text:
        return JsonResponse({"errors": {"text": ["Teks syarat wajib diisi."]}}, status=400)

    category = (request_data.get("category") or BootcampRequirementCategory.GENERAL).strip()
    if category not in BootcampRequirementCategory.values:
        return JsonResponse({"errors": {"category": ["Kategori tidak valid."]}}, status=400)

    try:
        BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    next_order = BootcampRequirement.objects.filter(bootcamp_id=product_id, category=category).count() + 1
    item = BootcampRequirement.objects.create(
        bootcamp_id=product_id, category=category, text=text, order=next_order,
    )

    return JsonResponse(
        {"detail": "Syarat berhasil ditambahkan.", "item": _serialize_requirement(item)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_requirement(request, item_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        item = BootcampRequirement.objects.get(id=item_id)
    except BootcampRequirement.DoesNotExist:
        return JsonResponse({"detail": "Syarat tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        item.delete()
        return JsonResponse({"detail": "Syarat berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "text" in request_data:
        text = (request_data["text"] or "").strip()
        if not text:
            return JsonResponse({"errors": {"text": ["Teks syarat wajib diisi."]}}, status=400)
        item.text = text
    if "order" in request_data:
        item.order = request_data["order"]
    item.save()

    return JsonResponse(
        {"detail": "Syarat berhasil diperbarui.", "item": _serialize_requirement(item)},
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_commitment_letter_settings(request, product_id):
    """Admin atur batas maksimal kata commitment letter (informasional,
    gak divalidasi ketat di backend -- cuma ditampilkan ke peserta)."""
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        max_words = int(request_data.get("max_words"))
        if max_words < 1:
            raise ValueError
    except (TypeError, ValueError):
        return JsonResponse({"errors": {"max_words": ["Batas kata harus angka >= 1."]}}, status=400)

    bootcamp.commitment_letter_max_words = max_words
    bootcamp.save(update_fields=["commitment_letter_max_words"])

    return JsonResponse(
        {"detail": "Batas kata berhasil diperbarui.", "commitment_letter_max_words": max_words},
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_package(request, package_id):
    """Admin atur jendela pendaftaran (& aktif/nonaktif) satu paket."""
    if request.method not in ["PATCH", "PUT"]:
        return HttpResponseNotAllowed(["PATCH", "PUT"])

    try:
        package = BootcampPackage.objects.get(id=package_id)
    except BootcampPackage.DoesNotExist:
        return JsonResponse({"detail": "Paket tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "registration_opens_at" in request_data:
        package.registration_opens_at = _parse_wib_datetime_or_none(request_data["registration_opens_at"])
    if "registration_closes_at" in request_data:
        package.registration_closes_at = _parse_wib_datetime_or_none(request_data["registration_closes_at"])
    if "payment_deadline_at" in request_data:
        package.payment_deadline_at = _parse_wib_datetime_or_none(request_data["payment_deadline_at"])
    if "is_active" in request_data:
        package.is_active = bool(request_data["is_active"])
    if "requires_selection" in request_data:
        package.requires_selection = bool(request_data["requires_selection"])

    errors = {}
    if "selection_quota" in request_data:
        raw_quota = request_data["selection_quota"]
        if raw_quota in (None, ""):
            package.selection_quota = None
        else:
            try:
                quota = int(raw_quota)
                if quota < 1:
                    raise ValueError
                package.selection_quota = quota
            except (TypeError, ValueError):
                errors["selection_quota"] = ["Kuota harus berupa angka minimal 1, atau dikosongkan apabila tanpa batas."]
    if "name" in request_data:
        name = (request_data["name"] or "").strip()
        if not name:
            errors["name"] = ["Nama paket wajib diisi."]
        else:
            package.name = name
    if "price" in request_data:
        try:
            price = Decimal(str(request_data["price"])).quantize(Decimal("0.01"))
            if price < 0:
                raise ValueError
            package.price = price
        except (TypeError, ValueError, InvalidOperation):
            errors["price"] = ["Harga harus angka >= 0."]
    if "commitment_fee" in request_data:
        try:
            fee = Decimal(str(request_data["commitment_fee"])).quantize(Decimal("0.01"))
            if fee < 0:
                raise ValueError
            package.commitment_fee = fee
        except (TypeError, ValueError, InvalidOperation):
            errors["commitment_fee"] = ["Commitment fee harus angka >= 0."]
    if "benefits" in request_data:
        benefits = request_data["benefits"] or {}
        valid_keys = {field for field, _ in _BENEFIT_LABELS}
        if not isinstance(benefits, dict) or not set(benefits.keys()) <= valid_keys:
            errors["benefits"] = ["Format benefit tidak valid."]
        else:
            for key, value in benefits.items():
                setattr(package, key, bool(value))
    if "quiz_duration_minutes" in request_data:
        try:
            minutes = int(request_data["quiz_duration_minutes"])
            if not (5 <= minutes <= 180):
                raise ValueError
            package.quiz_duration_minutes = minutes
        except (TypeError, ValueError):
            errors["quiz_duration_minutes"] = ["Durasi tes harus angka 5-180 menit."]
    if "quiz_passing_score_percent" in request_data:
        try:
            score = int(request_data["quiz_passing_score_percent"])
            if not (0 <= score <= 100):
                raise ValueError
            package.quiz_passing_score_percent = score
        except (TypeError, ValueError):
            errors["quiz_passing_score_percent"] = ["Skor kelulusan harus angka 0-100."]
    if "min_attendance_sessions" in request_data:
        try:
            min_sessions = int(request_data["min_attendance_sessions"])
            if min_sessions < 0:
                raise ValueError
            package.min_attendance_sessions = min_sessions
        except (TypeError, ValueError):
            errors["min_attendance_sessions"] = ["Syarat kehadiran harus angka >= 0."]

    # --- Harga tim -------------------------------------------------------
    if "group_size" in request_data:
        try:
            ukuran = int(request_data["group_size"])
            if ukuran < 0:
                raise ValueError
            package.group_size = ukuran
        except (TypeError, ValueError):
            errors["group_size"] = ["Ukuran tim harus angka >= 0 (0 = mati)."]
    if "group_price" in request_data:
        raw = request_data["group_price"]
        if raw in (None, ""):
            package.group_price = None
        else:
            try:
                harga_tim = Decimal(str(raw)).quantize(Decimal("0.01"))
                if harga_tim < 0:
                    raise ValueError
                package.group_price = harga_tim
            except (TypeError, ValueError, InvalidOperation):
                errors["group_price"] = ["Harga tim harus angka >= 0, atau dikosongkan."]

    # --- Ajak teman --------------------------------------------------------
    if "referral_invite_enabled" in request_data:
        package.referral_invite_enabled = bool(request_data["referral_invite_enabled"])
    if "referral_invite_discount_percent" in request_data:
        try:
            persen = int(request_data["referral_invite_discount_percent"])
            if not (0 <= persen <= 100):
                raise ValueError
            package.referral_invite_discount_percent = persen
        except (TypeError, ValueError):
            errors["referral_invite_discount_percent"] = ["Persen potongan harus angka 0-100."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    package.save()

    return JsonResponse(
        {"detail": "Paket berhasil diperbarui.", "package": _serialize_package(package)},
        status=200,
    )


def _unique_package_slug(bootcamp_id, name):
    """Bikin slug unik per bootcamp dari nama paket. Slug cuma dipakai buat
    tampilan (gak ada logic yang ngecek nilainya), tapi tetap harus unik
    karena ada UniqueConstraint (bootcamp, slug) di database."""
    base = slugify(name)[:40] or "paket"
    slug = base
    n = 2
    while BootcampPackage.objects.filter(bootcamp_id=bootcamp_id, slug=slug).exists():
        suffix = f"-{n}"
        slug = f"{base[:50 - len(suffix)]}{suffix}"
        n += 1
    return slug


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_package(request, product_id):
    """Bikin paket baru buat sebuah bootcamp. Sebelumnya paket cuma bisa lahir
    otomatis dari DEFAULT_BOOTCAMP_PACKAGES (mentok 4 & namanya terkunci)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Bootcamp tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    name = (request_data.get("name") or "").strip()
    if not name:
        errors["name"] = ["Nama paket wajib diisi."]

    price = Decimal("0")
    if "price" in request_data:
        try:
            price = Decimal(str(request_data["price"])).quantize(Decimal("0.01"))
            if price < 0:
                raise ValueError
        except (TypeError, ValueError, InvalidOperation):
            errors["price"] = ["Harga harus angka >= 0."]

    commitment_fee = Decimal("0")
    if "commitment_fee" in request_data:
        try:
            commitment_fee = Decimal(str(request_data["commitment_fee"])).quantize(Decimal("0.01"))
            if commitment_fee < 0:
                raise ValueError
        except (TypeError, ValueError, InvalidOperation):
            errors["commitment_fee"] = ["Commitment fee harus angka >= 0."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    last_order = (
        BootcampPackage.objects.filter(bootcamp=bootcamp)
        .aggregate(models.Max("order"))["order__max"] or 0
    )

    package = BootcampPackage.objects.create(
        bootcamp=bootcamp,
        slug=_unique_package_slug(bootcamp.pk, name),
        name=name,
        price=price,
        commitment_fee=commitment_fee,
        requires_selection=bool(request_data.get("requires_selection", False)),
        order=last_order + 1,
    )

    log_audit(request, AuditAction.CREATE, "bootcamp_packages", object_id=package.id)

    return JsonResponse(
        {"detail": "Paket berhasil dibuat.", "package": _serialize_package(package)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def delete_bootcamp_package(request, package_id):
    """Hapus paket. Sengaja DITOLAK kalau paket udah punya pendaftar atau
    pembelian -- FK-nya CASCADE, jadi kalau dibiarin, hapus paket bakal ikut
    ngapus riwayat pendaftaran & akses peserta tanpa peringatan apa pun."""
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    try:
        package = BootcampPackage.objects.get(id=package_id)
    except BootcampPackage.DoesNotExist:
        return JsonResponse({"detail": "Paket tidak ditemukan."}, status=404)

    reg_count = BootcampRegistration.objects.filter(package=package).count()
    lib_count = UserLibrary.objects.filter(package=package).count()
    if reg_count or lib_count:
        return JsonResponse(
            {
                "detail": (
                    f"Paket ini sudah digunakan ({reg_count} pendaftaran, {lib_count} pembelian) "
                    "sehingga tidak dapat dihapus. Silakan nonaktifkan melalui tombol Aktif/Nonaktif "
                    "agar tidak tampil di halaman pendaftaran, sementara riwayatnya tetap tersimpan."
                )
            },
            status=400,
        )

    log_audit(request, AuditAction.DELETE, "bootcamp_packages", object_id=package.id)
    package.delete()
    return JsonResponse({"detail": "Paket berhasil dihapus."}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_package_extra_benefit(request, package_id):
    """Tambah benefit tampilan bebas ke sebuah paket."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        package = BootcampPackage.objects.get(id=package_id)
    except BootcampPackage.DoesNotExist:
        return JsonResponse({"detail": "Paket tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    label = (request_data.get("label") or "").strip()
    if not label:
        return JsonResponse({"errors": {"label": ["Teks benefit wajib diisi."]}}, status=400)

    last_order = (
        package.extra_benefits.aggregate(models.Max("order"))["order__max"] or 0
    )
    benefit = BootcampPackageExtraBenefit.objects.create(
        package=package, label=label, order=last_order + 1,
    )

    return JsonResponse(
        {
            "detail": "Benefit tambahan dibuat.",
            "extra_benefit": {"id": str(benefit.id), "label": benefit.label, "order": benefit.order},
        },
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def delete_package_extra_benefit(request, benefit_id):
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    try:
        benefit = BootcampPackageExtraBenefit.objects.get(id=benefit_id)
    except BootcampPackageExtraBenefit.DoesNotExist:
        return JsonResponse({"detail": "Benefit tidak ditemukan."}, status=404)

    benefit.delete()
    return JsonResponse({"detail": "Benefit tambahan dihapus."}, status=200)


# ---------- Resource (file) benefit eksklusif per paket ----------

MAX_BOOTCAMP_RESOURCE_SIZE = 20 * 1024 * 1024  # 20MB


def _serialize_bootcamp_resource(resource):
    return {
        "id": str(resource.id),
        "resource_type": resource.resource_type,
        "resource_type_label": resource.get_resource_type_display(),
        "title": resource.title,
        "file": resource.file.url if resource.file else None,
        "for_all_packages": resource.for_all_packages,
        "package_ids": [str(p.id) for p in resource.packages.all()],
        "created_at": resource.created_at.isoformat(),
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_resources(request, product_id):
    """Admin: daftar semua resource sebuah bootcamp (semua jenis)."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    resources = BootcampResource.objects.filter(bootcamp_id=product_id)
    return JsonResponse(
        {"resources": [_serialize_bootcamp_resource(r) for r in resources]}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_resource(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    title = (request.POST.get("title") or "").strip()
    resource_type = (request.POST.get("resource_type") or "").strip()
    file = request.FILES.get("file")

    errors = {}
    if not title:
        errors["title"] = ["Judul wajib diisi."]
    # Sekarang cuma label kategori (boleh kosong) -- hak aksesnya ditentukan
    # pilihan paket di bawah, bukan lagi jenis ini.
    if resource_type and resource_type not in BootcampResourceType.values:
        errors["resource_type"] = ["Jenis materi tidak valid."]
    if not file:
        errors["file"] = ["File wajib diunggah."]
    elif file.size > MAX_BOOTCAMP_RESOURCE_SIZE:
        errors["file"] = ["Ukuran file maksimal 20MB."]
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    # "semua" = semua peserta bootcamp ini (yang sudah bayar), bukan publik.
    for_all = str(request.POST.get("for_all_packages", "true")).lower() not in ("false", "0")
    package_ids = [x for x in (request.POST.getlist("package_ids") or []) if x]

    resource = BootcampResource.objects.create(
        bootcamp_id=product_id, resource_type=resource_type, title=title, file=file,
        for_all_packages=for_all,
    )
    if not for_all and package_ids:
        # Cuma paket milik bootcamp ini -- jangan sampai admin nyantol paket
        # dari bootcamp lain lewat request yang dikarang.
        resource.packages.set(
            BootcampPackage.objects.filter(id__in=package_ids, bootcamp_id=product_id)
        )

    return JsonResponse(
        {"detail": "Resource berhasil ditambahkan.", "resource": _serialize_bootcamp_resource(resource)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_resource(request, resource_id):
    """PATCH/PUT cuma buat ganti judul/jenis benefit (JSON) -- ganti file
    lewat hapus lalu tambah baru lagi, biar gak perlu parsing multipart di
    PATCH/PUT (Django gak nge-parse request.FILES otomatis di method itu)."""
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        resource = BootcampResource.objects.get(id=resource_id)
    except BootcampResource.DoesNotExist:
        return JsonResponse({"detail": "Resource tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        resource.delete()
        return JsonResponse({"detail": "Resource berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "resource_type" in request_data:
        resource_type = request_data["resource_type"]
        if resource_type not in BootcampResourceType.values:
            return JsonResponse({"errors": {"resource_type": ["Jenis benefit tidak valid."]}}, status=400)
        resource.resource_type = resource_type
    if "title" in request_data:
        resource.title = request_data["title"]
    resource.save()

    return JsonResponse(
        {"detail": "Resource berhasil diperbarui.", "resource": _serialize_bootcamp_resource(resource)},
        status=200,
    )


# ---------- Tes seleksi BCC General Knowledge (Mentee) ----------

def _serialize_quiz_question(q, include_answer=False):
    data = {
        "id": str(q.id),
        "question_text": q.question_text,
        "choice_a": q.choice_a,
        "choice_b": q.choice_b,
        "choice_c": q.choice_c,
        "choice_d": q.choice_d,
        "order": q.order,
        "is_active": q.is_active,
    }
    if include_answer:
        data["correct_choice"] = q.correct_choice
    return data


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_quiz_questions(request, quiz_id):
    """Admin: daftar bank soal (termasuk kunci jawaban)."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    questions = BootcampQuizQuestion.objects.filter(quiz_id=quiz_id).order_by("order")
    return JsonResponse(
        {"questions": [_serialize_quiz_question(q, include_answer=True) for q in questions]}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_quiz_question(request, quiz_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        quiz = BootcampQuiz.objects.get(id=quiz_id)
    except BootcampQuiz.DoesNotExist:
        return JsonResponse({"detail": "Tes tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    question_text = (request_data.get("question_text") or "").strip()
    choice_a = (request_data.get("choice_a") or "").strip()
    choice_b = (request_data.get("choice_b") or "").strip()
    choice_c = (request_data.get("choice_c") or "").strip()
    choice_d = (request_data.get("choice_d") or "").strip()
    correct_choice = (request_data.get("correct_choice") or "").strip().lower()

    errors = {}
    if not question_text:
        errors["question_text"] = ["Pertanyaan wajib diisi."]
    if not choice_a:
        errors["choice_a"] = ["Pilihan A wajib diisi."]
    if not choice_b:
        errors["choice_b"] = ["Pilihan B wajib diisi."]
    if not choice_c:
        errors["choice_c"] = ["Pilihan C wajib diisi."]
    if not choice_d:
        errors["choice_d"] = ["Pilihan D wajib diisi."]
    if correct_choice not in QuizChoiceKey.values:
        errors["correct_choice"] = ["Kunci jawaban wajib salah satu dari A/B/C/D."]
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    next_order = BootcampQuizQuestion.objects.filter(quiz=quiz).count() + 1
    question = BootcampQuizQuestion.objects.create(
        quiz=quiz, question_text=question_text,
        choice_a=choice_a, choice_b=choice_b, choice_c=choice_c, choice_d=choice_d,
        correct_choice=correct_choice, order=next_order,
    )

    return JsonResponse(
        {"detail": "Soal berhasil ditambahkan.",
         "question": _serialize_quiz_question(question, include_answer=True)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_quiz_question(request, question_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        question = BootcampQuizQuestion.objects.get(id=question_id)
    except BootcampQuizQuestion.DoesNotExist:
        return JsonResponse({"detail": "Soal tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        question.delete()
        return JsonResponse({"detail": "Soal berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    if "correct_choice" in request_data:
        cc = (request_data["correct_choice"] or "").strip().lower()
        if cc not in QuizChoiceKey.values:
            errors["correct_choice"] = ["Kunci jawaban wajib salah satu dari A/B/C/D."]
        else:
            question.correct_choice = cc
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if "question_text" in request_data:
        question.question_text = request_data["question_text"]
    if "choice_a" in request_data:
        question.choice_a = request_data["choice_a"]
    if "choice_b" in request_data:
        question.choice_b = request_data["choice_b"]
    if "choice_c" in request_data:
        question.choice_c = request_data["choice_c"]
    if "choice_d" in request_data:
        question.choice_d = request_data["choice_d"]
    if "order" in request_data:
        question.order = request_data["order"]
    if "is_active" in request_data:
        question.is_active = bool(request_data["is_active"])
    question.save()

    return JsonResponse(
        {"detail": "Soal berhasil diperbarui.",
         "question": _serialize_quiz_question(question, include_answer=True)},
        status=200,
    )


def _serialize_quiz_attempt_for_participant(attempt):
    """TIDAK PERNAH menyertakan correct_choice atau skor -- lihat
    _serialize_registration untuk skor (cuma bocor ke admin lewat for_admin=True)."""
    question_ids = [item["question_id"] for item in attempt.question_order]
    questions_by_id = {
        str(q.id): q for q in BootcampQuizQuestion.objects.filter(id__in=question_ids)
    }
    answers_by_qid = {str(a.question_id): a.selected_choice for a in attempt.answers.all()}

    questions = []
    for item in attempt.question_order:
        q = questions_by_id.get(item["question_id"])
        if not q:
            continue
        choice_text = {"a": q.choice_a, "b": q.choice_b, "c": q.choice_c, "d": q.choice_d}
        questions.append({
            "question_id": str(q.id),
            "question_text": q.question_text,
            "choices": [{"key": key, "text": choice_text[key]} for key in item["choice_display_order"]],
            "selected_choice": answers_by_qid.get(str(q.id)),
        })

    return {
        "id": str(attempt.id),
        "status": attempt.status,
        "deadline": attempt.deadline.isoformat(),
        "started_at": attempt.started_at.isoformat(),
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "questions": questions,
    }


def _finalize_quiz_attempt(attempt):
    """Hitung skor 100% dari jawaban & kunci jawaban di database, lalu
    finalisasi attempt (submitted kalau masih dalam waktu, expired kalau
    ternyata sudah lewat deadline). Dipakai di 3 titik: start/resume,
    save-answer, dan submit -- jadi deadline ditegakkan server di mana pun
    request itu sampai duluan."""
    question_ids = [item["question_id"] for item in attempt.question_order]
    correct_by_qid = {
        str(qid): correct
        for qid, correct in BootcampQuizQuestion.objects.filter(id__in=question_ids).values_list(
            "id", "correct_choice"
        )
    }
    answers_by_qid = {str(a.question_id): a.selected_choice for a in attempt.answers.all()}

    total = len(question_ids)
    correct_count = sum(
        1 for qid in question_ids if answers_by_qid.get(qid) == correct_by_qid.get(qid)
    )
    score = (Decimal(correct_count) / Decimal(total) * 100) if total else Decimal("0")
    score = score.quantize(Decimal("0.01"))

    now = timezone.now()
    attempt.status = (
        BootcampQuizAttempt.Status.EXPIRED if now > attempt.deadline
        else BootcampQuizAttempt.Status.SUBMITTED
    )
    attempt.score_percent = score
    # Ambang lulus sekarang per-tes (dulu per-paket), jadi tiap tes bisa beda
    # standarnya. Fallback ke setelan paket buat attempt lama yang belum
    # ketaut ke tes mana pun.
    passing = (
        attempt.quiz.passing_score_percent if attempt.quiz_id
        else attempt.registration.package.quiz_passing_score_percent
    )
    attempt.passed = score >= Decimal(passing)
    attempt.submitted_at = now
    attempt.save(update_fields=["status", "score_percent", "passed", "submitted_at"])
    return attempt


@csrf_exempt
@jwt_required
def start_or_resume_bootcamp_quiz(request, registration_id, quiz_id):
    """Mulai tes BCC (attempt baru) atau lanjutkan attempt yang sudah ada.
    Soal & kunci jawaban tidak pernah ikut serialisasi ini -- lihat
    _serialize_quiz_attempt_for_participant."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:bootcamp-quiz-start:user:{request.user.id}", limit=20, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        registration = BootcampRegistration.objects.select_related("package__bootcamp").get(
            id=registration_id, user=request.user,
        )
    except BootcampRegistration.DoesNotExist:
        return JsonResponse({"detail": "Pendaftaran tidak ditemukan."}, status=404)

    package = registration.package
    if not package.requires_selection:
        return JsonResponse({"detail": "Paket ini tidak memerlukan tes seleksi."}, status=400)
    if registration.status != BootcampRegistration.Status.REGISTERED:
        return JsonResponse(
            {"detail": "Tes hanya dapat dikerjakan selama status pendaftaran masih dalam peninjauan."}, status=400
        )

    # Tes harus punya bootcamp yang sama dengan paket pendaftaran ini -- kalau
    # nggak dicek, peserta bisa nembak quiz_id milik bootcamp lain.
    try:
        quiz = BootcampQuiz.objects.get(
            id=quiz_id, bootcamp_id=package.bootcamp_id, is_active=True,
        )
    except BootcampQuiz.DoesNotExist:
        return JsonResponse({"detail": "Tes tidak ditemukan."}, status=404)

    attempt = BootcampQuizAttempt.objects.filter(
        registration=registration, quiz=quiz,
    ).first()

    if attempt is None:
        questions = list(
            BootcampQuizQuestion.objects.filter(quiz=quiz, is_active=True)
        )
        if not questions:
            return JsonResponse({"detail": "Bank soal belum tersedia. Hubungi admin."}, status=400)

        question_order = []
        for q in questions:
            choices = ["a", "b", "c", "d"]
            random.shuffle(choices)
            question_order.append({"question_id": str(q.id), "choice_display_order": choices})
        random.shuffle(question_order)

        deadline = timezone.now() + timedelta(minutes=quiz.duration_minutes)
        try:
            attempt = BootcampQuizAttempt.objects.create(
                registration=registration, quiz=quiz,
                question_order=question_order, deadline=deadline,
            )
        except IntegrityError:
            # Race: attempt sudah kebuat dari request lain yang nyaris bersamaan --
            # UniqueConstraint (registration, quiz) yang jadi jaminan sebenarnya,
            # bukan cek None di atas.
            attempt = BootcampQuizAttempt.objects.get(registration=registration, quiz=quiz)
    elif attempt.status == BootcampQuizAttempt.Status.IN_PROGRESS and timezone.now() > attempt.deadline:
        _finalize_quiz_attempt(attempt)

    return JsonResponse({"attempt": _serialize_quiz_attempt_for_participant(attempt)}, status=200)


@csrf_exempt
@jwt_required
def save_bootcamp_quiz_answer(request, attempt_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:bootcamp-quiz-answer:user:{request.user.id}", limit=300, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        attempt = BootcampQuizAttempt.objects.select_related(
            "registration__package"
        ).get(id=attempt_id, registration__user=request.user)
    except BootcampQuizAttempt.DoesNotExist:
        return JsonResponse({"detail": "Attempt tidak ditemukan."}, status=404)

    if attempt.status != BootcampQuizAttempt.Status.IN_PROGRESS:
        return JsonResponse({"detail": "Tes ini sudah selesai dikumpulkan."}, status=400)

    if timezone.now() > attempt.deadline:
        _finalize_quiz_attempt(attempt)
        return JsonResponse({"detail": "Waktu tes sudah habis."}, status=400)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    question_id = str(request_data.get("question_id") or "")
    selected_choice = (request_data.get("selected_choice") or "").strip().lower()

    valid_question_ids = {item["question_id"] for item in attempt.question_order}
    if question_id not in valid_question_ids:
        return JsonResponse({"detail": "Soal tidak valid untuk attempt ini."}, status=400)
    if selected_choice not in QuizChoiceKey.values:
        return JsonResponse({"detail": "Pilihan jawaban tidak valid."}, status=400)

    BootcampQuizAnswer.objects.update_or_create(
        attempt=attempt, question_id=question_id, defaults={"selected_choice": selected_choice},
    )

    return JsonResponse({"detail": "Jawaban tersimpan."}, status=200)


@csrf_exempt
@jwt_required
def submit_bootcamp_quiz(request, attempt_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:bootcamp-quiz-submit:user:{request.user.id}", limit=20, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        attempt = BootcampQuizAttempt.objects.select_related(
            "registration__package"
        ).get(id=attempt_id, registration__user=request.user)
    except BootcampQuizAttempt.DoesNotExist:
        return JsonResponse({"detail": "Attempt tidak ditemukan."}, status=404)

    if attempt.status != BootcampQuizAttempt.Status.IN_PROGRESS:
        return JsonResponse(
            {"detail": "Tes ini sudah selesai dikumpulkan.",
             "attempt": _serialize_quiz_attempt_for_participant(attempt)},
            status=200,
        )

    _finalize_quiz_attempt(attempt)

    return JsonResponse(
        {"detail": "Tes berhasil dikumpulkan.",
         "attempt": _serialize_quiz_attempt_for_participant(attempt)},
        status=200,
    )


# ---------- Pembayaran setelah pendaftaran Diterima ----------

@csrf_exempt
@jwt_required
def create_bootcamp_payment(request, registration_id):
    """Bikin Transaction buat pendaftaran yang sudah Diterima -- beda dari
    checkout_product biasa (yang harganya per-Product, bukan per-paket, dan
    minta 3 dokumen lama yang sekarang udah digantiin requirement_doc di
    BootcampRegistration). verify_transaction admin yang sudah ada TETAP
    dipakai apa adanya buat verifikasi & bikin UserLibrary + sesi -- endpoint
    ini cuma bikin Transaction+TransactionItem dalam bentuk yang sama persis
    yang dikenali verify_transaction, gak ada logic verifikasi baru di sini."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if is_rate_limited(f"rl:bootcamp-pay:user:{request.user.id}", limit=10, window_seconds=3600):
        return JsonResponse({"detail": "Terlalu banyak percobaan. Coba lagi nanti."}, status=429)

    try:
        registration = BootcampRegistration.objects.select_related("package__bootcamp").get(
            id=registration_id, user=request.user,
        )
    except BootcampRegistration.DoesNotExist:
        return JsonResponse({"detail": "Pendaftaran tidak ditemukan."}, status=404)

    if registration.status != BootcampRegistration.Status.ACCEPTED:
        return JsonResponse(
            {"detail": "Pembayaran hanya dapat dilakukan setelah pendaftaran berstatus Diterima."}, status=400
        )

    deadline = registration.package.payment_deadline_at
    if deadline and timezone.now() > deadline:
        return JsonResponse(
            {"detail": "Batas waktu pembayaran sudah lewat. Hubungi admin kalau ini keliru."}, status=400
        )

    existing = registration.payment_transactions.filter(
        payment_status__in=[PaymentStatus.PENDING, PaymentStatus.PAID]
    ).exists()
    if existing:
        return JsonResponse(
            {"detail": "Sudah ada pembayaran yang sedang diproses/lunas untuk pendaftaran ini."}, status=400
        )

    # request.POST kosong kalau body-nya JSON (bukan form-encoded/multipart)
    # -- jalur iPaymu di bawah dikirim FE sebagai JSON (gak ada file sama
    # sekali), jadi field-field non-file-nya dibaca lewat get_request_data
    # yang mengenali dua-duanya, bukan request.POST langsung.
    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    # payment_gateway OPT-IN -- perlakuan & alasannya persis sama seperti di
    # transactions.views.checkout_product: gak dikirim = jalur manual apa
    # adanya seperti sebelum iPaymu ada.
    payment_gateway = (request_data.get("payment_gateway") or PaymentGateway.MANUAL).upper()
    if payment_gateway not in (PaymentGateway.MANUAL, PaymentGateway.IPAYMU):
        return JsonResponse({"detail": "payment_gateway tidak dikenali."}, status=400)

    proof_file = request.FILES.get("proof_of_payment")
    if payment_gateway == PaymentGateway.MANUAL:
        if not proof_file:
            return JsonResponse({"detail": "Bukti pembayaran diperlukan."}, status=400)

        ext = proof_file.name.rsplit(".", 1)[-1].lower() if "." in proof_file.name else ""
        if ext not in ALLOWED_PAYMENT_PROOF_EXTENSIONS:
            return JsonResponse({"detail": "Format file tidak didukung."}, status=400)
        if proof_file.size > MAX_PAYMENT_PROOF_SIZE:
            return JsonResponse({"detail": "Ukuran file maksimal 5MB."}, status=400)
    else:
        if not IpaymuSetting.get_solo().is_enabled:
            return JsonResponse(
                {"detail": "Pembayaran iPaymu belum aktif, gunakan transfer bank manual."}, status=400
            )

    package = registration.package
    bootcamp_product = package.bootcamp
    commitment_fee_amount = package.commitment_fee

    # Harga tim: cuma berlaku kalau pendaftaran ini KETUA tim (`led_team_group`
    # ada). Tim wajib lengkap sejak daftar (tidak ada status "menyusul" --
    # lihat register_bootcamp), jadi begitu ketuanya ada berarti timnya SUDAH
    # PASTI lengkap. Dibayar SEKALI buat SELURUH anggota (harga & commitment
    # fee per orang dikali jumlah anggota), bukan per orang seperti biasa --
    # anggota lain gak pernah lewat endpoint ini sama sekali, mereka
    # diprovisikan otomatis begitu pembayaran ketua ini di-ACC admin (lihat
    # _provision_team_members di transactions/views.py).
    sub_total = package.price
    if getattr(registration, "led_team_group", None) is not None and package.group_price is not None:
        sub_total = package.group_price * package.group_size
        commitment_fee_amount = commitment_fee_amount * package.group_size

    # Kode referral -- dipotong CUMA dari harga paket, commitment fee gak ikut
    # didiskon karena duit itu bukan pendapatan (dikembalikan penuh ke peserta
    # di akhir program), jadi mendiskonnya sama aja bikin selisih kas pas refund.
    voucher_code = (request_data.get("referral_code") or "").strip()
    referral_code = None
    discount_amount = Decimal("0")
    if voucher_code:
        try:
            referral_code = ReferralCode.objects.get(code__iexact=voucher_code)
        except ReferralCode.DoesNotExist:
            return JsonResponse({"detail": "Kode referral tidak ditemukan."}, status=400)

        if not referral_code.is_valid_for_product(bootcamp_product.product, user=request.user):
            return JsonResponse(
                {"detail": "Kode referral tidak berlaku, sudah tidak aktif, atau sudah pernah kamu pakai."},
                status=400,
            )
        discount_amount = referral_code.compute_discount(sub_total)

    # Ajak teman -- BEDA dari kode referral di atas (itu satu kode buat siapa
    # saja; ini menyebut ORANG SPESIFIK). Sejak promonya dipindah ke form
    # PENDAFTARAN, halaman bayar TIDAK lagi menerima input email: yang dipakai
    # adalah klaim yang sudah tercatat waktu daftar (BootcampReferredInvitee),
    # jadi potongannya gak bisa lagi ditambahkan diam-diam di tahap bayar, dan
    # pendaftar gak bisa kehilangan klaimnya gara-gara keduluan orang lain di
    # antara daftar dan bayar.
    sudah_ajak = (
        BootcampReferredInvitee.objects.filter(referrer_registration=registration).exists()
        if package.referral_invite_enabled else False
    )

    invite_discount_amount = Decimal("0")
    if sudah_ajak:
        sisa_setelah_kode = sub_total - discount_amount
        invite_discount_amount = (
            sisa_setelah_kode * Decimal(package.referral_invite_discount_percent) / Decimal("100")
        ).quantize(Decimal("0.01"))

    grand_total = (sub_total - discount_amount - invite_discount_amount) + commitment_fee_amount

    try:
        with db_transaction.atomic():
            # Kuota kode dikunci di dalam transaksi (bukan cuma dicek di atas)
            # supaya dua orang yang nembak kode sisa-1 barengan gak dua-duanya lolos.
            if referral_code is not None:
                locked_referral = ReferralCode.objects.select_for_update().get(pk=referral_code.pk)
                if not locked_referral.is_valid_for_product(bootcamp_product.product, user=request.user):
                    return JsonResponse(
                        {"detail": "Kode referral tidak berlaku, kuotanya habis, atau sudah pernah kamu pakai."},
                        status=400,
                    )
                locked_referral.used_count += 1
                locked_referral.save(update_fields=["used_count"])

            # Stok di-reserve begitu bayar, sama pola-nya kayak checkout_product
            # biasa buat MODULE/BOOTCAMP -- sold_count baru nambah pas admin approve.
            #
            # Lepas dulu reservasi IPAYMU yang sudah lewat 5 menit tanpa dibayar
            # (kalau ada) sebelum ngecek stok -- konsisten sama checkout_product,
            # lihat catatan lengkap di sana (transactions/views.py).
            from transactions.views import _release_expired_transactions, RESERVATION_MINUTES
            _release_expired_transactions(
                Transaction.objects.filter(items__product=bootcamp_product.product)
            )

            detail_locked = BootcampProduct.objects.select_for_update().get(
                product_id=bootcamp_product.product_id
            )
            if detail_locked.stock <= 0:
                return JsonResponse({"detail": "Stok produk habis."}, status=400)
            detail_locked.stock -= 1
            detail_locked.save(update_fields=["stock"])

            txn = Transaction.objects.create(
                user=request.user,
                buyer_phone=request.user.phone or "",
                sub_total=sub_total,
                promo_code=voucher_code or None,
                # Total gabungan kode referral + ajak-teman -- Transaction cuma
                # punya satu field discount_amount. Rincian per sumbernya tetap
                # bisa ditelusuri lewat ReferralCodeUsage & BootcampReferredInvitee
                # yang masing-masing dibuat di bawah.
                discount_amount=discount_amount + invite_discount_amount,
                tax=0,
                grand_total=grand_total,
                payment_status=PaymentStatus.PENDING,
                proof_of_payment=proof_file if payment_gateway == PaymentGateway.MANUAL else None,
                bootcamp_registration=registration,
                commitment_fee_amount=commitment_fee_amount,
                gateway=payment_gateway,
                # MANUAL: None (bukti sudah dilampirkan, tinggal nunggu admin
                # tinjau). IPAYMU: 5 menit -- lihat RESERVATION_MINUTES &
                # catatan di Transaction.expires_at.
                expires_at=(
                    timezone.now() + timedelta(minutes=RESERVATION_MINUTES)
                    if payment_gateway == PaymentGateway.IPAYMU else None
                ),
            )
            TransactionItem.objects.create(
                transaction=txn,
                product=bootcamp_product.product,
                price_at_checkout=grand_total,
                quantity=1,
            )

            if referral_code is not None:
                ReferralCodeUsage.objects.create(
                    referral_code=referral_code,
                    transaction=txn,
                    user=request.user,
                    discount_amount=discount_amount,
                )

            # Baris BootcampReferredInvitee TIDAK dibuat di sini lagi -- sudah
            # dicatat waktu pendaftaran (lihat register_bootcamp). Di tahap
            # bayar tinggal dipakai buat menghitung potongannya saja.
    except Exception:
        # Sama alasannya kayak di transactions.views.checkout_product: pesan
        # exception mentah bocorin struktur DB / konfigurasi storage ke klien.
        logger.exception(
            "Pembayaran bootcamp gagal untuk user %s", getattr(request.user, "id", None)
        )
        return JsonResponse(
            {"detail": "Pembayaran gagal diproses. Coba lagi, atau hubungi tim kami kalau terus berulang."},
            status=500,
        )

    # Cuma buat jalur MANUAL -- pembayaran iPaymu diverifikasi otomatis
    # lewat webhook, notifikasi "tolong verifikasi" di sini gak relevan
    # buat itu (lihat catatan sama di checkout_product).
    if payment_gateway == PaymentGateway.MANUAL:
        notify_team(
            f"Pembayaran bootcamp baru menunggu verifikasi ({txn.id})",
            f"Ada pembayaran pendaftaran bootcamp yang perlu diverifikasi admin.\n\n"
            f"ID Transaksi: {txn.id}\n"
            f"Pembeli: {request.user.fullname} ({request.user.email})\n"
            f"Bootcamp: {bootcamp_product.title}\n"
            f"Paket: {package.name}\n"
            f"Total: Rp {txn.grand_total}\n\n"
            f"Cek & verifikasi di dashboard admin -> Transaksi.",
        )

    return JsonResponse(
        {
            "detail": "Pembayaran berhasil dikirim, menunggu verifikasi admin.",
            "registration": _serialize_registration(registration),
        },
        status=201,
    )


# ---------- Team Pairing ----------

def _serialize_team_member(member):
    user = member.user_library.user
    return {
        "member_id": str(member.id),
        "user_library_id": str(member.user_library_id),
        "user_name": user.fullname,
        "user_email": user.email,
    }


def _serialize_team(team):
    return {
        "id": str(team.id),
        "name": team.name,
        "order": team.order,
        "members": [_serialize_team_member(m) for m in team.members.all()],
    }


def _eligible_team_libraries(bootcamp_product_id):
    return UserLibrary.objects.filter(
        product_id=bootcamp_product_id, package__benefit_team_pairing=True,
    ).select_related("user")


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_teams(request, product_id):
    """Daftar tim + anggotanya, plus daftar peserta berhak Team Pairing
    yang belum masuk tim mana pun."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    teams = (
        BootcampTeam.objects.filter(bootcamp_id=product_id)
        .prefetch_related("members__user_library__user")
        .order_by("order", "created_at")
    )
    assigned_library_ids = set(
        BootcampTeamMember.objects.filter(team__bootcamp_id=product_id)
        .values_list("user_library_id", flat=True)
    )
    unassigned = [
        {"user_library_id": str(lib.id), "user_name": lib.user.fullname, "user_email": lib.user.email}
        for lib in _eligible_team_libraries(product_id)
        if lib.id not in assigned_library_ids
    ]

    return JsonResponse(
        {"teams": [_serialize_team(t) for t in teams], "unassigned": unassigned}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_team(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    next_order = BootcampTeam.objects.filter(bootcamp_id=product_id).count() + 1
    name = (request_data.get("name") or "").strip() or f"Tim {next_order}"
    team = BootcampTeam.objects.create(bootcamp_id=product_id, name=name, order=next_order)

    return JsonResponse(
        {"detail": "Tim berhasil dibuat.", "team": _serialize_team(team)}, status=201
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_team(request, team_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        team = BootcampTeam.objects.get(id=team_id)
    except BootcampTeam.DoesNotExist:
        return JsonResponse({"detail": "Tim tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        team.delete()
        return JsonResponse({"detail": "Tim berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "name" in request_data:
        name = (request_data["name"] or "").strip()
        if not name:
            return JsonResponse({"errors": {"name": ["Nama tim wajib diisi."]}}, status=400)
        team.name = name
        team.save(update_fields=["name"])

    return JsonResponse(
        {"detail": "Tim berhasil diperbarui.", "team": _serialize_team(team)}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def assign_bootcamp_team_member(request, team_id):
    """Masukkin/pindahin satu peserta ke tim ini. user_library OneToOneField
    di model yang jaminan cuma satu tim per peserta -- assign ulang otomatis
    mindah dari tim lama, gak perlu unassign manual dulu."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        team = BootcampTeam.objects.get(id=team_id)
    except BootcampTeam.DoesNotExist:
        return JsonResponse({"detail": "Tim tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        library = UserLibrary.objects.get(id=request_data.get("user_library_id"), product_id=team.bootcamp_id)
    except UserLibrary.DoesNotExist:
        return JsonResponse({"detail": "Peserta tidak ditemukan di bootcamp ini."}, status=404)

    if not (library.package and library.package.benefit_team_pairing):
        return JsonResponse(
            {"detail": "Paket yang diambil peserta ini tidak memiliki benefit Team Pairing."}, status=400
        )

    BootcampTeamMember.objects.update_or_create(user_library=library, defaults={"team": team})

    return JsonResponse(
        {"detail": "Peserta berhasil dimasukkan ke tim.", "team": _serialize_team(team)}, status=200
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def remove_bootcamp_team_member(request, member_id):
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    try:
        member = BootcampTeamMember.objects.get(id=member_id)
    except BootcampTeamMember.DoesNotExist:
        return JsonResponse({"detail": "Anggota tim tidak ditemukan."}, status=404)

    member.delete()
    return JsonResponse({"detail": "Peserta dikeluarkan dari tim."}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def randomize_bootcamp_teams(request, product_id):
    """Reset total: hapus semua tim yang ada di bootcamp ini, bikin
    team_count tim baru, lalu sebar SEMUA peserta yang berhak (paketnya
    punya benefit Team Pairing) secara acak & merata (round-robin setelah
    di-shuffle). Admin masih bisa tweak manual satu-satu sesudahnya lewat
    assign/remove member."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        team_count = int(request_data.get("team_count"))
        if team_count < 1:
            raise ValueError
    except (TypeError, ValueError):
        return JsonResponse({"errors": {"team_count": ["Jumlah tim harus angka >= 1."]}}, status=400)

    eligible = list(_eligible_team_libraries(product_id))
    if not eligible:
        return JsonResponse(
            {"detail": "Belum ada peserta yang berhak Team Pairing di bootcamp ini."}, status=400
        )

    random.shuffle(eligible)

    with db_transaction.atomic():
        BootcampTeam.objects.filter(bootcamp_id=product_id).delete()
        teams = [
            BootcampTeam.objects.create(bootcamp_id=product_id, name=f"Tim {i + 1}", order=i + 1)
            for i in range(team_count)
        ]
        BootcampTeamMember.objects.bulk_create([
            BootcampTeamMember(team=teams[i % team_count], user_library=lib)
            for i, lib in enumerate(eligible)
        ])

    result_teams = (
        BootcampTeam.objects.filter(bootcamp_id=product_id)
        .prefetch_related("members__user_library__user")
        .order_by("order")
    )
    return JsonResponse(
        {
            "detail": f"{len(eligible)} peserta berhasil diacak ke {team_count} tim.",
            "teams": [_serialize_team(t) for t in result_teams],
        },
        status=200,
    )


# ==================== BOOTCAMP: KELOLA TES (MULTI-TES) ====================


def _serialize_quiz(quiz, question_count=None):
    return {
        "id": str(quiz.id),
        "title": quiz.title,
        "timeline_item_id": str(quiz.timeline_item_id) if quiz.timeline_item_id else None,
        "timeline_item_title": quiz.timeline_item.title if quiz.timeline_item_id else None,
        "duration_minutes": quiz.duration_minutes,
        "passing_score_percent": quiz.passing_score_percent,
        "order": quiz.order,
        "is_active": quiz.is_active,
        "question_count": (
            question_count if question_count is not None else quiz.questions.count()
        ),
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_quizzes(request, product_id):
    """Daftar tes sebuah bootcamp (admin). Gak nyertain soal -- soal diambil
    terpisah lewat endpoint per-tes supaya kunci jawaban gak kebawa-bawa."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    quizzes = (
        BootcampQuiz.objects.filter(bootcamp_id=product_id)
        .select_related("timeline_item")
        .order_by("order", "created_at")
    )
    return JsonResponse({"quizzes": [_serialize_quiz(q) for q in quizzes]}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_quiz(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Produk bootcamp tidak ditemukan."}, status=404)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    title = (request_data.get("title") or "").strip()
    if not title:
        return JsonResponse({"errors": {"title": ["Judul tes wajib diisi."]}}, status=400)

    errors = {}
    duration = 30
    if "duration_minutes" in request_data:
        try:
            duration = int(request_data["duration_minutes"])
            if not (5 <= duration <= 180):
                raise ValueError
        except (TypeError, ValueError):
            errors["duration_minutes"] = ["Durasi harus angka 5-180 menit."]

    passing = 70
    if "passing_score_percent" in request_data:
        try:
            passing = int(request_data["passing_score_percent"])
            if not (0 <= passing <= 100):
                raise ValueError
        except (TypeError, ValueError):
            errors["passing_score_percent"] = ["Skor kelulusan harus angka 0-100."]

    timeline_item = None
    if request_data.get("timeline_item_id"):
        try:
            timeline_item = BootcampTimelineItem.objects.get(
                id=request_data["timeline_item_id"], bootcamp_id=bootcamp.pk,
            )
        except (BootcampTimelineItem.DoesNotExist, ValidationError, ValueError):
            errors["timeline_item_id"] = ["Milestone timeline tidak ditemukan."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    next_order = BootcampQuiz.objects.filter(bootcamp=bootcamp).count() + 1
    quiz = BootcampQuiz.objects.create(
        bootcamp=bootcamp, title=title, timeline_item=timeline_item,
        duration_minutes=duration, passing_score_percent=passing, order=next_order,
    )
    log_audit(request, AuditAction.CREATE, "bootcamp_quizzes", object_id=quiz.id)

    return JsonResponse({"detail": "Tes berhasil dibuat.", "quiz": _serialize_quiz(quiz)}, status=201)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_quiz(request, quiz_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        quiz = BootcampQuiz.objects.select_related("timeline_item").get(id=quiz_id)
    except BootcampQuiz.DoesNotExist:
        return JsonResponse({"detail": "Tes tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        # Kalau sudah ada yang ngerjain, hapus tes = hapus jawaban & skor
        # mereka (CASCADE). Ditolak; admin bisa nonaktifin aja.
        attempt_count = BootcampQuizAttempt.objects.filter(quiz=quiz).count()
        if attempt_count:
            return JsonResponse(
                {
                    "detail": (
                        f"Tes ini sudah dikerjakan oleh {attempt_count} peserta sehingga tidak dapat dihapus. "
                        "Silakan nonaktifkan agar tidak tampil bagi peserta; hasil pengerjaan tetap tersimpan."
                    )
                },
                status=400,
            )
        log_audit(request, AuditAction.DELETE, "bootcamp_quizzes", object_id=quiz.id)
        quiz.delete()
        return JsonResponse({"detail": "Tes berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    if "title" in request_data:
        title = (request_data["title"] or "").strip()
        if not title:
            errors["title"] = ["Judul tes wajib diisi."]
        else:
            quiz.title = title
    if "duration_minutes" in request_data:
        try:
            duration = int(request_data["duration_minutes"])
            if not (5 <= duration <= 180):
                raise ValueError
            quiz.duration_minutes = duration
        except (TypeError, ValueError):
            errors["duration_minutes"] = ["Durasi harus angka 5-180 menit."]
    if "passing_score_percent" in request_data:
        try:
            passing = int(request_data["passing_score_percent"])
            if not (0 <= passing <= 100):
                raise ValueError
            quiz.passing_score_percent = passing
        except (TypeError, ValueError):
            errors["passing_score_percent"] = ["Skor kelulusan harus angka 0-100."]
    if "is_active" in request_data:
        quiz.is_active = bool(request_data["is_active"])
    if "timeline_item_id" in request_data:
        raw = request_data["timeline_item_id"]
        if raw in (None, ""):
            quiz.timeline_item = None
        else:
            try:
                quiz.timeline_item = BootcampTimelineItem.objects.get(
                    id=raw, bootcamp_id=quiz.bootcamp_id,
                )
            except (BootcampTimelineItem.DoesNotExist, ValidationError, ValueError):
                errors["timeline_item_id"] = ["Milestone timeline tidak ditemukan."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    quiz.save()
    return JsonResponse({"detail": "Tes berhasil diperbarui.", "quiz": _serialize_quiz(quiz)}, status=200)


# ==================== POPUP PROMO HOMEPAGE ====================


def _promo_product_payload(product):
    """Ringkasan produk buat popup. Judul/gambar diambil dari detail produk
    sesuai tipenya, dan URL tujuan tombol beda-beda: bootcamp punya halaman
    pendaftaran sendiri, produk lain lewat checkout."""
    detail = (
        getattr(product, "bootcamp_detail", None)
        or getattr(product, "mentoring_detail", None)
        or getattr(product, "module_detail", None)
    )
    if detail is None:
        return None

    image = None
    if getattr(detail, "image", None):
        try:
            image = detail.image.url
        except Exception:
            image = None
    if not image:
        image = getattr(detail, "image_url", None)

    target = (
        f"/bootcamp/{product.id}/register"
        if product.type == ProductType.BOOTCAMP
        else f"/checkout/{product.id}"
    )
    return {
        "product_id": str(product.id),
        "type": product.type,
        "title": detail.title,
        "description": detail.description,
        "image_url": image,
        "target_url": target,
        "is_active": detail.is_active,
    }


def get_promo_popup(request):
    """Popup promo buat homepage -- PUBLIK.

    Balikin {"popup": null} kalau lagi gak ada kampanye aktif. Jendela tanggal
    dicek di SERVER (bukan browser) supaya jadwal tayangnya gak bisa diakalin
    dari sisi klien."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    setting = PromoPopupSetting.get_solo()
    if not setting.is_live():
        return JsonResponse({"popup": None}, status=200)

    payload = _promo_product_payload(setting.product)
    # Produk yang dinonaktifkan admin jangan dipromosiin walau setelan popup-nya
    # masih nyala -- percuma ngarahin orang ke halaman yang udah gak jualan.
    if payload is None or not payload["is_active"]:
        return JsonResponse({"popup": None}, status=200)

    if setting.headline:
        payload["title"] = setting.headline
    payload["cta_label"] = setting.cta_label or "Daftar Sekarang"
    return JsonResponse({"popup": payload}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def admin_promo_popup(request):
    """GET/PATCH setelan popup promo (admin)."""
    if request.method not in ("GET", "PATCH", "PUT"):
        return HttpResponseNotAllowed(["GET", "PATCH", "PUT"])

    setting = PromoPopupSetting.get_solo()

    def serialize():
        return {
            "product_id": str(setting.product_id) if setting.product_id else None,
            "is_active": setting.is_active,
            "starts_at": setting.starts_at.isoformat() if setting.starts_at else None,
            "ends_at": setting.ends_at.isoformat() if setting.ends_at else None,
            "headline": setting.headline,
            "cta_label": setting.cta_label,
            "is_live_now": setting.is_live(),
        }

    if request.method == "GET":
        return JsonResponse(serialize(), status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    if "product_id" in request_data:
        raw = request_data["product_id"]
        if raw in (None, ""):
            setting.product = None
        else:
            try:
                setting.product = Product.objects.get(id=raw)
            except (Product.DoesNotExist, ValidationError, ValueError):
                errors["product_id"] = ["Produk tidak ditemukan."]

    if "is_active" in request_data:
        setting.is_active = bool(request_data["is_active"])
    if "starts_at" in request_data:
        setting.starts_at = _parse_wib_datetime_or_none(request_data["starts_at"])
    if "ends_at" in request_data:
        setting.ends_at = _parse_wib_datetime_or_none(request_data["ends_at"])
    if "headline" in request_data:
        setting.headline = (request_data["headline"] or "").strip()[:150]
    if "cta_label" in request_data:
        setting.cta_label = (request_data["cta_label"] or "").strip()[:60] or "Daftar Sekarang"

    # Rentang kebalik itu bikin popup diam-diam gak pernah tayang -- lebih baik
    # ditolak terang-terangan daripada admin bingung nyari kenapa gak muncul.
    if (
        not errors
        and setting.starts_at and setting.ends_at
        and setting.ends_at <= setting.starts_at
    ):
        errors["ends_at"] = ["Tanggal selesai harus setelah tanggal mulai."]

    if setting.is_active and not setting.product_id and "product_id" not in errors:
        errors["product_id"] = ["Silakan pilih produk terlebih dahulu sebelum mengaktifkan popup."]

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    setting.save()
    log_audit(request, AuditAction.UPDATE, "promo_popup_setting", object_id=None)
    return JsonResponse({"detail": "Setelan popup disimpan.", **serialize()}, status=200)


# ---------- Akun Zoom (kolam akun buat otomatisasi link mentoring) ----------
#
# Kredensial disimpan di DB (bukan .env) supaya akun bisa dirotasi dari panel
# tanpa redeploy. Karena itu client_secret dienkripsi, dan endpoint di bawah
# TIDAK PERNAH mengembalikannya utuh -- cuma 4 karakter terakhir buat pengenal.


def _serialize_zoom_account(acc, sesi_mendatang=0):
    """Bentuk aman buat frontend. client_secret sengaja tidak ikut."""
    ekor = ""
    try:
        from mark_up.zoom import decrypt_secret

        rahasia = decrypt_secret(acc.client_secret_encrypted)
        ekor = rahasia[-4:] if len(rahasia) >= 4 else "****"
    except Exception:
        # Gagal dekripsi (mis. ZOOM_CRED_KEY berubah) bukan alasan bikin daftar
        # akun error total -- tandai saja supaya admin tahu harus simpan ulang.
        ekor = "?"

    return {
        "id": str(acc.id),
        "label": acc.label,
        "account_id": acc.account_id,
        "client_id": acc.client_id,
        "client_secret_hint": f"****{ekor}",
        "is_active": acc.is_active,
        "auto_record": acc.auto_record,
        "last_check_at": acc.last_check_at.isoformat() if acc.last_check_at else None,
        "last_check_ok": acc.last_check_ok,
        "last_check_note": acc.last_check_note,
        "upcoming_sessions": sesi_mendatang,
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_zoom_accounts(request):
    """Daftar akun Zoom + berapa sesi mendatang yang bergantung ke tiap akun.

    Angka 'sesi mendatang' itu penting: sebelum menonaktifkan sebuah akun,
    admin perlu tahu masih ada berapa sesi yang link-nya di-host akun tersebut.
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    sekarang = timezone.now()
    pemakaian = {
        row["zoom_account"]: row["n"]
        for row in MentoringSession.objects.filter(
            zoom_account__isnull=False, start_time__gte=sekarang,
        ).values("zoom_account").annotate(n=models.Count("id"))
    }

    akun = ZoomAccount.objects.all()
    return JsonResponse(
        {
            "accounts": [
                _serialize_zoom_account(a, pemakaian.get(a.id, 0)) for a in akun
            ],
            "key_ready": bool(getattr(settings, "ZOOM_CRED_KEY", "")),
            "lead_hours": getattr(settings, "ZOOM_GENERATE_LEAD_HOURS", 24),
        },
        status=200,
    )


def _simpan_kredensial(acc, request_data, errors, wajib_secret):
    """Isi field akun dari payload. Secret bersifat write-only: kosong = biarkan."""
    if "label" in request_data or wajib_secret:
        label = (request_data.get("label") or "").strip()
        if not label:
            errors["label"] = ["Label akun wajib diisi."]
        else:
            acc.label = label[:120]

    for field in ("account_id", "client_id"):
        if field in request_data or wajib_secret:
            nilai = (request_data.get(field) or "").strip()
            if not nilai:
                errors[field] = ["Wajib diisi."]
            else:
                setattr(acc, field, nilai[:120])

    secret = (request_data.get("client_secret") or "").strip()
    if secret:
        from mark_up.zoom import ZoomCredentialError, encrypt_secret

        try:
            acc.client_secret_encrypted = encrypt_secret(secret)
        except ZoomCredentialError as exc:
            errors["client_secret"] = [str(exc)]
    elif wajib_secret:
        errors["client_secret"] = ["Client secret wajib diisi."]

    if "is_active" in request_data:
        acc.is_active = bool(request_data["is_active"])
    if "auto_record" in request_data:
        acc.auto_record = bool(request_data["auto_record"])


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_zoom_account(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    acc = ZoomAccount()
    errors = {}
    _simpan_kredensial(acc, request_data, errors, wajib_secret=True)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    acc.save()
    log_audit(request, AuditAction.CREATE, "zoom_account", object_id=acc.id)
    return JsonResponse(
        {"detail": "Akun Zoom ditambahkan.", "account": _serialize_zoom_account(acc)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def zoom_account_detail(request, account_id):
    try:
        acc = ZoomAccount.objects.get(id=account_id)
    except ZoomAccount.DoesNotExist:
        return JsonResponse({"detail": "Akun Zoom tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        # Sesi yang pernah pakai akun ini tetap aman (FK-nya SET_NULL), tapi
        # link meeting-nya bakal mati begitu akunnya dicabut dari Zoom.
        terpakai = MentoringSession.objects.filter(
            zoom_account=acc, start_time__gte=timezone.now()
        ).count()
        if terpakai:
            return JsonResponse(
                {
                    "detail": (
                        f"Akun ini masih dipakai {terpakai} sesi mendatang, jadi tidak "
                        "dapat dihapus. Nonaktifkan saja supaya tidak dipilih untuk "
                        "meeting baru, sementara sesi yang sudah terjadwal tetap aman."
                    )
                },
                status=400,
            )
        acc.delete()
        log_audit(request, AuditAction.DELETE, "zoom_account", object_id=account_id)
        return JsonResponse({"detail": "Akun Zoom dihapus."}, status=200)

    if request.method not in ("PATCH", "PUT"):
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    errors = {}
    _simpan_kredensial(acc, request_data, errors, wajib_secret=False)
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    acc.save()
    log_audit(request, AuditAction.UPDATE, "zoom_account", object_id=acc.id)
    return JsonResponse(
        {"detail": "Akun Zoom diperbarui.", "account": _serialize_zoom_account(acc)},
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def test_zoom_account(request, account_id):
    """Uji kredensial ke Zoom & lihat apakah akunnya sedang dipakai meeting live."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    # Endpoint ini memanggil pihak ketiga dari dalam request. Dibatasi supaya
    # tombol yang diklik berkali-kali gak menahan banyak worker sekaligus.
    if is_rate_limited(f"rl:zoomtest:{request.user.id}", limit=20, window_seconds=300):
        return JsonResponse(
            {"detail": "Terlalu sering menguji koneksi. Coba lagi beberapa menit lagi."},
            status=429,
        )

    try:
        acc = ZoomAccount.objects.get(id=account_id)
    except ZoomAccount.DoesNotExist:
        return JsonResponse({"detail": "Akun Zoom tidak ditemukan."}, status=404)

    from mark_up.zoom import check_account

    hasil = check_account(acc)
    acc.last_check_at = timezone.now()
    acc.last_check_ok = bool(hasil.get("ok"))
    acc.last_check_note = (hasil.get("pesan") or "")[:500]
    acc.save(update_fields=["last_check_at", "last_check_ok", "last_check_note"])

    return JsonResponse({"result": hasil, "account": _serialize_zoom_account(acc)}, status=200)


# ---------- Pertanyaan pendaftaran & pengaturan formulir (admin) ----------

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def bootcamp_registration_settings(request, product_id):
    """Saklar isian pendaftaran + template email hasil seleksi.

    Digabung dalam satu endpoint karena keduanya diatur di panel yang sama dan
    selalu dilihat bersamaan: "apa yang harus diisi pendaftar" dan "apa yang
    dia terima setelah diputuskan".
    """
    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Bootcamp tidak ditemukan."}, status=404)

    if request.method == "GET":
        return JsonResponse({"settings": _serialize_registration_settings(bootcamp)}, status=200)

    if request.method not in ("PATCH", "PUT"):
        return HttpResponseNotAllowed(["GET", "PATCH", "PUT"])

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    diubah = []
    for kunci in (
        "require_commitment_letter",
        "enable_registration_questions",
    ):
        if kunci in data:
            setattr(bootcamp, kunci, bool(data[kunci]))
            diubah.append(kunci)

    for kunci in (
        "email_accepted_subject",
        "email_accepted_body",
        "email_rejected_subject",
        "email_rejected_body",
    ):
        if kunci in data:
            setattr(bootcamp, kunci, (data[kunci] or "").strip())
            diubah.append(kunci)

    if diubah:
        bootcamp.save(update_fields=diubah)

    return JsonResponse(
        {"detail": "Pengaturan pendaftaran diperbarui.",
         "settings": _serialize_registration_settings(bootcamp)},
        status=200,
    )


def _serialize_registration_settings(bootcamp):
    return {
        "require_commitment_letter": bootcamp.require_commitment_letter,
        "enable_registration_questions": bootcamp.enable_registration_questions,
        "commitment_letter_max_words": bootcamp.commitment_letter_max_words,
        "email_accepted_subject": bootcamp.email_accepted_subject,
        "email_accepted_body": bootcamp.email_accepted_body,
        "email_rejected_subject": bootcamp.email_rejected_subject,
        "email_rejected_body": bootcamp.email_rejected_body,
        "questions": [
            _serialize_registration_question(q)
            for q in bootcamp.registration_questions.all().order_by("order", "id")
        ],
    }


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_question(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        bootcamp = BootcampProduct.objects.get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Bootcamp tidak ditemukan."}, status=404)

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    teks = (data.get("text") or "").strip()
    if not teks:
        return JsonResponse({"errors": {"text": ["Pertanyaan tidak boleh kosong."]}}, status=400)

    try:
        max_words = int(data.get("max_words") or 0)
        if max_words < 0:
            raise ValueError
    except (TypeError, ValueError):
        return JsonResponse({"errors": {"max_words": ["Harus angka 0 atau lebih."]}}, status=400)

    terakhir = bootcamp.registration_questions.order_by("-order").first()
    q = BootcampRegistrationQuestion.objects.create(
        bootcamp=bootcamp,
        text=teks,
        helper_text=(data.get("helper_text") or "").strip(),
        is_required=bool(data.get("is_required", True)),
        max_words=max_words,
        order=(terakhir.order + 1) if terakhir else 1,
        for_all_packages=bool(data.get("for_all_packages", True)),
    )
    _pasang_paket_pertanyaan(q, bootcamp, data.get("package_ids"))
    return JsonResponse({"question": _serialize_registration_question(q)}, status=201)


def _pasang_paket_pertanyaan(q, bootcamp, package_ids):
    """Set daftar paket sebuah pertanyaan.

    Paket dari bootcamp LAIN diabaikan diam-diam, bukan diterima: menautkan
    pertanyaan ke paket milik batch lain tidak punya arti dan cuma bikin data
    yang membingungkan di kemudian hari.
    """
    if package_ids is None:
        return
    if q.for_all_packages:
        q.packages.clear()
        return
    sah = BootcampPackage.objects.filter(
        id__in=[str(x) for x in package_ids if x], bootcamp=bootcamp
    )
    q.packages.set(list(sah))


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def bootcamp_question_detail(request, question_id):
    """Ubah / hapus satu pertanyaan.

    Menghapus pertanyaan TIDAK menghapus jawaban yang sudah masuk: relasinya
    SET_NULL dan teks pertanyaannya sudah disalin ke jawaban, jadi jawaban lama
    tetap terbaca utuh. Untuk sekadar menyembunyikan dari formulir, cukup
    matikan is_active.
    """
    try:
        q = BootcampRegistrationQuestion.objects.get(id=question_id)
    except BootcampRegistrationQuestion.DoesNotExist:
        return JsonResponse({"detail": "Pertanyaan tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        q.delete()
        return JsonResponse({"detail": "Pertanyaan dihapus."}, status=200)

    if request.method not in ("PATCH", "PUT"):
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    data = get_request_data(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    diubah = []
    if "text" in data:
        teks = (data["text"] or "").strip()
        if not teks:
            return JsonResponse({"errors": {"text": ["Pertanyaan tidak boleh kosong."]}}, status=400)
        q.text = teks
        diubah.append("text")
    if "helper_text" in data:
        q.helper_text = (data["helper_text"] or "").strip()
        diubah.append("helper_text")
    if "is_required" in data:
        q.is_required = bool(data["is_required"])
        diubah.append("is_required")
    if "is_active" in data:
        q.is_active = bool(data["is_active"])
        diubah.append("is_active")
    if "order" in data:
        try:
            q.order = max(0, int(data["order"]))
            diubah.append("order")
        except (TypeError, ValueError):
            return JsonResponse({"errors": {"order": ["Harus angka."]}}, status=400)
    if "max_words" in data:
        try:
            nilai = int(data["max_words"] or 0)
            if nilai < 0:
                raise ValueError
            q.max_words = nilai
            diubah.append("max_words")
        except (TypeError, ValueError):
            return JsonResponse({"errors": {"max_words": ["Harus angka 0 atau lebih."]}}, status=400)

    if "for_all_packages" in data:
        q.for_all_packages = bool(data["for_all_packages"])
        diubah.append("for_all_packages")

    if diubah:
        q.save(update_fields=diubah)

    if "package_ids" in data or "for_all_packages" in data:
        _pasang_paket_pertanyaan(q, q.bootcamp, data.get("package_ids", []))

    return JsonResponse({"question": _serialize_registration_question(q)}, status=200)
