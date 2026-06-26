from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import CompetitionForm
from .models import Competition
from django.utils import timezone


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
			"competition": {"id": str(competition.id), "title": competition.title, "category": competition.category, "organizer": competition.organizer},
		},
		status=201,
	)

def get_competitions(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	competitions = Competition.objects.all().order_by("-created_at")
	data = []

	for c in competitions:
		data.append({
			"competition_id": str(c.id),
			"category": c.category,
			"title": c.title,
			"image_url": c.image_url,
			"organizer": c.organizer,
			"deadline": c.deadline,
		})

	return JsonResponse({"competitions": data}, status=200)

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
			"competition": {"id": str(competition.id), "title": competition.title, "category": competition.category, "organizer": competition.organizer},
		},
		status=200,
	)
