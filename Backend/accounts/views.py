from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.http import JsonResponse, HttpResponseNotAllowed
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from .utils import get_request_data, log_audit, EmailVerificationTokenGenerator, get_client_ip, is_rate_limited
from .forms import RegisterForm, UpdateProfileForm
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, UserRole, UserStatus, ContactMessage, ContactMessageStatus, AuditAction
from .decorators import jwt_required, role_required
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json


def _get_profile_image_url(user, request):
    if not user.profile_image:
        return None
    return request.build_absolute_uri(user.profile_image.url)


def _get_cv_url(user, request):
    if not user.cv_file:
        return None
    return request.build_absolute_uri(user.cv_file.url)


def _get_cv_filename(user):
    if not user.cv_file:
        return None
    return user.cv_file.name.rsplit("/", 1)[-1]

@csrf_exempt
def register_view(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	ip = get_client_ip(request)
	if is_rate_limited(f"rl:register:ip:{ip}", limit=10, window_seconds=3600):
		return JsonResponse(
			{"detail": "Terlalu banyak percobaan registrasi dari perangkat ini. Coba lagi nanti."},
			status=429,
		)

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
	user.is_email_verified = False
	user.save()

	uid = urlsafe_base64_encode(force_bytes(user.pk))
	token = _email_verification_token.make_token(user)
	verify_link = f"{settings.FRONTEND_BASE_URL}/verify-email?uid={uid}&token={token}"

	send_mail(
		subject="Verifikasi Email MARK-UP",
		message=(
			f"Halo {user.fullname},\n\n"
			f"Terima kasih sudah mendaftar di MARK-UP. Klik link berikut buat verifikasi email kamu:\n{verify_link}\n\n"
			"Kalau kamu nggak merasa mendaftar, abaikan email ini."
		),
		from_email=settings.DEFAULT_FROM_EMAIL,
		recipient_list=[user.email],
		fail_silently=True,
	)

	return JsonResponse(
		{
			"detail": "Registrasi berhasil. Silakan cek email kamu untuk verifikasi akun.",
			"user": {"id": str(user.id), "email": user.email, "fullname": user.fullname},
		},
		status=201,
	)

@csrf_exempt
def login_view(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	ip = get_client_ip(request)
	if is_rate_limited(f"rl:login:ip:{ip}", limit=20, window_seconds=300):
		return JsonResponse(
			{"detail": "Terlalu banyak percobaan login dari perangkat ini. Coba lagi beberapa menit lagi."},
			status=429,
		)

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	email = request_data.get("email")
	password = request_data.get("password")

	if email and is_rate_limited(f"rl:login:email:{email.strip().lower()}", limit=5, window_seconds=300):
		return JsonResponse(
			{"detail": "Terlalu banyak percobaan login untuk akun ini. Coba lagi beberapa menit lagi."},
			status=429,
		)

	try:
		user_obj = User.objects.get(email=email)
	except User.DoesNotExist:
		user_obj = None

	if user_obj:
		user = authenticate(
			request,
			email=user_obj.email,
			password=password,
		)
	else:
		user = None

	if user is None:
		return JsonResponse(
			{"detail": "Email atau password salah."},
			status=401,
		)

	if not user.is_email_verified:
		return JsonResponse(
			{
				"detail": "Email kamu belum diverifikasi. Silakan cek inbox kamu atau minta kirim ulang link verifikasi.",
				"code": "email_not_verified",
			},
			status=403,
		)

	if user.status == UserStatus.INACTIVE:
		return JsonResponse(
			{"detail": "Akun ini sudah dinonaktifkan. Hubungi tim kami kalau ini keliru."},
			status=403,
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
				"role": user.role,

			},
		},
		status=200,
	)


