import functools
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import UserRole


def user_boleh_masuk(user):
    """Aturan tunggal "akun ini boleh pakai sistem": aktif menurut Django
    (is_active) DAN statusnya ACTIVE (dinonaktifkan admin lewat User
    Management -> status INACTIVE). Dipakai di jwt_required (tiap request)
    DAN di SIMPLE_JWT["USER_AUTHENTICATION_RULE"] (perpanjangan token di
    /api/auth/refresh/). Dulu cuma is_active yang dicek, padahal admin
    menonaktifkan akun lewat kolom status -- akun nonaktif tetap bisa pakai
    sesi login lamanya & terus memperpanjang token (ketahuan lewat tes
    mark_up/test_izin_akses.py, Okt 2026)."""
    from .models import UserStatus

    return user is not None and user.is_active and user.status == UserStatus.ACTIVE


def jwt_required(view_func):
    @functools.wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return JsonResponse({"detail": "Authentication required."}, status=401)

        token = auth_header.split(" ", 1)[1].strip()
        auth = JWTAuthentication()

        try:
            validated_token = auth.get_validated_token(token)
            user = auth.get_user(validated_token)
        except (InvalidToken, AuthenticationFailed):
            return JsonResponse({"detail": "Invalid or expired token."}, status=401)

        if not user_boleh_masuk(user):
            return JsonResponse(
                {"detail": "Akun kamu sedang dinonaktifkan. Hubungi tim kami untuk info lebih lanjut."},
                status=401,
            )

        request.user = user
        return view_func(request, *args, **kwargs)

    return _wrapped_view


def role_required(*allowed_roles):
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not getattr(request, "user", None) or not request.user.is_authenticated:
                return JsonResponse({"detail": "Authentication required."}, status=401)

            if request.user.role not in allowed_roles:
                return JsonResponse({"detail": "Permission denied."}, status=403)

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator
