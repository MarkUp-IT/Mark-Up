"""Isi semua kabar (lonceng + email) seputar mentoring, di satu tempat.

Dipanggil dari view (order lunas, jadwal dipilih/diubah, refund, link manual)
dan dari cron (pengingat, link Zoom, rekaman, sesi selesai, feedback).
Pengirimannya lewat mark_up.emails.kabari -- tiap email selalu punya
notifikasi web padanannya.

Latar belakang: mentoring yang sudah dibeli sempat banyak salah paham karena
pembeli & mentor tidak pernah dikabari lewat email (jadwal belum dipilih,
jam sesi, link Zoom). Modul ini menutup celah itu.
"""
from datetime import timedelta

from django.conf import settings

from accounts.utils import tanggal_indo
from mark_up.emails import kabari, kabari_tim, link_google_calendar, url_frontend

CATATAN_ZOOM = ("Ruang Zoom bisa langsung dimasuki lewat link tersebut tanpa menunggu host, "
                "dan sesi direkam otomatis.")


def _judul(session):
    return session.mentoring.title if session.mentoring_id else "Mentoring"


def _durasi(session):
    return (session.mentoring.duration_minutes if session.mentoring_id else None) or 60


def _rincian_sesi(session, untuk_mentor=False):
    pembeli = session.user_library.user
    rincian = [("Program", _judul(session)), ("Sesi", f"Sesi {session.order}")]
    if session.start_time:
        rincian.append(("Jadwal", f"{tanggal_indo(session.start_time)} WIB ({_durasi(session)} menit)"))
    if untuk_mentor:
        rincian.append(("Mentee", f"{pembeli.fullname} ({pembeli.email})"))
        if pembeli.phone:
            rincian.append(("WhatsApp mentee", pembeli.phone))
    elif session.mentor_id:
        rincian.append(("Mentor", session.mentor.user.fullname))
    if session.zoom_link:
        rincian.append(("Link Zoom", session.zoom_link))
    return rincian


def _kalender(session):
    if not session.start_time:
        return None
    return [("Tambahkan ke Google Calendar", link_google_calendar(
        f"Mentoring MARK-UP: {_judul(session)} (Sesi {session.order})",
        session.start_time, session.start_time + timedelta(minutes=_durasi(session)),
        detail=f"Link Zoom: {session.zoom_link}" if session.zoom_link else "Link Zoom tersedia di dashboard MARK-UP.",
        lokasi=session.zoom_link or "Zoom",
    ))]


def url_produk(session):
    return f"/user/my-products/{session.user_library.product_id}"


def url_feedback(session):
    """Halaman produk pembeli yang langsung membuka formulir feedback sesi ini."""
    return f"{url_produk(session)}?feedback={session.id}"


def _url_admin(session):
    return f"/admin/orders/mentoring/{session.user_library_id}"


def _label(session):
    mentor = session.mentor.user.fullname if session.mentor_id else "mentor belum dipilih"
    waktu = f"{tanggal_indo(session.start_time)} WIB" if session.start_time else "belum dijadwalkan"
    return f"{session.user_library.user.fullname} x {mentor} ({waktu})"


def _invoice(txn):
    from transactions.invoice import lampiran_invoice
    return lampiran_invoice(txn) if txn is not None else []


# ---------------------------------------------------------------- order

