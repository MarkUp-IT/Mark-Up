"""Email berdesain + satu pintu "kabari pengguna" (lonceng + email).

Kenapa ada modul ini: dulu tiap kejadian memilih sendiri mau kirim notifikasi
lonceng, email, atau dua-duanya -- hasilnya pembeli & mentor mentoring nyaris
tidak pernah dapat email, dan komunikasi jadwal bergantung pada chat manual.
Sekarang semua kabar ke pengguna lewat `kabari()`, jadi email dan notifikasi
web selalu berpasangan.

Pengiriman mengikuti pola accounts.utils.send_mail_async: di thread terpisah
dan tidak pernah menggagalkan aksi utama (SMTP/Brevo yang lambat pernah
membunuh worker gunicorn).
"""
from __future__ import annotations

import logging
import threading
from html import escape
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

WARNA = "#148F89"


def url_frontend(path: str) -> str:
    """Path frontend ('/user/my-products') -> URL lengkap buat dipasang di email."""
    if not path:
        return settings.FRONTEND_BASE_URL
    if path.startswith("http"):
        return path
    return settings.FRONTEND_BASE_URL.rstrip("/") + "/" + path.lstrip("/")


def link_google_calendar(judul, mulai, selesai, detail="", lokasi=""):
    """Link 'Tambahkan ke Google Calendar' (tanpa lampiran .ics)."""
    from datetime import timezone as tz

    fmt = "%Y%m%dT%H%M%SZ"
    return "https://calendar.google.com/calendar/render?" + urlencode({
        "action": "TEMPLATE",
        "text": judul,
        "dates": f"{mulai.astimezone(tz.utc).strftime(fmt)}/{selesai.astimezone(tz.utc).strftime(fmt)}",
        "details": detail,
        "location": lokasi,
    })


def _html(judul, paragraf, tombol, rincian, tautan_tambahan):
    baris = "".join(
        f'<tr><td style="padding:6px 0;color:#64748B;font-size:13px;width:38%;vertical-align:top">{escape(str(k))}</td>'
        f'<td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600">{escape(str(v))}</td></tr>'
        for k, v in (rincian or [])
    )
    tabel = (
        f'<table role="presentation" width="100%" style="border-collapse:collapse;background:#F8FAFC;'
        f'border:1px solid #E2E8F0;border-radius:8px;margin:18px 0"><tr><td style="padding:10px 16px">'
        f'<table role="presentation" width="100%" style="border-collapse:collapse">{baris}</table></td></tr></table>'
    ) if baris else ""
    isi = "".join(
        f'<p style="margin:0 0 14px;color:#334155;font-size:14px;line-height:1.6">{escape(p)}</p>'
        for p in paragraf
    )
    cta = (
        f'<p style="margin:22px 0 6px"><a href="{escape(tombol[1], quote=True)}" style="background:{WARNA};color:#FFFFFF;'
        f'text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;display:inline-block">'
        f'{escape(tombol[0])}</a></p>'
    ) if tombol else ""
    ekstra = "".join(
        f'<p style="margin:10px 0 0;font-size:13px"><a href="{escape(u, quote=True)}" style="color:{WARNA};font-weight:600">'
        f'{escape(t)}</a></p>'
        for t, u in (tautan_tambahan or [])
    )
    return (
        '<!doctype html><html><body style="margin:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif">'
        '<table role="presentation" width="100%" style="border-collapse:collapse;background:#F1F5F9"><tr><td align="center" style="padding:28px 12px">'
        '<table role="presentation" width="560" style="max-width:560px;width:100%;border-collapse:collapse;background:#FFFFFF;border-radius:12px;overflow:hidden">'
        f'<tr><td style="background:#140B22;padding:20px 28px;color:#FFFFFF;font-size:20px;font-weight:800;letter-spacing:1px">MARK-UP</td></tr>'
        f'<tr><td style="padding:28px"><h1 style="margin:0 0 16px;color:#0F172A;font-size:19px">{escape(judul)}</h1>'
        f'{isi}{tabel}{cta}{ekstra}</td></tr>'
        '<tr><td style="padding:18px 28px;background:#F8FAFC;color:#94A3B8;font-size:11.5px;line-height:1.6">'
        'Email ini dikirim otomatis oleh sistem MARK-UP. Ada pertanyaan? Balas email ini atau hubungi '
        'markup.ofc@gmail.com.</td></tr></table></td></tr></table></body></html>'
    )


