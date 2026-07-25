from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import CompetitionForm
from .models import Competition, CompetitionCategory, BootcampSession, BootcampSessionMentor
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole, AuditAction
from accounts.utils import log_audit
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
from mentors.models import MentorProfile

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_competition(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	form = CompetitionForm(request_data)

	if not form.is_valid():
		errors = {k: list(v) for k, v in form.errors.items()}
		non_field = form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	competition = form.save(commit=False)
	competition.save()

	return JsonResponse(
		{
			"detail": "Kompetisi berhasil ditambahkan.",
			"competition": {"id": str(competition.id), "title": competition.title, "category": competition.category.name,
            "category_id": str(competition.category.id), "organizer": competition.organizer},
		},
		status=201,
	)


def get_categories(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    categories = CompetitionCategory.objects.order_by("name")
    data = [
        {"id": str(category.id), "name": category.name}
        for category in categories
    ]

    return JsonResponse({"categories": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_category(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    name = (request_data.get("name") or "").strip()
    if not name:
        return JsonResponse({"errors": {"name": ["Nama kategori diperlukan."]}}, status=400)

    if CompetitionCategory.objects.filter(name__iexact=name).exists():
        return JsonResponse({"errors": {"name": ["Kategori dengan nama ini sudah ada."]}}, status=400)

    category = CompetitionCategory.objects.create(name=name)

    return JsonResponse(
        {
            "detail": "Kategori berhasil ditambahkan.",
            "category": {"id": str(category.id), "name": category.name},
        },
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_category(request, category_id):
    if request.method not in ["PUT", "PATCH"]:
        return HttpResponseNotAllowed(["PUT", "PATCH"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    try:
        category = CompetitionCategory.objects.get(id=category_id)
    except CompetitionCategory.DoesNotExist:
        return JsonResponse({"detail": "Kategori tidak ditemukan."}, status=404)

    name = (request_data.get("name") or "").strip()
    if not name:
        return JsonResponse({"errors": {"name": ["Nama kategori diperlukan."]}}, status=400)

    if CompetitionCategory.objects.filter(name__iexact=name).exclude(id=category.id).exists():
        return JsonResponse({"errors": {"name": ["Kategori dengan nama ini sudah ada."]}}, status=400)

    category.name = name
    category.save(update_fields=["name"])

    return JsonResponse(
        {
            "detail": "Kategori berhasil diperbarui.",
            "category": {"id": str(category.id), "name": category.name},
        },
        status=200,
    )


def get_competitions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    qs = Competition.objects.select_related("category").order_by("-deadline")

    category = request.GET.get("category")
    if category and category != "Semua":
        qs = qs.filter(category__name=category)

    search = request.GET.get("search")
    if search:
        qs = qs.filter(title__icontains=search)

    page_number = request.GET.get("page", 1)
    page_size = request.GET.get("page_size", 12)
    paginator = Paginator(qs, page_size)
    page = paginator.get_page(page_number)

    data = [
        {
            "id": str(c.id),
            "title": c.title,
            "category": c.category.name if c.category_id else None,
			"category_id": str(c.category.id) if c.category_id else None,
            "organizer": c.organizer,
            "date": c.event_date.isoformat() if c.event_date else None,
            "deadline": c.deadline.isoformat() if c.deadline else None,
            "fee": c.registration_fee,
            "prize": c.prizepool,
            "level": c.level,
            "target": c.target_participant,
            "image": c.image_url,
            "link": c.registration_link,
        }
        for c in page.object_list
    ]

    return JsonResponse(
        {
            "competitions": data,
            "page": page.number,
            "total_pages": paginator.num_pages,
            "total_items": paginator.count,
        },
        status=200,
    )

@jwt_required
@role_required(UserRole.ADMIN)
def get_competition_summary(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	total_competition = Competition.objects.count()

	active = Competition.objects.filter(
		deadline__gt=timezone.now()
	).count()

	expired = Competition.objects.filter(
		deadline__lte=timezone.now()
	).count()

	return JsonResponse(
		{
			"total": total_competition,
			"total_active": active,
			"total_expired": expired,
		},
		status=200,
	)

@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_competition(request, competition_id):
	if request.method not in ["PUT", "PATCH"]:
		return HttpResponseNotAllowed(["PUT", "PATCH"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	try:
		competition = Competition.objects.get(id=competition_id)
	except Competition.DoesNotExist:
		return JsonResponse({"detail": "Kompetisi tidak ditemukan."}, status=404)

	form = CompetitionForm(request_data, instance=competition)

	if not form.is_valid():
		errors = {k: list(v) for k, v in form.errors.items()}
		non_field = form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	competition = form.save(commit=False)
	competition.save()

	return JsonResponse(
		{
			"detail": "Kompetisi berhasil diperbarui.",
			"competition": {"id": str(competition.id), "title": competition.title, "category": competition.category.name,
            "category_id": str(competition.category.id), "organizer": competition.organizer},
		},
		status=200,
	)


def _serialize_bootcamp_session_template(session):
    assignments = list(session.session_mentors.select_related("mentor_profile__user").all())
    return {
        "id": str(session.id),
        "title": session.title,
        "description": session.description or "",
        "start_time": session.start_time.isoformat(),
        "end_time": session.end_time.isoformat(),
        "meeting_link": session.meeting_link or "",
        "mentor_ids": [str(a.mentor_profile_id) for a in assignments],
        "mentor_names": [a.mentor_profile.user.fullname for a in assignments],
    }


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_batches(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from products.models import BootcampProduct

    batches = BootcampProduct.objects.select_related("product").prefetch_related(
        "sessions__session_mentors"
    )

    data = []
    for batch in batches:
        sessions = list(batch.sessions.all())
        peserta = batch.product.user_libraries.count()
        unassigned = sum(1 for s in sessions if not s.session_mentors.exists())
        pending_link = sum(1 for s in sessions if not s.meeting_link)
        data.append({
            "id": str(batch.product_id),
            "title": batch.title,
            "peserta": peserta,
            "sesi": len(sessions),
            "unassigned": unassigned,
            "pending": pending_link,
            "is_active": batch.is_active,
        })

    return JsonResponse({"batches": data}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_bootcamp_batch_detail(request, product_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from products.models import BootcampProduct

    try:
        batch = BootcampProduct.objects.select_related("product").get(product_id=product_id)
    except BootcampProduct.DoesNotExist:
        return JsonResponse({"detail": "Batch bootcamp tidak ditemukan."}, status=404)

    sessions = batch.sessions.prefetch_related(
        "session_mentors__mentor_profile__user"
    ).order_by("start_time")

    return JsonResponse(
        {
            "title": batch.title,
            "sessions": [_serialize_bootcamp_session_template(s) for s in sessions],
        },
        status=200,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def add_bootcamp_session_template(request, product_id):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    title = request_data.get("title")
    start_time = parse_datetime(request_data.get("start_time") or "")
    end_time = parse_datetime(request_data.get("end_time") or "")

    if not title or not start_time or not end_time:
        return JsonResponse(
            {"errors": {"detail": ["title, start_time, dan end_time wajib diisi (ISO datetime)."]}},
            status=400,
        )

    session = BootcampSession.objects.create(
        bootcamp_id=product_id,
        title=title,
        description=request_data.get("description", ""),
        start_time=start_time,
        end_time=end_time,
        meeting_link=request_data.get("meeting_link", ""),
    )

    log_audit(request, AuditAction.CREATE, "bootcamp_sessions", object_id=session.id)

    return JsonResponse(
        {"detail": "Sesi berhasil ditambahkan.", "session": _serialize_bootcamp_session_template(session)},
        status=201,
    )


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_bootcamp_session_template(request, session_id):
    if request.method not in ["PATCH", "PUT", "DELETE"]:
        return HttpResponseNotAllowed(["PATCH", "PUT", "DELETE"])

    try:
        session = BootcampSession.objects.get(id=session_id)
    except BootcampSession.DoesNotExist:
        return JsonResponse({"detail": "Sesi tidak ditemukan."}, status=404)

    if request.method == "DELETE":
        session.delete()
        log_audit(request, AuditAction.DELETE, "bootcamp_sessions", object_id=session_id)
        return JsonResponse({"detail": "Sesi berhasil dihapus."}, status=200)

    request_data = get_request_data(request)
    if request_data is None:
        return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

    if "title" in request_data:
        session.title = request_data["title"]
    if "description" in request_data:
        session.description = request_data["description"]
    if "meeting_link" in request_data:
        session.meeting_link = request_data["meeting_link"]
    if request_data.get("start_time"):
        session.start_time = parse_datetime(request_data["start_time"])
    if request_data.get("end_time"):
        session.end_time = parse_datetime(request_data["end_time"])
    session.save()

    mentor_profiles = []
    mentor_changed = "mentor_ids" in request_data
    if mentor_changed:
        session.session_mentors.all().delete()
        mentor_ids = request_data.get("mentor_ids") or []
        mentor_profiles = list(MentorProfile.objects.filter(id__in=mentor_ids))
        found_ids = {str(m.id) for m in mentor_profiles}
        missing_ids = [str(mid) for mid in mentor_ids if str(mid) not in found_ids]
        if missing_ids:
            return JsonResponse({"errors": {"mentor_ids": [f"Mentor tidak ditemukan: {', '.join(missing_ids)}"]}}, status=404)
        BootcampSessionMentor.objects.bulk_create([
            BootcampSessionMentor(bootcamp_session=session, mentor_profile=m) for m in mentor_profiles
        ])

    # Sesi bootcamp itu kelas bareng -- satu link/jadwal/mentor yang sama
    # buat semua peserta yang beli batch ini (beda sama mentoring yang
    # 1-on-1 dan memang wajar beda link per pembeli). Jadi begitu admin
    # update template-nya, ikut disebar ke salinan sesi tiap peserta yang
    # sudah beli tapi BELUM menyelesaikan sesi itu -- yang sudah selesai
    # dibiarkan apa adanya karena riwayatnya sudah final.
    sync_fields = {"title": session.title, "start_time": session.start_time, "meeting_link": session.meeting_link}
    active_buyer_sessions = list(session.buyer_sessions.exclude(status="completed"))
    session.buyer_sessions.exclude(status="completed").update(**sync_fields)
    if mentor_changed:
        for buyer_session in active_buyer_sessions:
            buyer_session.mentors.set(mentor_profiles)

    log_audit(request, AuditAction.UPDATE, "bootcamp_sessions", object_id=session.id)

    return JsonResponse(
        {"detail": "Sesi berhasil diperbarui.", "session": _serialize_bootcamp_session_template(session)},
        status=200,
    )