def order_lunas(txn, judul_produk, sesi_mentoring):
    """Konfirmasi pembayaran ke pembeli (semua jenis produk) + invoice PDF ke
    pembeli, tim MarkUp, dan mentor (untuk mentoring). `sesi_mentoring` = list
    MentoringSession dari transaksi ini (kosong kalau bukan mentoring)."""
    nominal = f"Rp {txn.grand_total:,.0f}".replace(",", ".")
    nama_produk = ", ".join(judul_produk) or txn.id
    lampiran = _invoice(txn)
    paragraf = [f"Pembayaran kamu sebesar {nominal} untuk \"{nama_produk}\" sudah kami terima. "
                f"Akses produknya sudah terbuka sekarang.",
                "Invoice pembayaranmu terlampir di email ini (PDF)."]
    rincian = [("No. Transaksi", txn.id), ("Total dibayar", nominal)]
    tombol = ("Lihat Invoice", f"/invoice/{txn.id}")

    terjadwal = [s for s in sesi_mentoring if s.start_time]
    belum = [s for s in sesi_mentoring if not s.start_time]
    for s in terjadwal:
        mentor = s.mentor.user.fullname if s.mentor_id else "-"
        rincian.append((f"Sesi {s.order}", f"{tanggal_indo(s.start_time)} WIB bersama {mentor}"))
    if terjadwal:
        paragraf.append("Link Zoom akan kami kirimkan lewat email pengingat sebelum sesi, dan selalu bisa "
                        "kamu lihat di halaman Produk Saya.")
    if belum:
        paragraf.append(
            f"Masih ada {len(belum)} sesi yang belum dijadwalkan. Silakan pilih "
            + ("mentor dan " if any(not s.mentor_id for s in belum) else "")
            + "jadwalnya di halaman Produk Saya supaya mentoring bisa segera dimulai."
        )
        tombol = ("Pilih Jadwal Mentoring", url_produk(belum[0]))

    kabari(
        txn.user, "Pembayaran Lunas",
        f"Pembayaran kamu sebesar {nominal} untuk \"{nama_produk}\" sudah dikonfirmasi. "
        f"Akses produknya sudah terbuka sekarang.",
        url="/user/transactions", paragraf=paragraf, rincian=rincian, tombol=tombol,
        tautan_tambahan=([("Lihat invoice", url_frontend(f"/invoice/{txn.id}"))] if belum else None),
        lampiran=lampiran,
    )

    # Mentor: booking baru + invoice (keputusan tim: mentor menerima invoice lengkap).
    if terjadwal and terjadwal[0].mentor_id:
        s = terjadwal[0]
        kabari(
            s.mentor.user, "Booking Baru",
            f"{txn.user.fullname} baru saja booking sesi \"{_judul(s)}\" pada {tanggal_indo(s.start_time)} WIB.",
            url="/mentor/mentoring-schedule",
            paragraf=[f"Ada booking mentoring baru untukmu dari {txn.user.fullname}. Invoice pemesanannya terlampir.",
                      "Link Zoom akan dikirim lewat email pengingat sebelum sesi dan tampil di dashboard mentor."],
            rincian=_rincian_sesi(s, untuk_mentor=True), tautan_tambahan=_kalender(s), lampiran=lampiran,
        )

    # Tim MarkUp: invoice tiap pembayaran lunas (lonceng admin sudah diisi alur
    # pembayarannya sendiri, jadi cukup email).
    rincian_tim = [("No. Transaksi", txn.id), ("Total", nominal), ("Pembeli", f"{txn.user.fullname} ({txn.user.email})"),
                   ("WhatsApp pembeli", txn.user.phone or "-")]
    paragraf_tim = f"Pembayaran \"{nama_produk}\" dari {txn.user.fullname} sudah lunas. Invoice terlampir."
    if sesi_mentoring:
        rincian_tim += [(f"Sesi {s.order}", (f"{tanggal_indo(s.start_time)} WIB" if s.start_time else "belum dijadwalkan")
                         + (f" - {s.mentor.user.fullname}" if s.mentor_id else " - mentor belum dipilih"))
                        for s in sesi_mentoring]
        if belum:
            paragraf_tim += f" {len(belum)} sesi BELUM dijadwalkan pembeli; sistem akan mengingatkan otomatis."
    kabari_tim(f"Pembayaran Lunas: {nama_produk}", paragraf_tim,
               url="/admin/orders/mentoring" if sesi_mentoring else "/admin/transactions",
               rincian=rincian_tim, lampiran=lampiran, lonceng=False)


# ---------------------------------------------------------------- jadwal

