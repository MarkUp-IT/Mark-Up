"""Klien iPaymu REST API v2 (Redirect Payment).

Dipakai buat tiga hal:
  1. Bikin sesi pembayaran & redirect URL (create_payment_session) -- pembeli
     diarahkan ke halaman iPaymu sendiri, jadi MarkUp gak perlu bangun UI per
     metode (VA/QRIS/e-wallet/kartu), iPaymu yang tampilkan semua pilihan.
  2. Verifikasi signature webhook yang MASUK dari iPaymu (verify_webhook_signature).
  3. Uji kredensial dari panel admin (test_connection).

Kredensialnya disimpan di DATABASE (model transactions.IpaymuSetting), bukan
.env, karena bisa dirotasi (sandbox -> production) dari panel admin tanpa
redeploy. api_key dienkripsi dulu sebelum masuk DB.

Pola & kehati-hatian di sini meniru mark_up/zoom.py:
  - Semua panggilan jaringan pakai timeout, biar satu request yang menggantung
    gak menahan worker gunicorn selamanya.
  - Kegagalan dikembalikan sebagai (None, ..., pesan), bukan exception liar --
    satu percobaan bikin sesi yang gagal gak boleh bikin endpoint balik 500.

CATATAN buat implementasi lanjutan: casing field body request (product vs
Product, buyerName, dst) dan resep persis penyusunan data yang di-hash buat
signature callback MASUK belum 100% terverifikasi dari dokumentasi publik --
keduanya WAJIB dicocokkan ke panggilan sandbox sungguhan sebelum dipercaya di
production (lihat rencana verifikasi di plan). verify_webhook_signature
sengaja gagal TERTUTUP (return False) kalau ada apa pun yang meragukan.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import time
import uuid

from django.conf import settings

logger = logging.getLogger(__name__)

SANDBOX_BASE = "https://sandbox.ipaymu.com/api/v2"
PRODUCTION_BASE = "https://my.ipaymu.com/api/v2"

# Pembeli nunggu sinkron buat dapat redirect URL-nya -- jangan dinaikkan
# tanpa alasan, request yang menggantung menahan satu worker gunicorn.
TIMEOUT = 15

_EWALLET_CHANNELS = {"dana", "gopay", "ovo", "shopeepay", "linkaja", "jeniuspay", "airpay"}


# --------------------------------------------------------------------------
# Enkripsi kredensial -- persis pola mark_up/zoom.py, kunci beda (IPAYMU_CRED_KEY)
# --------------------------------------------------------------------------

class IpaymuCredentialError(Exception):
    """Kunci enkripsi belum disiapkan / kredensial gak bisa dibaca."""


def _fernet():
    key = (getattr(settings, "IPAYMU_CRED_KEY", "") or "").strip()
    if not key:
        raise IpaymuCredentialError(
            "IPAYMU_CRED_KEY belum diisi di .env, jadi kredensial iPaymu tidak bisa "
            "disimpan dengan aman. Bikin kuncinya sekali dengan: "
            "python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\""
        )
    from cryptography.fernet import Fernet

    try:
        return Fernet(key.encode())
    except Exception as exc:  # kunci salah format
        raise IpaymuCredentialError(f"IPAYMU_CRED_KEY tidak valid: {exc}") from exc


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    from cryptography.fernet import InvalidToken

    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise IpaymuCredentialError(
            "API Key tidak bisa didekripsi. Kemungkinan IPAYMU_CRED_KEY berubah "
            "setelah kredensial ini disimpan -- simpan ulang API Key-nya."
        ) from exc


# --------------------------------------------------------------------------
# Signature
# --------------------------------------------------------------------------

def _base_url(setting) -> str:
    return SANDBOX_BASE if setting.is_sandbox else PRODUCTION_BASE


def _signature(method: str, va: str, body_str: str, api_key: str) -> str:
    """stringToSign = METHOD:VA:sha256(body):APIKEY, lalu HMAC-SHA256 pakai
    APIKey sebagai kunci. `body_str` HARUS persis string yang benar-benar
    dikirim sebagai request body -- jangan pernah re-serialize (mis. lewat
    requests' json=...) setelah signature dihitung, urutan/spasi yang beda
    bikin signature tidak cocok lagi di sisi iPaymu."""
    body_hash = hashlib.sha256(body_str.encode()).hexdigest()
    string_to_sign = f"{method}:{va}:{body_hash}:{api_key}"
    return hmac.new(api_key.encode(), string_to_sign.encode(), hashlib.sha256).hexdigest()


def _pesan_error(resp, prefix):
    """Pesan error iPaymu yang enak dibaca admin, bukan dump JSON mentah."""
    try:
        body = resp.json()
        pesan = body.get("Message") or body.get("message") or resp.text[:200]
    except Exception:
        pesan = (resp.text or "")[:200]
    if resp.status_code == 401:
        pesan = f"{pesan} (kredensial salah, atau VA/API Key gak cocok sama mode sandbox/production yang dipilih)"
    return f"{prefix}: HTTP {resp.status_code} -- {pesan}"


def _product_title(product):
    """Judul produk buat ditampilkan iPaymu -- Product sendiri gak punya
    field title, judulnya ada di detail spesifik tipenya."""
    for attr in ("mentoring_detail", "module_detail", "bootcamp_detail"):
        detail = getattr(product, attr, None)
        if detail is not None:
            return detail.title
    return "Produk"


# --------------------------------------------------------------------------
# Bikin sesi pembayaran
# --------------------------------------------------------------------------

def _create_session_raw(setting, *, products, qtys, prices, descriptions, reference_id,
                         buyer_name, buyer_phone, buyer_email,
                         return_url, notify_url, cancel_url, expired_hours):
    """Inti pembuatan sesi, dipisah dari create_payment_session supaya
    test_connection bisa memakainya tanpa perlu bikin baris Transaction
    sungguhan di database cuma buat uji koneksi.

    Return (session_id, redirect_url, None) kalau berhasil,
    (None, None, pesan_error) kalau gagal -- gak pernah raise ke pemanggil."""
    import requests

    try:
        api_key = decrypt_secret(setting.api_key_encrypted)
    except IpaymuCredentialError as exc:
        return None, None, str(exc)
    if not setting.va_number or not api_key:
        return None, None, "VA Number / API Key iPaymu belum diisi di panel pengaturan."

    # paymentMethod/paymentChannel SENGAJA tidak diisi -- biar iPaymu
    # tampilkan semua metode yang tersedia di halamannya sendiri.
    body = {
        "product": list(products),
        "qty": list(qtys),
        "price": list(prices),
        "description": list(descriptions),
        "returnUrl": return_url,
        "notifyUrl": notify_url,
        "cancelUrl": cancel_url,
        "referenceId": reference_id,
        "buyerName": buyer_name or "",
        "buyerPhone": buyer_phone or "",
        "buyerEmail": buyer_email or "",
        "expired": expired_hours,
        "expiredType": "hours",
    }
    body_str = json.dumps(body, separators=(",", ":"))
    signature = _signature("POST", setting.va_number, body_str, api_key)

    try:
        resp = requests.post(
            f"{_base_url(setting)}/payment",
            data=body_str,
            headers={
                "Content-Type": "application/json",
                "va": setting.va_number,
                "signature": signature,
                "timestamp": str(int(time.time())),
            },
            timeout=TIMEOUT,
        )
    except Exception as exc:
        return None, None, f"Tidak bisa menghubungi iPaymu: {exc}"

    if resp.status_code != 200:
        return None, None, _pesan_error(resp, "Gagal membuat sesi pembayaran")

    try:
        payload = resp.json()
    except Exception:
        return None, None, "Respons iPaymu tidak bisa dibaca (bukan JSON)."

    data = payload.get("Data") or {}
    session_id = data.get("SessionID")
    url = data.get("Url")
    if not session_id or not url:
        pesan = payload.get("Message") or "iPaymu tidak mengembalikan SessionID/Url."
        return None, None, pesan
    return session_id, url, None


def create_payment_session(setting, *, transaction, buyer_name, buyer_phone, buyer_email,
                            return_url, notify_url, cancel_url, expired_hours):
    """Bikin sesi pembayaran buat satu Transaction sungguhan -- produk/qty/
    harga diambil dari TransactionItem miliknya, referenceId = transaction.id
    (sudah human-readable: TRX-YYYYMMDDHHMMSS-XXXXXX, ini yang dipakai
    webhook buat mencocokkan balik transaksinya)."""
    items = list(
        transaction.items.select_related(
            "product__mentoring_detail", "product__module_detail", "product__bootcamp_detail",
        )
    )
    if not items:
        return None, None, "Transaksi ini tidak punya item apa pun."

    titles = [_product_title(item.product) for item in items]
    return _create_session_raw(
        setting,
        products=titles,
        qtys=[item.quantity for item in items],
        prices=[int(item.price_at_checkout) for item in items],
        descriptions=titles,
        reference_id=transaction.id,
        buyer_name=buyer_name, buyer_phone=buyer_phone, buyer_email=buyer_email,
        return_url=return_url, notify_url=notify_url, cancel_url=cancel_url,
        expired_hours=expired_hours,
    )


# --------------------------------------------------------------------------
# Webhook masuk
# --------------------------------------------------------------------------

def verify_webhook_signature(setting, headers, raw_body: bytes) -> bool:
    """Prinsip: GAGAL TERTUTUP. Header hilang, format gak dikenal, exception
    apa pun -- balikin False, jangan pernah True secara default.

    Secret buat callback MASUK adalah va_number (BEDA dari signature
    keluar yang secretnya api_key) -- lihat catatan di kepala file soal
    resep ini masih perlu dicocokkan ke webhook sandbox sungguhan."""
    try:
        secret = (setting.va_number or "").strip()
        if not secret:
            return False
        header_sig = (
            headers.get("Signature")
            or headers.get("signature")
            or headers.get("X-Signature")
            or headers.get("x-signature")
        )
        if not header_sig:
            return False
        computed = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed.lower(), header_sig.strip().lower())
    except Exception:
        logger.exception("iPaymu: gagal saat verifikasi signature webhook.")
        return False


def map_via_channel_to_payment_method(via, channel):
    """Petakan `via`/`channel` dari webhook iPaymu ke PaymentMethod MarkUp.
    Tak dikenal -> BANK_TRANSFER + log, jangan pernah crash gara-gara
    channel baru yang belum dikenal."""
    from transactions.models import PaymentMethod  # lazy, hindari import melingkar

    via = (via or "").strip().lower()
    channel = (channel or "").strip().lower()

    if via == "qris" or channel == "qris":
        return PaymentMethod.QRIS
    if channel in _EWALLET_CHANNELS:
        return PaymentMethod.E_WALLET
    if via in ("cc", "creditcard", "kartu", "card"):
        return PaymentMethod.CREDIT_CARD
    if via in ("va", "banktransfer", "bank_transfer"):
        return PaymentMethod.BANK_TRANSFER

    logger.warning("iPaymu: via/channel tak dikenal (via=%s, channel=%s), default ke BANK_TRANSFER.", via, channel)
    return PaymentMethod.BANK_TRANSFER


# --------------------------------------------------------------------------
# Uji koneksi
# --------------------------------------------------------------------------

def test_connection(setting, *, notify_url):
    """{"ok": bool, "pesan": str, "url": str|None}.

    iPaymu gak punya endpoint "siapa saya" kayak Zoom -- satu-satunya cara
    membuktikan kredensial valid adalah beneran bikin sesi pembayaran kecil
    (~Rp10.000). referenceId diawali "TESTCONN-" supaya ipaymu_webhook bisa
    mengenali & mengabaikannya dengan aman kalau sesi ini beneran "dibayar"
    di sandbox -- lihat transactions/views.py::ipaymu_webhook."""
    reference_id = f"TESTCONN-{uuid.uuid4().hex[:10]}"
    placeholder = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/") or "https://mark-up.id"

    session_id, url, err = _create_session_raw(
        setting,
        products=["Uji Koneksi iPaymu"], qtys=[1], prices=[10000],
        descriptions=["Sesi uji dari panel pengaturan admin MarkUp -- aman diabaikan."],
        reference_id=reference_id,
        buyer_name="MarkUp Admin", buyer_phone="0800000000", buyer_email="admin@mark-up.id",
        return_url=placeholder, notify_url=notify_url, cancel_url=placeholder,
        expired_hours=1,
    )
    if err:
        return {"ok": False, "pesan": err, "url": None}
    return {
        "ok": True,
        "pesan": f"Sesi uji berhasil dibuat (referenceId={reference_id}). Kredensial valid.",
        "url": url,
    }