@csrf_exempt
def google_login_view(request):
	"""Register/login pakai akun Google. Frontend pakai tombol custom sendiri
	(bukan tombol bawaan Google) yang minta access token lewat popup OAuth2
	(google.accounts.oauth2.initTokenClient) -- access token itu divalidasi
	di sini dengan manggil userinfo endpoint Google sendiri (bukan cuma
	dipercaya mentah-mentah), lalu user dicari/dibuat berdasarkan email yang
	sudah pasti terverifikasi oleh Google -- dan diterbitkan JWT kita sendiri,
	sama persis kayak alur login manual."""
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	ip = get_client_ip(request)
	if is_rate_limited(f"rl:google-login:ip:{ip}", limit=20, window_seconds=300):
		return JsonResponse(
			{"detail": "Terlalu banyak percobaan login dari perangkat ini. Coba lagi beberapa menit lagi."},
			status=429,
		)

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	access_token = request_data.get("access_token")
	if not access_token:
		return JsonResponse({"detail": "Token Google diperlukan."}, status=400)

	client_id = getattr(settings, "GOOGLE_CLIENT_ID", None)
	if not client_id:
		return JsonResponse({"detail": "Login Google belum dikonfigurasi di server."}, status=503)

	import requests as http_requests

	try:
		userinfo_res = http_requests.get(
			"https://www.googleapis.com/oauth2/v3/userinfo",
			headers={"Authorization": f"Bearer {access_token}"},
			timeout=5,
		)
	except http_requests.RequestException:
		return JsonResponse({"detail": "Gagal menghubungi server Google. Coba lagi."}, status=502)

	if userinfo_res.status_code != 200:
		return JsonResponse({"detail": "Token Google tidak valid atau kedaluwarsa."}, status=401)

	payload = userinfo_res.json()

	if not payload.get("email_verified"):
		return JsonResponse({"detail": "Email Google kamu belum terverifikasi."}, status=401)

	email = payload["email"].strip().lower()
	fullname = payload.get("name") or email.split("@")[0]

	user, created = User.objects.get_or_create(
		email=email,
		defaults={
			"fullname": fullname,
			"role": UserRole.STUDENT,
			"is_email_verified": True,
		},
	)
	if created:
		user.set_unusable_password()
		user.save(update_fields=["password"])

	if user.status == UserStatus.INACTIVE:
		return JsonResponse(
			{"detail": "Akun ini sudah dinonaktifkan. Hubungi tim kami kalau ini keliru."},
			status=403,
		)

	refresh = RefreshToken.for_user(user)

	return JsonResponse(
		{
			"detail": "Login Google berhasil.",
			"access": str(refresh.access_token),
			"refresh": str(refresh),
			"user": {
				"id": str(user.id),
				"email": user.email,
				"fullname": user.fullname,
				"role": user.role,
			},
		},
		status=201 if created else 200,
	)


def _serialize_user_row(u, request):
	return {
		"id": str(u.id),
		"fullname": u.fullname,
		"email": u.email,
		"phone": u.phone,
		"role": u.role,
		"profile_image": _get_profile_image_url(u, request),
		"status": u.status,
		"created_at": u.created_at.isoformat() if getattr(u, "created_at", None) else None,
		"last_login": u.last_login.isoformat() if u.last_login else None,
	}