def jadwal_ditetapkan(session, jadwal_lama=None, mentor_baru=False):
    """Pembeli memilih / mengubah jadwal sebuah sesi -> kabari mentor & pembeli.
    `mentor_baru` = mentor baru saja dipilih pembeli (pembayaran yang
    dipulihkan) -> ini kontak pertama mentor dengan order ini, jadi invoice
    ikut dilampirkan seperti di "Booking Baru"."""
    pembeli = session.user_library.user
    diubah = jadwal_lama is not None
    waktu = f"{tanggal_indo(session.start_time)} WIB"
    lama = f" (sebelumnya {tanggal_indo(jadwal_lama)} WIB)" if diubah else ""
    lampiran = []
    if mentor_baru:
        from products.views import _transaksi_produk
        lampiran = _invoice(_transaksi_produk(session.user_library))
    kabari(
        session.mentor.user,
        "Jadwal Sesi Mentoring Diubah" if diubah else "Jadwal Sesi Mentoring Baru",
        f"{pembeli.fullname} " + ("mengubah jadwal" if diubah else "menjadwalkan")
        + f" sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) ke {waktu}.",
        url="/mentor/mentoring-schedule",
        paragraf=[f"{pembeli.fullname} " + ("mengubah jadwal" if diubah else "menjadwalkan")
                  + f" sesi mentoring bersamamu ke {waktu}{lama}."
                  + (" Invoice pemesanannya terlampir." if lampiran else ""),
                  "Link Zoom akan dikirim lewat email pengingat sebelum sesi dan tampil di dashboard mentor."],
        rincian=_rincian_sesi(session, untuk_mentor=True), tautan_tambahan=_kalender(session), lampiran=lampiran,
    )
    kabari(
        pembeli,
        "Jadwal Mentoring Diubah" if diubah else "Jadwal Mentoring Tersimpan",
        f"Sesi {session.order} \"{_judul(session)}\" dijadwalkan pada {waktu} bersama {session.mentor.user.fullname}.",
        url=url_produk(session),
        paragraf=[f"Jadwal Sesi {session.order} kamu sudah tersimpan: {waktu}{lama}.",
                  "Link Zoom akan kami kirim lewat email pengingat sebelum sesi, dan selalu bisa kamu lihat "
                  "di halaman Produk Saya."],
        rincian=_rincian_sesi(session), tautan_tambahan=_kalender(session),
    )


def sesi_dibatalkan(session, waktu, alasan="pembeli mengajukan refund dan sudah disetujui"):
    """Sesi terjadwal batal (refund) -> mentor harus tahu supaya tidak datang."""
    if not session.mentor_id:
        return
    pembeli = session.user_library.user
    kabari(
        session.mentor.user, "Sesi Mentoring Dibatalkan",
        f"Sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) bersama {pembeli.fullname} pada "
        f"{tanggal_indo(waktu)} WIB DIBATALKAN karena {alasan}.",
        url="/mentor/mentoring-schedule",
        paragraf=[f"Sesi mentoring bersama {pembeli.fullname} pada {tanggal_indo(waktu)} WIB dibatalkan "
                  f"karena {alasan}. Kamu tidak perlu hadir, dan slot jadwalmu sudah terbuka lagi."],
        rincian=[("Program", _judul(session)), ("Sesi", f"Sesi {session.order}")],
    )


# ---------------------------------------------------------------- Zoom

def link_zoom_siap(session, manual=False):
    """Link Zoom baru tersedia untuk sesi yang sudah dekat (dibuat cron
    belakangan, atau ditempel manual admin) -> kabari pembeli & mentor lewat
    email, karena pengingat yang sudah terkirim mungkin belum memuat link."""
    pembeli = session.user_library.user
    waktu = f"{tanggal_indo(session.start_time)} WIB"
    for penerima, ke_mentor, lawan in ((pembeli, False, session.mentor.user.fullname if session.mentor_id else "mentor"),
                                       (session.mentor.user if session.mentor_id else None, True, pembeli.fullname)):
        if penerima is None:
            continue
        kabari(
            penerima, "Link Zoom Mentoring Sudah Tersedia",
            f"Link Zoom sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) bersama {lawan} pada {waktu} "
            f"sudah tersedia.",
            url="/mentor/mentoring-schedule" if ke_mentor else url_produk(session),
            paragraf=[f"Link Zoom untuk sesi mentoring bersama {lawan} pada {waktu} sudah tersedia"
                      + (" (diperbarui oleh tim MARK-UP)." if manual else "."), CATATAN_ZOOM],
            rincian=_rincian_sesi(session, untuk_mentor=ke_mentor), tombol=("Gabung Zoom", session.zoom_link),
            tautan_tambahan=_kalender(session),
        )


