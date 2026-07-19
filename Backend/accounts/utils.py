import json
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Subclass terpisah dari PasswordResetTokenGenerator supaya token
    verifikasi email nggak bisa dipakai ulang buat reset password (dan
    sebaliknya) -- key_salt Django otomatis diturunkan dari nama class."""

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.is_email_verified}{timestamp}"


def get_request_data(request):
    try:
        if request.content_type.startswith("application/json"):
            return json.loads(request.body.decode() or "{}")

        return request.POST

    except json.JSONDecodeError:
        return None


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_audit(request, action, table_name, object_id="", old_data=None, new_data=None):
    from .models import AuditLog

    AuditLog.objects.create(
        admin=getattr(request, "user", None) if getattr(request.user, "is_authenticated", False) else None,
        action=action,
        table_name=table_name,
        object_id=str(object_id),
        old_data=old_data,
        new_data=new_data,
        ip_address=get_client_ip(request),
    )