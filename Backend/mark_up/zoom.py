"""Klien Zoom REST API (Server-to-Server OAuth).

Dipakai buat dua hal:
  1. Bikin meeting otomatis menjelang sesi mentoring (H-24 jam).
  2. Narik link rekaman cloud setelah sesi selesai.

Kredensialnya disimpan di DATABASE (model products.ZoomAccount), bukan .env,
karena akun Zoom-nya dirotasi berkala dan harus bisa diganti dari panel admin
tanpa redeploy. Karena itu client_secret dienkripsi dulu sebelum masuk DB.

Pola & kehati-hatian di sini mengikuti mark_up/email_backend.py:
  - Semua panggilan jaringan pakai timeout. Ini pelajaran dari SMTP yang pernah
    menggantung >2 menit sampai worker gunicorn mati dan aksi admin balik 500.
  - Kegagalan dikembalikan sebagai (None, pesan), bukan exception liar, supaya
    satu akun bermasalah gak merusak seluruh proses.
"""
from __future__ import annotations

import base64
import re
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache

OAUTH_URL = "https://zoom.us/oauth/token"
API_BASE = "https://api.zoom.us/v2"

# Semua panggilan ke Zoom dibatasi sekian detik. Jangan dinaikkan tanpa alasan:
# fungsi uji koneksi dipanggil dari request admin, dan request yang menggantung
# menahan satu worker gunicorn.
TIMEOUT = 10


# --------------------------------------------------------------------------
# Enkripsi kredensial
# --------------------------------------------------------------------------

class ZoomCredentialError(Exception):
    """Kunci enkripsi belum disiapkan / kredensial gak bisa dibaca."""