@jwt_required
@role_required(UserRole.ADMIN)
def get_users(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	users = User.objects.all().order_by("-created_at")

	role = request.GET.get("role")
	if role and role != "Semua Role":
		users = users.filter(role=role.upper())

	search = request.GET.get("search")
	if search:
		users = users.filter(fullname__icontains=search) | users.filter(email__icontains=search)

	data = [_serialize_user_row(u, request) for u in users]

	return JsonResponse({"users": data}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_user_detail(request, user_id):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return JsonResponse({"detail": "User tidak ditemukan."}, status=404)

	data = _serialize_user_row(user, request)
	data["institution"] = user.institution
	data["current_status"] = user.current_status

	if user.role == UserRole.MENTOR:
		from mentors.models import MentorProfile

		try:
			mentor_profile = user.mentor_profile
		except MentorProfile.DoesNotExist:
			mentor_profile = None

		if mentor_profile:
			data["mentor_profile"] = {
				"headline": mentor_profile.headline or "",
				"bio": mentor_profile.bio or "",
				"linkedin_url": mentor_profile.linkedin_url,
				"rating": float(mentor_profile.rating),
				"review_count": mentor_profile.review_count,
				"expertise": list(
					mentor_profile.mentor_expertises.values_list("expertise__name", flat=True)
				),
				"experience": [
					{
						"title": exp.title,
						"start_date": exp.start_date.isoformat(),
						"end_date": exp.end_date.isoformat() if exp.end_date else None,
					}
					for exp in mentor_profile.mentor_experiences.all()
				],
				"bank_name": mentor_profile.bank_name,
				"bank_account": mentor_profile.bank_account,
				"bank_account_holder": mentor_profile.bank_account_holder,
			}

	return JsonResponse({"user": data}, status=200)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def update_user(request, user_id):
	if request.method not in ["PATCH", "PUT"]:
		return HttpResponseNotAllowed(["PATCH", "PUT"])

	try:
		user = User.objects.get(id=user_id)
	except User.DoesNotExist:
		return JsonResponse({"detail": "User tidak ditemukan."}, status=404)

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	old_data = {"role": user.role, "status": user.status}

	role = request_data.get("role")
	if role:
		role = role.upper()
		if role not in UserRole.values:
			return JsonResponse({"errors": {"role": ["Role tidak valid."]}}, status=400)
		user.role = role
		if role == UserRole.MENTOR:
			from mentors.models import MentorProfile
			MentorProfile.objects.get_or_create(
				user=user,
				defaults={"bank_name": "", "bank_account": "", "linkedin_url": ""},
			)

	status_value = request_data.get("status")
	if status_value:
		status_value = status_value.upper()
		if status_value not in UserStatus.values:
			return JsonResponse({"errors": {"status": ["Status tidak valid."]}}, status=400)
		user.status = status_value

	user.save()

	log_audit(
		request,
		AuditAction.UPDATE,
		"users",
		object_id=user.id,
		old_data=old_data,
		new_data={"role": user.role, "status": user.status},
	)

	return JsonResponse({"detail": "User berhasil diperbarui.", "user": _serialize_user_row(user, request)}, status=200)


@csrf_exempt
@jwt_required
def change_password(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	current_password = request_data.get("current_password")
	new_password = request_data.get("new_password")

	if not current_password or not new_password:
		return JsonResponse({"detail": "Password lama dan baru diperlukan."}, status=400)

	user = request.user
	if not user.check_password(current_password):
		return JsonResponse({"errors": {"current_password": ["Password lama salah."]}}, status=400)

	from django.contrib.auth.password_validation import validate_password
	from django.core.exceptions import ValidationError as DjangoValidationError

	try:
		validate_password(new_password, user=user)
	except DjangoValidationError as e:
		return JsonResponse({"errors": {"new_password": list(e.messages)}}, status=400)

	user.set_password(new_password)
	user.save()

	return JsonResponse({"detail": "Password berhasil diubah."}, status=200)


@csrf_exempt
@jwt_required
def delete_account(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	user = request.user

	# Soft-delete (set nonaktif) -- BUKAN hard delete, biar histori transaksi/
	# review/sertifikat yang udah ada nggak ikut hilang/rusak. Login_view udah
	# nolak status INACTIVE, jadi akun ini nggak bisa dipakai login lagi.
	user.status = UserStatus.INACTIVE
	user.save(update_fields=["status"])

	log_audit(
		request, AuditAction.UPDATE, "users", object_id=user.id,
		old_data={"status": UserStatus.ACTIVE}, new_data={"status": UserStatus.INACTIVE},
	)

	return JsonResponse({"detail": "Akun berhasil dinonaktifkan."}, status=200)


_password_reset_token = PasswordResetTokenGenerator()
_email_verification_token = EmailVerificationTokenGenerator()


@csrf_exempt
def forgot_password(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	ip = get_client_ip(request)
	if is_rate_limited(f"rl:forgot:ip:{ip}", limit=10, window_seconds=3600):
		return JsonResponse(
			{"detail": "Terlalu banyak permintaan reset password. Coba lagi nanti."},
			status=429,
		)

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	email = (request_data.get("email") or "").strip()
	generic_response = JsonResponse(
		{"detail": "Kalau email itu terdaftar, link reset password sudah dikirim."},
		status=200,
	)

	if not email:
		return JsonResponse({"detail": "Email diperlukan."}, status=400)

	# Limit per-email juga (bukan cuma per-IP) supaya satu akun gak bisa
	# di-spam link reset dari banyak IP berbeda. Kalau limit ini kelewat,
	# tetap balikin generic_response (bukan 429) biar gak jadi sinyal buat
	# nebak-nebak email mana yang terdaftar.
	if is_rate_limited(f"rl:forgot:email:{email.lower()}", limit=3, window_seconds=3600):
		return generic_response

	try:
		user = User.objects.get(email__iexact=email)
	except User.DoesNotExist:
		# Jangan bocorin apakah email itu terdaftar atau nggak.
		return generic_response

	uid = urlsafe_base64_encode(force_bytes(user.pk))
	token = _password_reset_token.make_token(user)
	reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}"

	send_mail(
		subject="Reset Password MARK-UP",
		message=(
			f"Halo {user.fullname},\n\n"
			f"Klik link berikut buat bikin password baru (berlaku 30 menit):\n{reset_link}\n\n"
			"Kalau kamu nggak minta reset password, abaikan email ini."
		),
		from_email=settings.DEFAULT_FROM_EMAIL,
		recipient_list=[user.email],
		fail_silently=True,
	)

	return generic_response


@csrf_exempt
def reset_password(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	uid = request_data.get("uid")
	token = request_data.get("token")
	new_password = request_data.get("new_password")

	if not uid or not token or not new_password:
		return JsonResponse({"detail": "uid, token, dan new_password diperlukan."}, status=400)

	try:
		user_id = urlsafe_base64_decode(uid).decode()
		user = User.objects.get(pk=user_id)
	except (User.DoesNotExist, ValueError, TypeError, OverflowError):
		return JsonResponse({"detail": "Link reset password tidak valid."}, status=400)

	if not _password_reset_token.check_token(user, token):
		return JsonResponse({"detail": "Link reset password tidak valid atau sudah kedaluwarsa."}, status=400)

	from django.contrib.auth.password_validation import validate_password
	from django.core.exceptions import ValidationError as DjangoValidationError

	try:
		validate_password(new_password, user=user)
	except DjangoValidationError as e:
		return JsonResponse({"errors": {"new_password": list(e.messages)}}, status=400)

	user.set_password(new_password)
	user.save()

	return JsonResponse({"detail": "Password berhasil direset. Silakan login dengan password baru."}, status=200)


@csrf_exempt
def verify_email(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	uid = request_data.get("uid")
	token = request_data.get("token")

	if not uid or not token:
		return JsonResponse({"detail": "uid dan token diperlukan."}, status=400)

	try:
		user_id = urlsafe_base64_decode(uid).decode()
		user = User.objects.get(pk=user_id)
	except (User.DoesNotExist, ValueError, TypeError, OverflowError):
		return JsonResponse({"detail": "Link verifikasi tidak valid."}, status=400)

	if user.is_email_verified:
		return JsonResponse({"detail": "Email kamu sudah terverifikasi sebelumnya."}, status=200)

	if not _email_verification_token.check_token(user, token):
		return JsonResponse({"detail": "Link verifikasi tidak valid atau sudah kedaluwarsa."}, status=400)

	user.is_email_verified = True
	user.save()

	return JsonResponse({"detail": "Email berhasil diverifikasi. Silakan login."}, status=200)


@csrf_exempt
def resend_verification_email(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	ip = get_client_ip(request)
	if is_rate_limited(f"rl:resend-verify:ip:{ip}", limit=10, window_seconds=3600):
		return JsonResponse(
			{"detail": "Terlalu banyak permintaan kirim ulang verifikasi. Coba lagi nanti."},
			status=429,
		)

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	email = (request_data.get("email") or "").strip()
	generic_response = JsonResponse(
		{"detail": "Kalau email itu terdaftar dan belum diverifikasi, link verifikasi baru sudah dikirim."},
		status=200,
	)

	if not email:
		return JsonResponse({"detail": "Email diperlukan."}, status=400)

	if is_rate_limited(f"rl:resend-verify:email:{email.lower()}", limit=3, window_seconds=3600):
		return generic_response

	try:
		user = User.objects.get(email__iexact=email)
	except User.DoesNotExist:
		return generic_response

	if user.is_email_verified:
		return generic_response

	uid = urlsafe_base64_encode(force_bytes(user.pk))
	token = _email_verification_token.make_token(user)
	verify_link = f"{settings.FRONTEND_BASE_URL}/verify-email?uid={uid}&token={token}"

	send_mail(
		subject="Verifikasi Email MARK-UP",
		message=(
			f"Halo {user.fullname},\n\n"
			f"Klik link berikut buat verifikasi email kamu:\n{verify_link}\n\n"
			"Kalau kamu nggak merasa mendaftar, abaikan email ini."
		),
		from_email=settings.DEFAULT_FROM_EMAIL,
		recipient_list=[user.email],
		fail_silently=True,
	)

	return generic_response


@csrf_exempt
def submit_contact_message(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	name = request_data.get("name")
	email = request_data.get("email")
	subject = request_data.get("subject")
	message = request_data.get("message")

	if not all([name, email, subject, message]):
		return JsonResponse({"detail": "Semua field wajib diisi."}, status=400)

	contact_message = ContactMessage.objects.create(
		name=name, email=email, subject=subject, message=message,
	)

	return JsonResponse(
		{"detail": "Pesan berhasil dikirim.", "id": str(contact_message.id)}, status=201
	)


def _serialize_contact_message(m):
	return {
		"id": str(m.id),
		"name": m.name,
		"email": m.email,
		"subject": m.subject,
		"message": m.message,
		"status": m.status,
		"created_at": m.created_at.isoformat(),
	}


@jwt_required
@role_required(UserRole.ADMIN)
def get_contact_messages(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	messages = ContactMessage.objects.order_by("-created_at")
	return JsonResponse(
		{"messages": [_serialize_contact_message(m) for m in messages]}, status=200
	)


@csrf_exempt
@jwt_required
@role_required(UserRole.ADMIN)
def get_contact_message_detail(request, message_id):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	try:
		contact_message = ContactMessage.objects.get(id=message_id)
	except ContactMessage.DoesNotExist:
		return JsonResponse({"detail": "Pesan tidak ditemukan."}, status=404)

	if contact_message.status == ContactMessageStatus.NEW:
		contact_message.status = ContactMessageStatus.READ
		contact_message.save()

	return JsonResponse(_serialize_contact_message(contact_message), status=200)


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
		_get_profile_image_url(user, request)
		or f"https://api.dicebear.com/7.x/notionists/svg?seed={profile_name}"
	)

    dashboard_href_by_role = {
        UserRole.ADMIN: "/admin",
        UserRole.MENTOR: "/mentor/active-classes",
        UserRole.STUDENT: "/user/my-products",
    }

    data = {
        "id": str(user.id),
        "profile_name": profile_name,
        "email": user.email,
        "role": user.role,
        "avatar_src": avatar_src,
        "dashboard_href": dashboard_href_by_role.get(user.role, "/user/my-products"),
    }

    if user.role == UserRole.MENTOR:
        data["is_profile_complete"] = _is_mentor_profile_complete(user)

    return JsonResponse(
        {
            "is_logged_in": True,
            "user": data,
        }
    )


def _is_mentor_profile_complete(user):
    from mentors.models import MentorProfile

    try:
        return user.mentor_profile.is_profile_complete()
    except MentorProfile.DoesNotExist:
        return False

@csrf_exempt
def logout_user(request):

    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    request_data = get_request_data(request) or {}
    refresh_token = request_data.get("refresh")

    if refresh_token:
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            # Token sudah invalid/expired/pernah di-blacklist -- gak masalah,
            # tujuan akhirnya (token itu gak bisa dipakai lagi) sudah tercapai.
            pass

    return JsonResponse({"detail": "Logout berhasil"}, status=200)

@csrf_exempt
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
			"profile_image": _get_profile_image_url(user, request),
            "cv_url": _get_cv_url(user, request),
            "cv_filename": _get_cv_filename(user),
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

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB, sesuai teks di frontend


@csrf_exempt
@jwt_required
def upload_profile_photo(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    photo = request.FILES.get("photo")
    if not photo:
        return JsonResponse({"detail": "File foto diperlukan."}, status=400)

    ext = photo.name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return JsonResponse({"detail": "Format file harus JPG atau PNG."}, status=400)

    if photo.size > MAX_PROFILE_IMAGE_SIZE:
        return JsonResponse({"detail": "Ukuran file maksimal 2MB."}, status=400)

    user = request.user

    # Hapus file lama dari storage kalau ada, biar nggak numpuk file yatim
    if user.profile_image:
        user.profile_image.delete(save=False)

    user.profile_image = photo
    user.save()

    return JsonResponse(
        {
            "detail": "Foto profil berhasil diunggah.",
            "profile_image": _get_profile_image_url(user, request),
        },
        status=200,
    )


@csrf_exempt
@jwt_required
def delete_profile_photo(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    user = request.user

    if user.profile_image:
        user.profile_image.delete(save=False)
        user.profile_image = None
        user.save()

    return JsonResponse({"detail": "Foto profil berhasil dihapus."}, status=200)


ALLOWED_CV_EXTENSIONS = {"pdf"}
MAX_CV_SIZE = 5 * 1024 * 1024  # 5MB, sesuai teks di frontend


@csrf_exempt
@jwt_required
def upload_cv(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    cv = request.FILES.get("cv")
    if not cv:
        return JsonResponse({"detail": "File CV diperlukan."}, status=400)

    ext = cv.name.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_CV_EXTENSIONS:
        return JsonResponse({"detail": "Format file harus PDF."}, status=400)

    if cv.size > MAX_CV_SIZE:
        return JsonResponse({"detail": "Ukuran file maksimal 5MB."}, status=400)

    user = request.user

    if user.cv_file:
        user.cv_file.delete(save=False)

    user.cv_file = cv
    user.save()

    return JsonResponse(
        {
            "detail": "CV berhasil diunggah.",
            "cv_url": _get_cv_url(user, request),
            "cv_filename": _get_cv_filename(user),
        },
        status=200,
    )


@csrf_exempt
@jwt_required
def delete_cv(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    user = request.user

    if user.cv_file:
        user.cv_file.delete(save=False)
        user.cv_file = None
        user.save()

    return JsonResponse({"detail": "CV berhasil dihapus."}, status=200)


@jwt_required
@role_required(UserRole.ADMIN)
def get_audit_logs(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from .models import AuditLog

    logs = AuditLog.objects.select_related("admin").order_by("-created_at")

    action_filter = request.GET.get("action")
    if action_filter and action_filter != "Semua":
        logs = logs.filter(action=action_filter)

    search = request.GET.get("search")
    if search:
        logs = (
            logs.filter(admin__fullname__icontains=search)
            | logs.filter(admin__email__icontains=search)
            | logs.filter(table_name__icontains=search)
        )

    logs = logs[:500]

    data = [
        {
            "id": str(log.id),
            "admin_name": log.admin.fullname if log.admin else "Sistem",
            "admin_email": log.admin.email if log.admin else "-",
            "action": log.action,
            "table": log.table_name,
            "object_id": log.object_id,
            "old_data": log.old_data,
            "new_data": log.new_data,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]

    return JsonResponse({"logs": data}, status=200)

@jwt_required
@role_required(UserRole.ADMIN)
def get_admin_sidebar_badges(request):
	"""Angka notifikasi buat tiap menu sidebar admin -- masing-masing hitung
	item yang beneran butuh tindakan admin (bukan sekadar total data), biar
	konsisten sama badge/StatCard "butuh tindakan" yang udah ada di
	halaman-halaman terkait."""
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	from django.db.models import Q
	from products.models import MentoringSession, RefundRequest, Review
	from programs.models import BootcampSession as BootcampSessionTemplate
	from transactions.models import Transaction, PaymentStatus, MentorPayout, PayoutStatus

	bootcamp_pending = (
		BootcampSessionTemplate.objects.filter(session_mentors__isnull=True).count()
		+ BootcampSessionTemplate.objects.filter(Q(meeting_link__isnull=True) | Q(meeting_link="")).count()
	)

	mentoring_pending = (
		MentoringSession.objects.filter(status="waiting_schedule").count()
		+ MentoringSession.objects.filter(status="scheduled", zoom_link="").count()
	)

	data = {
		"bootcamp": bootcamp_pending,
		"mentoring": mentoring_pending,
		"transactions": Transaction.objects.filter(payment_status=PaymentStatus.PENDING).count(),
		"refund_requests": RefundRequest.objects.filter(status=RefundRequest.RefundStatus.PENDING).count(),
		"payouts": MentorPayout.objects.filter(status=PayoutStatus.PENDING).count(),
		"messages": ContactMessage.objects.filter(status=ContactMessageStatus.NEW).count(),
		"reviews": Review.objects.filter(is_seen_by_admin=False).count(),
	}

	return JsonResponse(data, status=200)
