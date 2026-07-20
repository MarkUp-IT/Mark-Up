import json
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache


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


def is_rate_limited(key, limit, window_seconds):
    """Fixed-window rate limiter pakai Django cache framework. Return True
    kalau `key` ini sudah lewat `limit` hit dalam `window_seconds` terakhir
    (request yang lagi jalan ini ikut dihitung). Dipakai buat nge-throttle
    endpoint yang rawan brute-force/spam (login, register, lupa password).

    Backend default (LocMemCache) cukup buat single-process; kalau nanti
    deploy multi-worker/multi-server, set CACHES ke backend yang shared
    (mis. Redis) di .env supaya limitnya konsisten lintas proses."""
    added = cache.add(key, 0, timeout=window_seconds)
    try:
        count = cache.incr(key)
    except ValueError:
        # Key sempat expired pas race antara add() dan incr() -- anggap ini
        # hit pertama di window baru.
        cache.set(key, 1, timeout=window_seconds)
        count = 1
    return count > limit


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