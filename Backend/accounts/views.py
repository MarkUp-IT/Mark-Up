from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import RegisterForm, UpdateProfileForm
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole
from .decorators import jwt_required, role_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

@csrf_exempt
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

@csrf_exempt
def login_view(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	email = request_data.get("email")
	password = request_data.get("password")

	try:
		user_obj = User.objects.get(email=email)
	except User.DoesNotExist:
		user_obj = None

	if user_obj:
		user = authenticate(
			request,
			username=user_obj.username,
			password=password,
		)
	else:
		user = None

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


@jwt_required
@role_required(UserRole.ADMIN)
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


@jwt_required
@role_required(UserRole.ADMIN)
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

@jwt_required
def get_current_user(request):

    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    user = request.user

    profile_name = (
        getattr(user, "fullname", None)
        or user.get_full_name()
        or user.username
    )

    avatar_src = (
        getattr(user, "profile_image_url", None)
        or f"https://api.dicebear.com/7.x/notionists/svg?seed={profile_name}"
    )

    data = {
        "id": str(user.id),
        "profile_name": profile_name,
        "email": user.email,
        "avatar_src": avatar_src,
        "dashboard_href": "/user/my-products",
    }

    return JsonResponse(
        {
            "is_logged_in": True,
            "user": data,
        }
    )

@csrf_exempt
def logout_user(request):
   
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    return JsonResponse({"detail": "Logout berhasil"}, status=200)


@jwt_required
def profile_view(request):
    
    user = request.user

    if request.method == "GET":
        data = {
            "fullname": user.fullname,
            "email": user.email,
            "phone": user.phone or "",
            "institution": user.institution or "",
            "current_status": user.current_status or "",
            "linkedin_url": user.linkedin_url or "",
        }
        return JsonResponse({"user": data}, status=200)

    if request.method in ("PATCH", "POST"):
        request_data = get_request_data(request)
        if request_data is None:
            return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

        form = UpdateProfileForm(request_data, instance=user)

        if not form.is_valid():
            errors = {k: list(v) for k, v in form.errors.items()}
            return JsonResponse({"errors": errors}, status=400)

        form.save()

        return JsonResponse(
            {
                "detail": "Profil berhasil diperbarui.",
                "user": {
                    "fullname": user.fullname,
                    "email": user.email,
                    "phone": user.phone or "",
                    "institution": user.institution or "",
                    "current_status": user.current_status or "",
                    "linkedin_url": user.linkedin_url or "",
                },
            },
            status=200,
        )

    return HttpResponseNotAllowed(["GET", "PATCH", "POST"])