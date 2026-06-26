from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import RegisterForm
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole

def register_view(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	form = RegisterForm(request_data)

	if not form.is_valid():
		errors = {k: list(v) for k, v in form.errors.items()}
		non_field = form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	user = form.save(commit=False)
	user.set_password(form.cleaned_data["password"])
	user.save()

	return JsonResponse(
		{
			"detail": "Registrasi berhasil.",
			"user": {"id": str(user.id), "email": user.email, "fullname": user.fullname},
		},
		status=201,
	)

def login_view(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	email = request_data.get("email")
	password = request_data.get("password")

	if not email or not password:
		return JsonResponse(
			{"detail": "Email dan password wajib diisi."},
			status=400,
		)

	user = authenticate(
		request,
		username=email,
		password=password,
	)

	if user is None:
		return JsonResponse(
			{"detail": "Email atau password salah."},
			status=401,
		)

	refresh = RefreshToken.for_user(user)

	return JsonResponse(
		{
			"detail": "Login berhasil.",
			"access": str(refresh.access_token),
			"refresh": str(refresh),
			"user": {
				"id": str(user.id),
				"email": user.email,
				"fullname": user.fullname,
			},
		},
		status=200,
	)


def get_users(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	users = User.objects.all().order_by("-created_at")
	data = []
	for u in users:
		item = {
			"id": str(u.id),
			"fullname": u.fullname,
			"email": u.email,
			"phone": u.phone,
			"role": u.role,
			"status": u.status,
			"image": u.profile_image_url,
			"created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
		}


		data.append(item)

	return JsonResponse({"users": data}, status=200)

def get_user_summary(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	total_users = User.objects.count()
	students = User.objects.filter(
		role=UserRole.STUDENT
	).count()
	mentors = User.objects.filter(
		role=UserRole.MENTOR
	).count()

	return JsonResponse(
		{
			"total_users": total_users,
			"students": students,
			"mentors": mentors,
		},
		status=200,
	)
