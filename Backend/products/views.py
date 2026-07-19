from django.core.paginator import Paginator, EmptyPage
from decimal import Decimal
from datetime import timedelta
from zoneinfo import ZoneInfo

from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone

from .utils import get_request_data
from .forms import MentoringProductForm, ModuleProductForm, BootcampProductForm
from .models import (
    BootcampSession,
    Certificate,
    CertificateType,
    MentoringSession,
    Product,
    ProductType,
    RefundRequest,
    Review,
    UserLibrary,
)
from accounts.decorators import jwt_required, role_required
from accounts.models import User, UserRole, AuditAction
from accounts.utils import log_audit
from django.db.models import Q
from mentors.models import MentorAvailability
from django.views.decorators.csrf import csrf_exempt

DETAIL_FORM_MAP = {
    ProductType.MENTORING: (MentoringProductForm, "mentoring_detail"),
    ProductType.MODULE: (ModuleProductForm, "module_detail"),
    ProductType.BOOTCAMP: (BootcampProductForm, "bootcamp_detail"),
}


def _get_detail_form_class(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[0]


def _get_detail_attr(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[1]


def _format_product_response(product, detail):
    response = {
        "id": str(product.id),
        "type": product.type,
        "title": detail.title,
        "description": detail.description,
        "original_price": str(detail.original_price) if detail.original_price else None,
        "discount_percent": detail.discount_percent,
        "sold_count": detail.sold_count,
        "image_url": detail.image_url,
        "registration_link": detail.registration_link,
        "is_active": detail.is_active,
    }

    if getattr(detail, "file_pdf_url", None) is not None:
        response["file_pdf_url"] = detail.file_pdf_url

    if getattr(detail, "stock", None) is not None:
        response["stock"] = detail.stock

    return response


def _get_product_detail(product):
    if product.type == ProductType.MENTORING:
        return getattr(product, "mentoring_detail", None)
    if product.type == ProductType.MODULE:
        return getattr(product, "module_detail", None)
    if product.type == ProductType.BOOTCAMP:
        return getattr(product, "bootcamp_detail", None)
    return None


def _get_session_progress(sessions):
    total_sessions = len(sessions)
    completed_sessions = sum(1 for session in sessions if session.status == session.SessionStatus.COMPLETED)
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
            "image_url": detail.image_url,
            "original_price": str(detail.original_price) if detail.original_price is not None else None,
            "new_price": str(detail.new_price) if detail.new_price is not None else None,
            "discount_percent": detail.discount_percent,
            "sold_count": detail.sold_count,
            "registration_link": detail.registration_link,
            "is_active": detail.is_active,
        })
        if hasattr(detail, "file_pdf_url"):
            item["file_pdf_url"] = detail.file_pdf_url
            item["stock"] = detail.stock
        if p.type == ProductType.MENTORING:
            item["session_count"] = detail.session_count
            item["duration_minutes"] = detail.duration_minutes
            item["highlights"] = list(
                detail.highlights.order_by("order").values_list("text", flat=True)
            )

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
    mentor = session.mentor
    return {
        "id": str(session.id),
        "order": session.order,
        "title": session.title,
        "mentor": mentor.user.fullname if mentor else None,
        "mentor_id": str(mentor.id) if mentor else None,
        "start_time": session.start_time.isoformat() if session.start_time else None,
        "status": session.status,
        "meeting_link": session.meeting_link,
        "recording_url": session.recording_url,
    }


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
            "bootcamp_sessions__mentor__user",
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
        sessions = list(user_library.bootcamp_sessions.select_related("mentor__user").all())
        return JsonResponse(
            {
                "type": "bootcamp",
                "title": detail.title,
                "description": detail.description,
                "sessions": [_serialize_bootcamp_session(session) for session in sessions],
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
                "file_url": detail.file_pdf_url,
                "resources": [],  # TODO: backend belum menyediakan model resource terpisah
                "chapters": [],  # TODO: backend belum menyediakan chapters
            },
            status=200,
        )

    return JsonResponse({"detail": "Jenis produk tidak didukung."}, status=400)


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

    now = timezone.now()
    cutoff = now + timedelta(hours=3)
    if session.status == MentoringSession.SessionStatus.SCHEDULED:
        if session.start_time and session.start_time <= cutoff:
            return JsonResponse({"detail": "Reschedule tidak boleh dalam waktu 3 jam sebelum sesi."}, status=400)
        if session.availability_slot and session.availability_slot != slot:
            old_slot = session.availability_slot
            old_slot.is_booked = False
            old_slot.save()

    slot.is_booked = True
    slot.save()

    session.availability_slot = slot
    session.start_time = slot.start_time
    session.status = MentoringSession.SessionStatus.SCHEDULED
    session.save()

    return JsonResponse(_serialize_mentoring_session(session), status=200)


@jwt_required
def refund_my_product(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

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
    detail.save()

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

    fetch_all = request.GET.get("all") == "true"
    # Storefront publik cuma boleh liat produk aktif; admin (list manajemen
    # produk) butuh liat SEMUA produk termasuk yang di-nonaktifkan, jadi bisa
    # dikelola/diaktifkan lagi -- tanpa flag ini produk nonaktif hilang total
    # dari tabel admin begitu di-nonaktifkan.
    include_inactive = request.GET.get("include_inactive") == "true"

    base_qs = Product.objects.select_related(
		"mentoring_detail", "module_detail", "bootcamp_detail"
	).prefetch_related(
		"mentoring_detail__highlights"
	).order_by("-created_at")

    if fetch_all or include_inactive:
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
            session.availability_slot.is_booked = False
            session.availability_slot.save()

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
	detail = detail_form.save()

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
    if not file:
        errors["file"] = ["File PDF wajib diunggah."]
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
        session.zoom_link = request_data["zoom_link"]

    if request_data.get("status") == "completed" and session.status != "completed":
        session.status = MentoringSession.SessionStatus.COMPLETED

        from transactions.models import MentorPayout, PayoutSourceType

        if session.mentor_id and not hasattr(session, "payout"):
            gross = session.mentoring.new_price or session.mentoring.original_price or 0
            session_count = session.mentoring.session_count or 1
            MentorPayout.objects.create(
                mentor_profile=session.mentor,
                source_type=PayoutSourceType.MENTORING,
                mentoring_session=session,
                gross_amount=(gross / session_count),
            )

    session.save()

    log_audit(request, AuditAction.UPDATE, "mentoring_sessions", object_id=session.id)

    return JsonResponse({"detail": "Sesi berhasil diperbarui."}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_all_reviews(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    reviews = Review.objects.select_related(
        "user", "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail"
    ).order_by("-created_at")

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
