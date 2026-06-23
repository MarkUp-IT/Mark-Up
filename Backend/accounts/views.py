from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import RegisterForm


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

	user = authenticate(request, username=email, password=password)
	if user is None:
		return JsonResponse(
			{"detail": "Email atau password salah."},
			status=401,
		)

	return JsonResponse(
		{
			"detail": "Login berhasil.",
			"user": {"id": str(user.id), "email": user.email, "fullname": user.fullname},
		},
		status=200,
	)