def _fernet():
    key = (getattr(settings, "ZOOM_CRED_KEY", "") or "").strip()
    if not key:
        raise ZoomCredentialError(
            "ZOOM_CRED_KEY belum diisi di .env, jadi kredensial Zoom tidak bisa "
            "disimpan dengan aman. Bikin kuncinya sekali dengan: "
            "python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )
    from cryptography.fernet import Fernet

    try:
        return Fernet(key.encode())
    except Exception as exc:  # kunci salah format
        raise ZoomCredentialError(f"ZOOM_CRED_KEY tidak valid: {exc}") from exc


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    from cryptography.fernet import InvalidToken

    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        # Paling sering kejadian kalau ZOOM_CRED_KEY diganti setelah kredensial
        # tersimpan. Pesannya dibikin spesifik supaya gak ditebak-tebak.
        raise ZoomCredentialError(
            "Client secret tidak bisa didekripsi. Kemungkinan ZOOM_CRED_KEY "
            "berubah setelah kredensial ini disimpan -- simpan ulang secret-nya."
        ) from exc


# --------------------------------------------------------------------------
# Token
# --------------------------------------------------------------------------

def _token_cache_key(account) -> str:
    return f"zoomtok:{account.pk}"


def get_token(account, force_refresh=False):
    """(token, None) atau (None, pesan_error).

    Token Zoom berlaku 1 jam. Di-cache 50 menit di Django cache -- produksi
    pakai DatabaseCache jadi memo ini kebagi ke semua worker gunicorn, sama
    seperti memoisasi presigned URL di mark_up/storage.py.
    """
    key = _token_cache_key(account)
    if not force_refresh:
        try:
            cached = cache.get(key)
            if cached:
                return cached, None
        except Exception:
            pass  # cache bermasalah -> ambil token baru, jangan gagal

    import requests

    try:
        secret = decrypt_secret(account.client_secret_encrypted)
    except ZoomCredentialError as exc:
        return None, str(exc)

    basic = base64.b64encode(
        f"{account.client_id}:{secret}".encode()
    ).decode()

    try:
        resp = requests.post(
            OAUTH_URL,
            params={
                "grant_type": "account_credentials",
                "account_id": account.account_id,
            },
            headers={"Authorization": f"Basic {basic}"},
            timeout=TIMEOUT,
        )
    except Exception as exc:
        return None, f"Tidak bisa menghubungi Zoom: {exc}"

    if resp.status_code != 200:
        return None, _pesan_error(resp, "Gagal mengambil token")

    data = resp.json()
    token = data.get("access_token")
    if not token:
        return None, "Zoom tidak mengembalikan access_token."

    try:
        cache.set(key, token, 3000)
    except Exception:
        pass
    return token, None


def _pesan_error(resp, prefix):
    """Pesan error Zoom yang enak dibaca admin, bukan dump JSON mentah."""
    try:
        body = resp.json()
        pesan = body.get("message") or body.get("error") or resp.text[:200]
    except Exception:
        pesan = (resp.text or "")[:200]
    if resp.status_code == 401:
        pesan = f"{pesan} (kredensial salah atau app-nya belum diaktifkan)"
    elif resp.status_code == 403:
        pesan = f"{pesan} (scope aplikasi Zoom kemungkinan kurang)"
    return f"{prefix}: HTTP {resp.status_code} -- {pesan}"


def _request(account, method, path, **kwargs):
    """Panggil API Zoom dengan token akun ini. Balikin (response, None) / (None, pesan).

    Kalau token cache ternyata sudah basi (401), sekali coba ulang dengan token
    baru -- token bisa dicabut dari sisi Zoom kapan saja.
    """
    import requests

    token, err = get_token(account)
    if err:
        return None, err

    url = f"{API_BASE}{path}"
    for percobaan in (1, 2):
        try:
            resp = requests.request(
                method,
                url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=TIMEOUT,
                **kwargs,
            )
        except Exception as exc:
            return None, f"Tidak bisa menghubungi Zoom: {exc}"

        if resp.status_code == 401 and percobaan == 1:
            token, err = get_token(account, force_refresh=True)
            if err:
                return None, err
            continue
        return resp, None
    return None, "Gagal memanggil Zoom."


# --------------------------------------------------------------------------
# Aksi
# --------------------------------------------------------------------------

def check_account(account):
    """Uji kredensial + lihat apakah akunnya sedang dipakai meeting live.

    Balikin dict siap tampil di panel admin.
    """
    resp, err = _request(account, "GET", "/users/me")
    if err:
        return {"ok": False, "pesan": err}
    if resp.status_code != 200:
        return {"ok": False, "pesan": _pesan_error(resp, "Akun tidak terbaca")}

    me = resp.json()
    tipe = {1: "Basic (gratis)", 2: "Licensed (berbayar)", 4: "On-prem"}.get(
        me.get("type"), f"tipe {me.get('type')}"
    )
    hasil = {
        "ok": True,
        "email": me.get("email", ""),
        "tipe_akun": tipe,
        "berbayar": me.get("type") == 2,
        "sedang_live": False,
        "pesan": "Kredensial valid.",
    }

    # Meeting yang sedang berlangsung -- ini yang dimaksud "lagi dipakai".
    live, err_live = _request(
        account, "GET", "/users/me/meetings", params={"type": "live"}
    )
    if not err_live and live.status_code == 200:
        daftar = live.json().get("meetings", [])
        hasil["sedang_live"] = bool(daftar)
        if daftar:
            hasil["pesan"] = f"Valid, tapi sedang ada {len(daftar)} meeting berlangsung."

    if not hasil["berbayar"]:
        hasil["pesan"] += (
            " Catatan: akun Basic tidak punya cloud recording, dan meeting "
            "3 orang atau lebih dibatasi 40 menit."
        )
    return hasil


def create_meeting(account, topic, start_time, duration_minutes):
    """Bikin meeting terjadwal. Balikin (dict, None) atau (None, pesan)."""
    payload = {
        "topic": topic[:200],
        "type": 2,  # scheduled meeting
        "start_time": start_time.astimezone(_utc()).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "duration": max(int(duration_minutes), 15),
        "timezone": "UTC",
        "settings": {
            # Ruang tunggu + host harus masuk duluan: link meeting kita simpan
            # di DB dan ditampilkan ke peserta, jadi jangan sampai orang yang
            # dapat link bisa nongkrong di ruangan tanpa mentor.
            "waiting_room": True,
            "join_before_host": False,
            "auto_recording": "cloud" if account.auto_record else "none",
        },
    }
    resp, err = _request(account, "POST", "/users/me/meetings", json=payload)
    if err:
        return None, err
    if resp.status_code not in (200, 201):
        return None, _pesan_error(resp, "Gagal membuat meeting")

    data = resp.json()
    join_url = data.get("join_url")
    if not join_url:
        return None, "Zoom tidak mengembalikan join_url."
    return {"meeting_id": str(data.get("id")), "join_url": join_url}, None


def delete_meeting(account, meeting_id):
    """Hapus meeting. 404 dianggap sukses -- targetnya memang sudah tidak ada."""
    resp, err = _request(account, "DELETE", f"/meetings/{meeting_id}")
    if err:
        return False, err
    if resp.status_code in (204, 200, 404):
        return True, None
    return False, _pesan_error(resp, "Gagal menghapus meeting")


def get_recording_url(account, meeting_id):
    """Link rekaman cloud sebuah meeting.

    Balikin (url, None) kalau ada, (None, None) kalau memang belum/tidak ada
    rekaman (bukan error -- rekaman butuh waktu proses setelah sesi bubar),
    atau (None, pesan) kalau beneran gagal.
    """
    resp, err = _request(account, "GET", f"/meetings/{meeting_id}/recordings")
    if err:
        return None, err
    if resp.status_code == 404:
        return None, None  # belum ada rekaman, atau meeting bukan milik akun ini
    if resp.status_code != 200:
        return None, _pesan_error(resp, "Gagal mengambil rekaman")

    data = resp.json()
    berkas = data.get("recording_files") or []
    siap = [f for f in berkas if (f.get("status") or "completed") == "completed"]
    if not siap:
        return None, None  # masih diproses Zoom

    share = data.get("share_url")
    if not share:
        # Cadangan: play_url berkas video kalau share_url tidak ada.
        video = next((f for f in siap if f.get("file_type") == "MP4"), siap[0])
        share = video.get("play_url") or video.get("download_url")
    if not share:
        return None, None

    # Passcode ditempelkan supaya link-nya langsung bisa dibuka peserta, sama
    # seperti link yang selama ini ditempel manual oleh admin. Konsekuensinya
    # siapa pun yang dapat URL ini bisa menonton -- lihat catatan di panel admin.
    sandi = data.get("password") or ""
    if sandi and "pwd=" not in share:
        share = f"{share}{'&' if '?' in share else '?'}pwd={sandi}"
    return share, None


# --------------------------------------------------------------------------
# Bantu
# --------------------------------------------------------------------------

def _utc():
    from datetime import timezone as _tz

    return _tz.utc


# zoom.us/j/85512345678 , zoom.us/w/8551234, us02web.zoom.us/j/855?pwd=...
_POLA_ID = re.compile(r"zoom\.us/(?:j|w|s)/(\d{9,12})", re.I)


def extract_meeting_id(link: str):
    """Ambil ID meeting dari URL Zoom biasa.

    Dipakai buat sesi yang link-nya ditempel manual (mis. sesi bootcamp):
    rekamannya tetap bisa ditarik otomatis selama meeting itu milik salah satu
    akun yang terdaftar, tanpa perlu menambah kolom baru di modelnya.
    """
    if not link:
        return None
    cocok = _POLA_ID.search(link)
    return cocok.group(1) if cocok else None
