import json

from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole

from .models import (
    MentorProfile,
    MentorAvailability,
    MentorExperience,
    MentorExpertise,
    Expertise,
)
from .forms import MentorAvailabilityForm, MentorProfileForm, MentorExperienceForm
from .utils import get_request_data


def _serialize_mentor_slot(availability):
    local_dt = timezone.localtime(availability.start_time)
    return {
        "id": str(availability.id),
        "date": local_dt.strftime("%d %b %Y"),
        "time": local_dt.strftime("%H:%M"),
    }


def _serialize_mentor_experience(experience):
    return {
        "title": experience.title,
        "start_date": experience.start_date.isoformat(),
        "end_date": experience.end_date.isoformat() if experience.end_date else None,
    }


def _serialize_mentor(mentor, request):
    upcoming_slots = mentor.mentor_availabilities.filter(
        is_booked=False,
        start_time__gt=timezone.now(),
    ).order_by("start_time")[:10]

    photo = None
    if mentor.user.profile_image:
        photo = request.build_absolute_uri(mentor.user.profile_image.url)

    return {
        "id": str(mentor.id),
        "name": mentor.user.fullname,
        "headline": mentor.headline,
        "bio": mentor.bio,
        "photo": photo,
        "linkedin": mentor.linkedin_url,
        "instagram": mentor.instagram_url,
        "rating": float(mentor.rating),
        "review_count": mentor.review_count,
        "expertise": list(
            mentor.mentor_expertises.values_list("expertise__name", flat=True)
        ),
        "experience": [
            _serialize_mentor_experience(exp)
            for exp in mentor.mentor_experiences.all()
        ],
        "slots": [_serialize_mentor_slot(slot) for slot in upcoming_slots],
    }


