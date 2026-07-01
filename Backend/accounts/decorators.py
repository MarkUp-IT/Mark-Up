import functools
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import UserRole


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