def _teks(judul, paragraf, tombol, rincian, tautan_tambahan):
    bagian = [judul, ""] + list(paragraf)
    if rincian:
        bagian += [""] + [f"{k}: {v}" for k, v in rincian]
    if tombol:
        bagian += ["", f"{tombol[0]}: {tombol[1]}"]
    for t, u in (tautan_tambahan or []):
        bagian.append(f"{t}: {u}")
    return "\n".join(bagian)


def kirim_email(penerima, subjek, judul, paragraf, tombol=None, rincian=None, tautan_tambahan=None,
                lampiran=None):
    """Kirim satu email berdesain (HTML + teks) tanpa menahan request.

    penerima: alamat email atau list alamat. paragraf: str atau list str.
    tombol: (label, path_frontend_atau_url). rincian: list (label, nilai).
    tautan_tambahan: list (label, url) -- mis. link Google Calendar.
    lampiran: list (nama_file, bytes, mime) -- mis. PDF invoice.
    """
    if isinstance(penerima, str):
        penerima = [penerima]
    penerima = [p for p in penerima if p]
    if not penerima:
        return
    if isinstance(paragraf, str):
        paragraf = [paragraf]
    if tombol:
        tombol = (tombol[0], url_frontend(tombol[1]))

    pesan = EmailMultiAlternatives(
        subject=subjek,
        body=_teks(judul, paragraf, tombol, rincian, tautan_tambahan),
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=penerima,
        reply_to=[settings.TEAM_NOTIFICATION_EMAIL] if getattr(settings, "TEAM_NOTIFICATION_EMAIL", "") else None,
    )
    pesan.attach_alternative(_html(judul, paragraf, tombol, rincian, tautan_tambahan), "text/html")
    for nama_file, isi, mime in (lampiran or []):
        pesan.attach(nama_file, isi, mime)

    def _kirim():
        try:
            pesan.send(fail_silently=True)
        except Exception:
            logger.exception("Gagal kirim email '%s' ke %s", subjek, penerima)

    # Tes otomatis butuh hasil yang langsung terlihat di mail.outbox.
    if getattr(settings, "EMAIL_SINKRON", False):
        _kirim()
    else:
        threading.Thread(target=_kirim, daemon=True).start()


def kabari(user, judul, pesan, url="", *, paragraf=None, tombol=None, rincian=None, tautan_tambahan=None,
           email=True, lampiran=None):
    """SATU pintu kabar ke pengguna: notifikasi lonceng + email berpasangan.

    `pesan` = teks ringkas buat lonceng (dan isi email kalau `paragraf` kosong).
    `tombol` default-nya mengarah ke `url` yang sama dengan lonceng.
    """
    from accounts.utils import notify_user

    notify_user(user, judul, pesan, url=url)
    if email and getattr(user, "email", ""):
        if tombol is None and url:
            tombol = ("Buka di MARK-UP", url)
        nama = (getattr(user, "fullname", "") or "").split(" ")[0]
        isi = list(paragraf) if paragraf else [pesan]
        kirim_email(user.email, f"[MARK-UP] {judul}", judul,
                    ([f"Halo {nama},"] if nama else []) + isi,
                    tombol=tombol, rincian=rincian, tautan_tambahan=tautan_tambahan, lampiran=lampiran)


def kabari_tim(judul, pesan, url="", rincian=None, lampiran=None, lonceng=True):
    """Kabar ke tim MarkUp: lonceng semua admin + email ke inbox tim.
    lonceng=False -> cukup email (mis. invoice, yang lonceng admin-nya sudah
    diisi alur pembayaran sendiri)."""
    from accounts.utils import notify_admins

    if lonceng:
        notify_admins(judul, pesan, url=url)
    kirim_email(getattr(settings, "TEAM_NOTIFICATION_EMAIL", ""), f"[MARK-UP] {judul}", judul, [pesan],
                tombol=("Buka Dashboard Admin", url) if url else None, rincian=rincian, lampiran=lampiran)


def sekali(jenis, objek_id, penerima="") -> bool:
    """True kalau kabar (jenis, objek, penerima) ini BELUM pernah dikirim --
    sekaligus mencatatnya. Dipakai cron pengingat supaya tidak ada yang
    terkirim dobel walau cron jalan berulang / dua proses bersamaan."""
    from accounts.models import PesanTerkirim

    # get_or_create (bukan create + tangkap IntegrityError): aman dipanggil di
    # dalam transaksi yang sedang berjalan.
    _, baru = PesanTerkirim.objects.get_or_create(
        jenis=jenis, objek_id=str(objek_id), penerima=str(penerima)[:254],
    )
    return baru