def get_mentors(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    mentors = (
        MentorProfile.objects.select_related("user")
        .prefetch_related(
            "mentor_expertises__expertise",
            "mentor_experiences",
            "mentor_availabilities",
        )
        .order_by("-rating")
    )

    # ?product_id= dipakai widget pilih-mentor di checkout -- cuma tampilin
    # mentor yang keahliannya overlap sama kategori produk mentoring itu.
    # Kalau produknya belum ditandain kategori sama sekali (belum di-setting
    # admin), jangan dibatasi dulu -- daripada checkout-nya malah kosong.
    product_id = request.GET.get("product_id")
    if product_id:
        from products.models import MentoringProduct

        try:
            product = MentoringProduct.objects.prefetch_related("expertise").get(
                product_id=product_id
            )
        except MentoringProduct.DoesNotExist:
            product = None

        if product is not None:
            expertise_ids = list(product.expertise.values_list("id", flat=True))
            if expertise_ids:
                mentors = mentors.filter(
                    mentor_expertises__expertise_id__in=expertise_ids
                ).distinct()

    # Mentor yang profilnya belum lengkap (lihat MentorProfile.is_profile_complete)
    # nggak ditampilin publik -- masih nyembunyiin diri sampai data wajibnya keisi.
    data = [
        _serialize_mentor(mentor, request)
        for mentor in mentors
        if mentor.is_profile_complete()
    ]
    return JsonResponse({"mentors": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def add_availability(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    try:
        mentor_profile = request.user.mentor_profile
    except MentorProfile.DoesNotExist:
        return JsonResponse({"detail": "Mentor profile tidak ditemukan."}, status=404)

    form = MentorAvailabilityForm(get_request_data(request))

    if not form.is_valid():
        errors = {k: list(v) for k, v in form.errors.items()}
        non_field = form.non_field_errors()
        if non_field:
            errors["non_field_errors"] = list(non_field)
        return JsonResponse({"errors": errors}, status=400)

    availability = form.save(commit=False)
    availability.mentor_profile = mentor_profile
    availability.save()

    return JsonResponse(
        {
            "detail": "Availability berhasil ditambahkan.",
            "availability": {
                "id": str(availability.id),
                "start_time": availability.start_time.isoformat(),
                "end_time": availability.end_time.isoformat(),
                "is_booked": availability.is_booked,
            },
        },
        status=201,
    )


def _get_mentor_profile_or_404(request):
    try:
        return request.user.mentor_profile, None
    except MentorProfile.DoesNotExist:
        return None, JsonResponse({"detail": "Mentor profile tidak ditemukan."}, status=404)


@jwt_required
@role_required(UserRole.MENTOR)
def get_my_availability(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    slots = mentor_profile.mentor_availabilities.order_by("start_time")

    data = []
    for slot in slots:
        local_start = timezone.localtime(slot.start_time)
        local_end = timezone.localtime(slot.end_time)
        mentee_name = None
        is_pending_payment = False
        if slot.is_booked:
            session = slot.product_mentoring_sessions.select_related(
                "user_library__user"
            ).first()
            if session:
                mentee_name = session.user_library.user.fullname
            else:
                # Slot udah di-reserve pas checkout tapi transaksinya masih
                # nunggu diverifikasi admin -- sesi & nama mentee-nya baru
                # muncul begitu pembayaran di-approve.
                is_pending_payment = True

        data.append(
            {
                "id": str(slot.id),
                "start_time": local_start.isoformat(),
                "end_time": local_end.isoformat(),
                "is_booked": slot.is_booked,
                "mentee_name": mentee_name,
                "is_pending_payment": is_pending_payment,
            }
        )

    return JsonResponse({"availability": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def delete_my_availability(request, availability_id):
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    try:
        slot = mentor_profile.mentor_availabilities.get(id=availability_id)
    except MentorAvailability.DoesNotExist:
        return JsonResponse({"detail": "Slot tidak ditemukan."}, status=404)

    if slot.is_booked:
        return JsonResponse(
            {"detail": "Slot yang sudah dibooking tidak bisa dihapus."}, status=400
        )

    slot.delete()
    return JsonResponse({"detail": "Slot berhasil dihapus."}, status=200)


def get_mentor_availability(request, mentor_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        mentor = MentorProfile.objects.select_related("user").get(id=mentor_id)
    except MentorProfile.DoesNotExist:
        return JsonResponse({"detail": "Mentor profile tidak ditemukan."}, status=404)

    slots = MentorAvailability.objects.filter(
        mentor_profile=mentor,
        is_booked=False,
    ).order_by("start_time")

    day_names = {
        "Monday": "Senin",
        "Tuesday": "Selasa",
        "Wednesday": "Rabu",
        "Thursday": "Kamis",
        "Friday": "Jumat",
        "Saturday": "Sabtu",
        "Sunday": "Minggu",
    }
    month_names = {
        1: "Januari", 2: "Februari", 3: "Maret", 4: "April",
        5: "Mei", 6: "Juni", 7: "Juli", 8: "Agustus",
        9: "September", 10: "Oktober", 11: "November", 12: "Desember",
    }

    data = []
    for slot in slots:
        local_dt = timezone.localtime(slot.start_time, timezone=timezone.get_fixed_timezone(7 * 60))
        date_label = f"{day_names.get(local_dt.strftime('%A'), local_dt.strftime('%A'))}, {local_dt.day} {month_names[local_dt.month]} {local_dt.year}"
        time_label = f"{local_dt.strftime('%H:%M')} WIB"
        data.append({
            "id": str(slot.id),
            "date": date_label,
            "time": time_label,
        })

    return JsonResponse({"availability": data}, status=200)


def _serialize_experience(experience):
    return {
        "id": str(experience.id),
        "title": experience.title,
        "description": experience.description,
        "start_date": experience.start_date.isoformat(),
        "end_date": experience.end_date.isoformat() if experience.end_date else None,
    }


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def my_profile_view(request):
    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    user = request.user

    if request.method == "GET":
        return JsonResponse(
            {
                "fullname": user.fullname,
                "phone": user.phone or "",
                "headline": mentor_profile.headline or "",
                "bio": mentor_profile.bio or "",
                "bank_name": mentor_profile.bank_name,
                "bank_account": mentor_profile.bank_account,
                "bank_account_holder": mentor_profile.bank_account_holder,
                "linkedin_url": mentor_profile.linkedin_url,
                "instagram_url": mentor_profile.instagram_url or "",
                "expertise": list(
                    mentor_profile.mentor_expertises.values_list("expertise_id", flat=True)
                ),
                "experiences": [
                    _serialize_experience(exp)
                    for exp in mentor_profile.mentor_experiences.all()
                ],
            },
            status=200,
        )

    if request.method in ("PATCH", "POST"):
        request_data = get_request_data(request)
        if request_data is None:
            return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

        if "fullname" in request_data:
            user.fullname = request_data["fullname"]
        if "phone" in request_data:
            user.phone = request_data["phone"]
        user.save()

        # FE nyimpen per-section (Info Pribadi / Rekening Bank kirim field
        # yang beda-beda), jadi field yang nggak dikirim di-fallback ke nilai
        # instance yang sekarang biar ModelForm nggak nganggep itu "kosong".
        profile_fields = [
            "headline", "bio", "bank_name", "bank_account",
            "bank_account_holder", "linkedin_url", "instagram_url",
        ]
        form_data = {
            field: request_data.get(field, getattr(mentor_profile, field))
            for field in profile_fields
        }

        form = MentorProfileForm(form_data, instance=mentor_profile)
        if not form.is_valid():
            errors = {k: list(v) for k, v in form.errors.items()}
            return JsonResponse({"errors": errors}, status=400)
        form.save()

        return JsonResponse({"detail": "Profil berhasil diperbarui."}, status=200)

    return HttpResponseNotAllowed(["GET", "PATCH", "POST"])


def get_expertise_catalog(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    data = [
        {"id": str(e.id), "name": e.name}
        for e in Expertise.objects.order_by("name")
    ]
    return JsonResponse({"expertise": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def update_my_expertise(request):
    if request.method != "PUT":
        return HttpResponseNotAllowed(["PUT"])

    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    expertise_ids = request_data.get("expertise_ids") or []
    if not isinstance(expertise_ids, list) or len(expertise_ids) == 0:
        return JsonResponse({"detail": "Minimal 1 keahlian harus dipilih."}, status=400)

    valid_ids = set(
        Expertise.objects.filter(id__in=expertise_ids).values_list("id", flat=True)
    )

    MentorExpertise.objects.filter(mentor_profile=mentor_profile).exclude(
        expertise_id__in=valid_ids
    ).delete()
    existing_ids = set(
        MentorExpertise.objects.filter(mentor_profile=mentor_profile).values_list(
            "expertise_id", flat=True
        )
    )
    MentorExpertise.objects.bulk_create(
        [
            MentorExpertise(mentor_profile=mentor_profile, expertise_id=expertise_id)
            for expertise_id in valid_ids - existing_ids
        ]
    )

    return JsonResponse({"detail": "Keahlian berhasil diperbarui."}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def my_experiences_view(request):
    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    if request.method == "GET":
        experiences = mentor_profile.mentor_experiences.order_by("-start_date")
        return JsonResponse(
            {"experiences": [_serialize_experience(exp) for exp in experiences]},
            status=200,
        )

    if request.method == "POST":
        request_data = get_request_data(request)
        if request_data is None:
            return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

        form = MentorExperienceForm(request_data)
        if not form.is_valid():
            errors = {k: list(v) for k, v in form.errors.items()}
            return JsonResponse({"errors": errors}, status=400)

        experience = form.save(commit=False)
        experience.mentor_profile = mentor_profile
        experience.save()

        return JsonResponse(_serialize_experience(experience), status=201)

    return HttpResponseNotAllowed(["GET", "POST"])


@csrf_exempt
@jwt_required
@role_required(UserRole.MENTOR)
def my_experience_detail_view(request, experience_id):
    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    try:
        experience = mentor_profile.mentor_experiences.get(id=experience_id)
    except MentorExperience.DoesNotExist:
        return JsonResponse({"detail": "Pengalaman tidak ditemukan."}, status=404)

    if request.method in ("PATCH", "PUT"):
        request_data = get_request_data(request)
        if request_data is None:
            return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

        form = MentorExperienceForm(request_data, instance=experience)
        if not form.is_valid():
            errors = {k: list(v) for k, v in form.errors.items()}
            return JsonResponse({"errors": errors}, status=400)
        form.save()

        return JsonResponse(_serialize_experience(experience), status=200)

    if request.method == "DELETE":
        experience.delete()
        return JsonResponse({"detail": "Pengalaman berhasil dihapus."}, status=200)

    return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])


@jwt_required
@role_required(UserRole.MENTOR)
def get_my_sessions(request):
    """Active Classes: gabungan sesi mentoring privat & bootcamp yang
    diajar oleh mentor yang login."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from products.models import MentoringSession, BootcampSession

    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    mentoring_sessions = (
        MentoringSession.objects.filter(mentor=mentor_profile, user_library__is_revoked=False)
        .select_related("mentoring", "mentoring__product", "user_library__user")
        .order_by("user_library_id", "order")
    )
    bootcamp_sessions = (
        BootcampSession.objects.filter(mentors=mentor_profile, user_library__is_revoked=False)
        .select_related("bootcamp", "bootcamp__product", "user_library__user")
        .order_by("user_library_id", "order")
    )

    mentoring_data = [
        {
            "id": str(s.id),
            "user_library_id": str(s.user_library_id),
            "order": s.order,
            "title": s.mentoring.title,
            "mentee_name": s.user_library.user.fullname,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "status": s.status,
            "zoom_link": s.zoom_link,
            "recording_url": s.recording_url,
        }
        for s in mentoring_sessions
    ]
    bootcamp_data = [
        {
            "id": str(s.id),
            "user_library_id": str(s.user_library_id),
            "order": s.order,
            "title": s.title,
            "bootcamp_title": s.bootcamp.title,
            "mentee_name": s.user_library.user.fullname,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "status": s.status,
            "meeting_link": s.meeting_link,
            "recording_url": s.recording_url,
        }
        for s in bootcamp_sessions
    ]

    return JsonResponse(
        {"mentoring": mentoring_data, "bootcamp": bootcamp_data}, status=200
    )


@jwt_required
@role_required(UserRole.MENTOR)
def get_my_reviews(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from products.models import MentoringSession, BootcampSession, Review

    mentor_profile, error = _get_mentor_profile_or_404(request)
    if error:
        return error

    product_ids = set(
        MentoringSession.objects.filter(mentor=mentor_profile).values_list(
            "mentoring__product_id", flat=True
        )
    ) | set(
        BootcampSession.objects.filter(mentors=mentor_profile).values_list(
            "bootcamp__product_id", flat=True
        )
    )

    reviews = (
        Review.objects.filter(product_id__in=product_ids, is_hidden=False)
        .select_related("user", "product")
        .order_by("-created_at")
    )

    data = []
    for review in reviews:
        detail = getattr(review.product, "mentoring_detail", None) or getattr(
            review.product, "bootcamp_detail", None
        )
        data.append(
            {
                "id": str(review.id),
                "reviewer_name": review.user.fullname,
                "product_title": detail.title if detail else None,
                "rating": float(review.rating),
                "review_text": review.review_text,
                "created_at": review.created_at.isoformat(),
            }
        )

    return JsonResponse({"reviews": data}, status=200)

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def create_expertise(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    name = (request_data.get("name") or "").strip()
    if not name:
        return JsonResponse({"detail": "Nama keahlian diperlukan."}, status=400)

    if Expertise.objects.filter(name__iexact=name).exists():
        return JsonResponse({"detail": "Keahlian dengan nama ini sudah ada."}, status=400)

    expertise = Expertise.objects.create(name=name)
    return JsonResponse({"id": str(expertise.id), "name": expertise.name}, status=201)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def delete_expertise(request, expertise_id):
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    try:
        expertise = Expertise.objects.get(id=expertise_id)
    except Expertise.DoesNotExist:
        return JsonResponse({"detail": "Keahlian tidak ditemukan."}, status=404)

    expertise.delete()
    return JsonResponse({"detail": "Keahlian berhasil dihapus."}, status=200)
