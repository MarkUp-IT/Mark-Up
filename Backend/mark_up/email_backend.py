"""Kirim email lewat HTTP API Brevo, bukan SMTP.

KENAPA: provider hosting ini memblokir email keluar. Buktinya (diukur langsung
di server):
  - smtp-relay.brevo.com di-resolve ke 1.179.116.1 -- IP lokal Indonesia, bukan
    milik Brevo. Bahkan query ke DNS publik (1.1.1.1) dibelokkan ke IP yang sama,
    jadi DNS-nya memang dicegat di level jaringan.
  - Port 587/465/2525 "terbuka" tapi TIDAK PERNAH ngirim banner SMTP. Koneksi
    nyantol lalu diam -- makanya send_mail menggantung >2 menit sampai worker
    gunicorn dibunuh.
  - Sebaliknya, api.brevo.com:443 normal (balas HTTP 401 = nyambung, cuma minta
    kunci).

Jadi jalurnya dipindah ke HTTPS yang jelas-jelas lolos. Bonus: gak bergantung
DNS smtp-relay yang dibajak, dan port 443 praktis gak pernah diblokir di mana
pun kalau nanti pindah hosting.
"""

import json
from email.utils import parseaddr

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"
TIMEOUT_SECONDS = 15


def _split_address(addr):
    """'Mark-Up <no-reply@mark-up.id>' -> ('Mark-Up', 'no-reply@mark-up.id')."""
    name, email = parseaddr(addr or "")
    return (name or None), email


class BrevoAPIEmailBackend(BaseEmailBackend):
    """Backend email Django yang ngirim lewat REST API Brevo."""

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = getattr(settings, "BREVO_API_KEY", "") or ""

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        if not self.api_key:
            if not self.fail_silently:
                raise ValueError("BREVO_API_KEY belum diisi di .env")
            return 0

        import requests

        terkirim = 0
        for msg in email_messages:
            try:
                if self._send_one(requests, msg):
                    terkirim += 1
            except Exception:
                # fail_silently dipegang pemanggil (send_mail_async selalu True),
                # supaya email yang gagal gak pernah ngerusak aksi user.
                if not self.fail_silently:
                    raise
        return terkirim

    def _send_one(self, requests, msg):
        penerima = [{"email": e} for e in msg.to if e]
        if not penerima:
            return False

        nama_pengirim, email_pengirim = _split_address(
            msg.from_email or settings.DEFAULT_FROM_EMAIL
        )
        pengirim = {"email": email_pengirim}
        if nama_pengirim:
            pengirim["name"] = nama_pengirim

        payload = {
            "sender": pengirim,
            "to": penerima,
            "subject": msg.subject,
            "textContent": msg.body or " ",
        }
        if msg.cc:
            payload["cc"] = [{"email": e} for e in msg.cc]
        if msg.bcc:
            payload["bcc"] = [{"email": e} for e in msg.bcc]

        # Kalau view ngirim versi HTML (EmailMultiAlternatives), ikutkan.
        for isi, tipe in getattr(msg, "alternatives", []) or []:
            if tipe == "text/html":
                payload["htmlContent"] = isi
                break

        res = requests.post(
            BREVO_ENDPOINT,
            headers={
                "api-key": self.api_key,
                "content-type": "application/json",
                "accept": "application/json",
            },
            data=json.dumps(payload),
            timeout=TIMEOUT_SECONDS,
        )
        if res.status_code not in (200, 201, 202):
            raise RuntimeError(f"Brevo menolak ({res.status_code}): {res.text[:200]}")
        return True