def zoom_gagal_dibuat(session, alasan):
    """Link Zoom otomatis gagal dibuat -> admin dikabari SAAT ITU JUGA (dulu
    baru 3 jam sebelum sesi), lengkap dengan langkah yang bisa diambil."""
    kabari_tim(
        "Link Zoom Mentoring Gagal Dibuat",
        f"Link Zoom untuk sesi {_label(session)} gagal dibuat otomatis: {alasan} "
        f"Tambahkan akun Zoom kedua di panel Akun Zoom, atau tempel link manual di halaman pesanan mentoring "
        f"-- mentee & mentor akan langsung dikabari begitu link ditempel.",
        url=_url_admin(session),
    )


def konfirmasi_sesi_ke_admin(session, alasan):
    """Sesi yang jadwalnya sudah lewat tapi tidak bisa dipastikan berlangsung
    -> TIDAK ditandai selesai otomatis (honor mentor tidak terbit); admin
    diminta mengonfirmasi."""
    kabari_tim(
        "Konfirmasi Sesi Mentoring yang Sudah Lewat",
        f"Sesi {_label(session)} sudah lewat, tapi {alasan} Karena itu sesi TIDAK ditandai selesai otomatis dan "
        f"honor mentor belum terbit. Kalau sesi tetap berlangsung, tandai selesai di halaman pesanan; kalau tidak, "
        f"hubungi mentee untuk menjadwalkan ulang.",
        url=_url_admin(session),
    )


def _sesi_berikutnya_satu_akun(session):
    """Sesi lain yang memakai akun Zoom yang sama dan mulai selama waktu
    cadangan sesi ini -> mentor perlu tahu supaya mengakhiri tepat waktu
    (satu akun Zoom cuma bisa menjalankan satu meeting dalam satu waktu)."""
    if not session.zoom_account_id or not session.start_time:
        return None
    from products.models import MentoringSession

    batas = session.start_time + timedelta(minutes=_durasi(session) + getattr(settings, "ZOOM_EXTRA_MINUTES", 30))
    return MentoringSession.objects.filter(
        zoom_account_id=session.zoom_account_id,
        status=MentoringSession.SessionStatus.SCHEDULED,
        user_library__is_revoked=False,
        start_time__gt=session.start_time,
        start_time__lt=batas,
    ).exclude(id=session.id).order_by("start_time").first()


# ---------------------------------------------------------------- cron

def pengingat_sesi(session, jam, ke_mentor):
    """Pengingat H-24 / H-3 jam. `jam` cuma buat teks."""
    pembeli = session.user_library.user
    penerima = session.mentor.user if ke_mentor else pembeli
    lawan = pembeli.fullname if ke_mentor else session.mentor.user.fullname
    waktu = f"{tanggal_indo(session.start_time)} WIB"
    paragraf = [f"Pengingat: sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) bersama {lawan} "
                f"dimulai {jam} jam lagi, pada {waktu}."]
    if session.zoom_link:
        paragraf.append(CATATAN_ZOOM)
        tombol = ("Gabung Zoom", session.zoom_link)
        berikutnya = _sesi_berikutnya_satu_akun(session)
        if berikutnya is not None:
            selesai = session.start_time + timedelta(minutes=_durasi(session))
            jam_berikutnya = tanggal_indo(berikutnya.start_time).split(", ")[-1]
            paragraf.append(
                f"Penting: ruang Zoom ini dipakai sesi lain mulai pukul {jam_berikutnya} WIB. Mohon akhiri sesi "
                f"tepat waktu ({tanggal_indo(selesai).split(', ')[-1]} WIB) dan pastikan semua peserta keluar dari "
                f"meeting, supaya sesi berikutnya bisa dimulai."
            )
    else:
        paragraf.append("Link Zoom belum tersedia. Tim MARK-UP sedang menyiapkannya dan akan mengirimkannya "
                        "lewat email begitu siap.")
        tombol = ("Buka Dashboard", "/mentor/mentoring-schedule" if ke_mentor else url_produk(session))
    kabari(
        penerima, f"Pengingat: Mentoring {jam} Jam Lagi",
        f"Sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) bersama {lawan} dimulai pada {waktu}.",
        url="/mentor/mentoring-schedule" if ke_mentor else url_produk(session),
        paragraf=paragraf, rincian=_rincian_sesi(session, untuk_mentor=ke_mentor), tombol=tombol,
        tautan_tambahan=_kalender(session),
    )


