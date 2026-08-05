import json
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError


def normalize_and_validate_url(value, must_contain=None):
    """Pastikan sebuah field link beneran berupa URL (bukan username doang).
    Nge-prepend https:// kalau user gak nulis skema, lalu validasi. Balikin
    tuple (url_ternormalisasi, pesan_error|None). must_contain dipakai buat
    maksa domain tertentu (mis. 'linkedin.com')."""
    value = (value or "").strip()
    if not value:
        return "", None
    if not value.startswith(("http://", "https://")):
        value = "https://" + value
    try:
        URLValidator()(value)
    except DjangoValidationError:
        return value, "Harus berupa link yang valid, contoh: https://..."
    if must_contain and must_contain not in value.lower():
        return value, f"Link harus mengarah ke {must_contain}."
    return value, None


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Subclass terpisah dari PasswordResetTokenGenerator supaya token
    verifikasi email nggak bisa dipakai ulang buat reset password (dan
    sebaliknya) -- key_salt Django otomatis diturunkan dari nama class."""

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.is_email_verified}{timestamp}"


class AccountDeletionTokenGenerator(PasswordResetTokenGenerator):
    """Token buat konfirmasi hapus akun lewat email. Ikut nyertain user.status
    di hash -- jadi begitu akun kehapus (status jadi INACTIVE), token yang sama
    otomatis gak valid lagi (efeknya sekali pakai)."""

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.status}{timestamp}"


def get_request_data(request):
    try:
        if request.content_type.startswith("application/json"):
            return json.loads(request.body.decode() or "{}")

        return request.POST

    except json.JSONDecodeError:
        return None


def get_client_ip(request):
    """IP asli pengunjung, dipakai buat rate limit & audit log.

    X-Forwarded-For itu header yang BISA DIISI KLIEN, jadi entri paling depan
    nggak boleh dipercaya. Dulu fungsi ini ngambil entri pertama -- akibatnya
    penyerang tinggal ngirim "X-Forwarded-For: 1.2.3.4" (diacak tiap request)
    buat ngendaliin cache key rate limiter, dan semua limit per-IP (login,
    register, lupa password, hapus akun) jadi nggak ada artinya.

    Yang dipercaya cuma entri PALING BELAKANG, karena itu yang ditulis reverse
    proxy kita sendiri -- benar untuk dua-duanya: kalau Nginx nimpa headernya
    ($remote_addr, lihat deploy/nginx.conf) isinya cuma satu nilai, dan kalau
    suatu saat balik ke mode nambah ($proxy_add_x_forwarded_for) entri
    terakhir tetap IP yang dilihat proxy.

    Catatan: kalau nanti ada CDN (mis. Cloudflare) di depan Nginx, IP asli
    pindah ke header khusus CDN-nya (CF-Connecting-IP) dan fungsi ini harus
    disesuaikan -- jangan balik ke entri pertama.
    """
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        hops = [part.strip() for part in forwarded_for.split(",") if part.strip()]
        if hops:
            return hops[-1]
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

def notify_team(subject, message):
    """Kirim notifikasi internal ke inbox tim (settings.TEAM_NOTIFICATION_EMAIL)
    buat kejadian yang butuh tindakan cepat -- transaksi baru nunggu verifikasi,
    pesan masuk, pengajuan refund. Dikirim di thread terpisah + fail_silently
    biar SMTP yang lambat/error nggak pernah nge-block atau nggagalin aksi user
    yang lagi jalan (checkout, kirim pesan, dll)."""
    import threading
    from django.conf import settings
    from django.core.mail import send_mail

    recipient = getattr(settings, "TEAM_NOTIFICATION_EMAIL", None)
    if not recipient:
        return

    def _send():
        try:
            send_mail(
                subject=f"[MarkUp] {subject}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=True,
            )
        except Exception:
            # Notifikasi internal -- kegagalan kirim gak boleh ngeganggu apa pun.
            pass

    threading.Thread(target=_send, daemon=True).start()
