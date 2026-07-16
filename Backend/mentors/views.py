from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone

from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole

from .models import MentorProfile, MentorAvailability, MentoringSession
from .forms import MentorAvailabilityForm


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


def _serialize_mentor(mentor):
    upcoming_slots = mentor.mentor_availabilities.filter(
        is_booked=False,
        start_time__gt=timezone.now(),
    ).order_by("start_time")[:10]

    return {
        "id": str(mentor.id),
        "name": mentor.user.fullname,
        "headline": mentor.headline,
        "bio": mentor.bio,
        "linkedin": mentor.linkedin_url,
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

    data = [_serialize_mentor(mentor) for mentor in mentors]
    return JsonResponse({"mentors": data}, status=200)


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

    form = MentorAvailabilityForm(request.POST)

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


def get_user_mentoring_sessions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    sessions = (
        MentoringSession.objects.filter(user=request.user)
        .select_related(
            "mentoring_product",
            "mentor_availability",
            "mentor_availability__mentor_profile",
            "mentor_availability__mentor_profile__user",
        )
        .order_by("-created_at")
    )

    data = []
    for session in sessions:
        data.append(
            {
                "id": str(session.id),
                "status": session.status,
                "meeting_link": session.meeting_link,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
                "product": {
                    "id": str(session.mentoring_product.product.id),
                    "title": session.mentoring_product.title,
                    "description": session.mentoring_product.description,
                    "price": str(session.mentoring_product.price),
                },
                "mentor": {
                    "id": str(session.mentor_availability.mentor_profile.user.id),
                    "fullname": session.mentor_availability.mentor_profile.user.fullname,
                    "email": session.mentor_availability.mentor_profile.user.email,
                },
                "schedule": {
                    "start_time": session.mentor_availability.start_time.isoformat(),
                    "end_time": session.mentor_availability.end_time.isoformat(),
                    "is_booked": session.mentor_availability.is_booked,
                },
            }
        )

    return JsonResponse({"sessions": data}, status=200)


def get_mentor_availability(request, mentor_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    try:
        mentor = MentorProfile.objects.select_related("user").get(user__username=mentor_id)
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