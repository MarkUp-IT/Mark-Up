from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import CompetitionForm
from .models import Competition, CompetitionCategory
from django.utils import timezone
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt

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