def belum_pilih_jadwal(user_library, jumlah_sesi, hari):
    pembeli = user_library.user
    detail = user_library.product.mentoring_detail
    perlu_mentor = user_library.mentoring_sessions.filter(mentor__isnull=True).exists()
    apa = "mentor dan jadwal" if perlu_mentor else "jadwal"
    kabari(
        pembeli, "Mentoringmu Belum Dijadwalkan",
        f"Kamu masih punya {jumlah_sesi} sesi \"{detail.title}\" yang belum dijadwalkan. Yuk pilih {apa}-nya.",
        url=f"/user/my-products/{user_library.product_id}",
        paragraf=[f"Kamu sudah membeli \"{detail.title}\", tapi masih ada {jumlah_sesi} sesi yang belum "
                  f"dijadwalkan. Mentoring baru bisa berjalan setelah kamu memilih {apa}-nya.",
                  "Caranya: buka halaman Produk Saya, pilih program ini, lalu klik \"Pilih Jadwal\" di sesi "
                  "yang ingin kamu atur. Kalau ada kendala, balas email ini ya."],
        tombol=("Pilih Jadwal Sekarang", f"/user/my-products/{user_library.product_id}"),
    )


def rekaman_tersedia(session):
    pembeli = session.user_library.user
    pesan = f"Rekaman sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) sudah bisa ditonton."
    kabari(pembeli, "Rekaman Mentoring Tersedia", pesan, url=url_produk(session),
           paragraf=[pesan, "Rekamannya juga selalu bisa kamu buka dari halaman Produk Saya."],
           tombol=("Tonton Rekaman", session.recording_url))
    if session.mentor_id:
        kabari(session.mentor.user, "Rekaman Mentoring Tersedia",
               f"Rekaman sesi mentoring bersama {pembeli.fullname} (\"{_judul(session)}\", Sesi {session.order}) "
               f"sudah tersedia.", url="/mentor/active-classes",
               tombol=("Tonton Rekaman", session.recording_url))


# ---------------------------------------------------------------- feedback

def _langkah_berikutnya(session):
    """Kalimat ajakan lanjutan setelah sebuah sesi selesai, atau None."""
    from products.models import MentoringSession

    lain = list(session.user_library.mentoring_sessions.exclude(id=session.id))
    if all(x.status == MentoringSession.SessionStatus.COMPLETED for x in lain):
        return "Ini sesi terakhir di programmu. Setelah itu, kamu juga bisa memberi ulasan untuk program ini."
    if any(x.status == MentoringSession.SessionStatus.WAITING_SCHEDULE for x in lain) and not any(
            x.status == MentoringSession.SessionStatus.SCHEDULED for x in lain):
        return "Jangan lupa pilih jadwal sesi berikutnya di halaman Produk Saya."
    return None


def minta_feedback(session):
    """Sesi baru selesai -> minta mentee menilai sesi itu (lonceng + email)."""
    pembeli = session.user_library.user
    mentor = session.mentor.user.fullname if session.mentor_id else "mentor"
    paragraf = [f"Terima kasih sudah mengikuti Sesi {session.order} \"{_judul(session)}\" bersama {mentor}.",
                "Bagaimana sesinya? Beri penilaian singkat (1 menit) supaya kami bisa terus meningkatkan "
                "kualitas mentoring."]
    lanjut = _langkah_berikutnya(session)
    if lanjut:
        paragraf.append(lanjut)
    kabari(
        pembeli, "Bagaimana Sesi Mentoringmu?",
        f"Sesi {session.order} \"{_judul(session)}\" sudah selesai. Yuk beri penilaian untuk sesi ini.",
        url=url_feedback(session), paragraf=paragraf, tombol=("Beri Feedback", url_feedback(session)),
    )


def pengingat_feedback(session):
    pembeli = session.user_library.user
    kabari(
        pembeli, "Pengingat: Beri Feedback Sesi Mentoring",
        f"Kamu belum memberi penilaian untuk Sesi {session.order} \"{_judul(session)}\". Cuma butuh 1 menit.",
        url=url_feedback(session),
        paragraf=[f"Kami belum menerima penilaianmu untuk Sesi {session.order} \"{_judul(session)}\".",
                  "Masukanmu langsung kami sampaikan ke tim dan mentor supaya sesi berikutnya makin bermanfaat. "
                  "Cuma butuh 1 menit."],
        tombol=("Beri Feedback", url_feedback(session)),
    )
