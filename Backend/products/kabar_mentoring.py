"""Isi semua kabar (lonceng + email) seputar mentoring, di satu tempat.

Dipanggil dari view (order lunas, jadwal dipilih/diubah, refund) dan dari
cron (pengingat, rekaman tersedia, sesi selesai otomatis). Pengirimannya
lewat mark_up.emails.kabari -- tiap email selalu punya notifikasi web
padanannya.

Latar belakang: mentoring yang sudah dibeli sempat banyak salah paham karena
pembeli & mentor tidak pernah dikabari lewat email (jadwal belum dipilih,
jam sesi, link Zoom). Modul ini menutup celah itu.
"""
from datetime import timedelta

from django.conf import settings

from accounts.utils import tanggal_indo
from mark_up.emails import kabari, kirim_email, link_google_calendar, url_frontend

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


# ---------------------------------------------------------------- order

def order_lunas(txn, judul_produk, sesi_mentoring):
    """Konfirmasi pembayaran ke pembeli (semua jenis produk) + kabar order
    mentoring ke mentor & tim. `sesi_mentoring` = list MentoringSession yang
    baru dibuat dari transaksi ini (kosong kalau bukan mentoring)."""
    nominal = f"Rp {txn.grand_total:,.0f}".replace(",", ".")
    nama_produk = ", ".join(judul_produk) or txn.id
    paragraf = [f"Pembayaran kamu sebesar {nominal} untuk \"{nama_produk}\" sudah kami terima. "
                f"Akses produknya sudah terbuka sekarang."]
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
    )

    if not sesi_mentoring:
        return
    pertama = sesi_mentoring[0]
    if terjadwal and terjadwal[0].mentor_id:
        s = terjadwal[0]
        kabari(
            s.mentor.user, "Booking Baru",
            f"{txn.user.fullname} baru saja booking sesi \"{_judul(s)}\" pada {tanggal_indo(s.start_time)} WIB.",
            url="/mentor/mentoring-schedule",
            paragraf=[f"Ada booking mentoring baru untukmu dari {txn.user.fullname}.",
                      "Link Zoom akan dikirim lewat email pengingat sebelum sesi dan tampil di dashboard mentor."],
            rincian=_rincian_sesi(s, untuk_mentor=True), tautan_tambahan=_kalender(s),
        )
    # Tim: cukup email (lonceng admin sudah diisi alur pembayarannya sendiri).
    kirim_email(
        getattr(settings, "TEAM_NOTIFICATION_EMAIL", ""),
        f"[MARK-UP] Order mentoring lunas: {_judul(pertama)}", "Order Mentoring Lunas",
        [f"{txn.user.fullname} ({txn.user.email}) membeli \"{_judul(pertama)}\" dan pembayarannya sudah lunas.",
         "Semua sesi sudah terjadwal." if not belum else
         f"{len(belum)} sesi BELUM dijadwalkan pembeli. Sistem akan mengingatkan pembeli otomatis."],
        tombol=("Buka Pesanan Mentoring", "/admin/orders/mentoring"),
        rincian=[("No. Transaksi", txn.id), ("Total", nominal), ("WhatsApp pembeli", txn.user.phone or "-")]
        + [(f"Sesi {s.order}", (f"{tanggal_indo(s.start_time)} WIB" if s.start_time else "belum dijadwalkan")
            + (f" - {s.mentor.user.fullname}" if s.mentor_id else " - mentor belum dipilih")) for s in sesi_mentoring],
    )


# ---------------------------------------------------------------- jadwal

def jadwal_ditetapkan(session, jadwal_lama=None):
    """Pembeli memilih / mengubah jadwal sebuah sesi -> kabari mentor & pembeli."""
    pembeli = session.user_library.user
    diubah = jadwal_lama is not None
    waktu = f"{tanggal_indo(session.start_time)} WIB"
    lama = f" (sebelumnya {tanggal_indo(jadwal_lama)} WIB)" if diubah else ""
    kabari(
        session.mentor.user,
        "Jadwal Sesi Mentoring Diubah" if diubah else "Jadwal Sesi Mentoring Baru",
        f"{pembeli.fullname} " + ("mengubah jadwal" if diubah else "menjadwalkan")
        + f" sesi mentoring \"{_judul(session)}\" (Sesi {session.order}) ke {waktu}.",
        url="/mentor/mentoring-schedule",
        paragraf=[f"{pembeli.fullname} " + ("mengubah jadwal" if diubah else "menjadwalkan")
                  + f" sesi mentoring bersamamu ke {waktu}{lama}.",
                  "Link Zoom akan dikirim lewat email pengingat sebelum sesi dan tampil di dashboard mentor."],
        rincian=_rincian_sesi(session, untuk_mentor=True), tautan_tambahan=_kalender(session),
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
    else:
        paragraf.append("Link Zoom sedang disiapkan dan akan tampil di dashboard MARK-UP.")
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


def sesi_selesai(session, semua_selesai, ada_yang_belum_dijadwalkan):
    """Sesi ditandai selesai otomatis -> ajak pembeli memberi rating / lanjut
    menjadwalkan sesi berikutnya."""
    pembeli = session.user_library.user
    if semua_selesai:
        kabari(pembeli, "Mentoring Selesai, Beri Penilaianmu",
               f"Semua sesi \"{_judul(session)}\" sudah selesai. Yuk beri rating dan ulasan untuk mentormu.",
               url=url_produk(session), tombol=("Beri Rating", url_produk(session)))
    elif ada_yang_belum_dijadwalkan:
        kabari(pembeli, "Sesi Selesai, Jadwalkan Sesi Berikutnya",
               f"Sesi {session.order} \"{_judul(session)}\" sudah selesai. Jangan lupa pilih jadwal sesi berikutnya.",
               url=url_produk(session), tombol=("Pilih Jadwal Berikutnya", url_produk(session)))
