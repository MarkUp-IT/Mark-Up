"""Bikin link Zoom otomatis buat sesi mentoring yang sudah terjadwal.

Dijalankan cron tiap 15 menit (lihat deploy/deploy.sh). Sengaja DI LUAR jalur
request: memanggil API pihak ketiga saat admin memverifikasi pembayaran itu
persis pola yang dulu bikin worker gunicorn mati kena timeout gara-gara SMTP.

Kenapa dibuat mepet (H-sekian jam, lihat settings.ZOOM_GENERATE_LEAD_HOURS),
bukan langsung pas sesi dijadwalkan/dibeli?
ZoomAccount gak nyimpen tanggal kedaluwarsa terstruktur (cuma is_active
manual) -- meeting yang dibuat jauh-jauh hari BERISIKO di-host akun yang
keburu dirotasi/dinonaktifkan admin sebelum hari-H, jadi linknya mati pas
peserta klik "Gabung Sesi". ZOOM_GENERATE_LEAD_HOURS dipatok sesuai masa
aktif langganan akun yang lagi dipakai (BUKAN "~2 minggu" tetap seperti
asumsi awal -- itu keliru, rotasinya tergantung durasi langganan yang
dibeli tiap kali, bisa 2 minggu bisa 3 bulan bisa lebih).

Aturan bentrok (diperbaiki Okt 2026): satu akun Zoom Pro cuma bisa menjalankan
SATU meeting dalam satu waktu, jadi dua sesi tidak boleh berbagi akun kalau
JAM INTI-nya beririsan. Waktu cadangan +30 menit TIDAK ikut dihitung bentrok --
dulu ikut dihitung (ditambah jeda 15 menit), akibatnya sesi 19:00-20:00 dianggap
bentrok dengan sesi 20:00 di akun yang sama dan sesi pertama tidak pernah dapat
link sama sekali. Sekarang cadangannya dipotong supaya tidak melewati sesi
berikutnya, dan setiap kegagalan langsung dilaporkan ke admin.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.utils import notify_user, tanggal_indo
from mark_up.emails import sekali
from mark_up.zoom import create_meeting, update_meeting
from products import kabar_mentoring
from products.models import MentoringSession, ZoomAccount


def durasi_inti(session):
    """Durasi mentoring sebenarnya (menit), tanpa waktu cadangan."""
    mentoring = getattr(session, "mentoring", None)
    return (mentoring.duration_minutes if mentoring and mentoring.duration_minutes else None) or 60


def jendela_inti(session):
    """[mulai, selesai) jam inti sesi -- dasar pengecekan bentrok antar-sesi."""
    return session.start_time, session.start_time + timedelta(minutes=durasi_inti(session))


def durasi_zoom(session, batas=None):
    """Durasi meeting Zoom = durasi mentoring + waktu cadangan
    (settings.ZOOM_EXTRA_MINUTES, default 30) supaya sesi yang molor sedikit
    tidak terpotong. Cuma Zoom-nya yang dipanjangkan, jadwal mentoringnya tidak.

    `batas` = jam mulai sesi berikutnya di akun Zoom yang sama (kalau ada):
    cadangannya dipotong supaya meeting tidak terjadwal melewati sesi itu.
    """
    inti = durasi_inti(session)
    total = inti + getattr(settings, "ZOOM_EXTRA_MINUTES", 30)
    if batas is not None:
        sisa = int((batas - session.start_time).total_seconds() // 60)
        total = max(inti, min(total, sisa))
    return total


def sesi_lain_di_akun(akun, kecuali_id):
    return MentoringSession.objects.filter(
        zoom_account=akun,
        start_time__isnull=False,
        status=MentoringSession.SessionStatus.SCHEDULED,
        user_library__is_revoked=False,
    ).exclude(id=kecuali_id).select_related("mentoring")


def sesi_berikutnya(akun, sesi):
    """Sesi terdekat SETELAH `sesi` yang memakai akun Zoom yang sama, atau None."""
    return sesi_lain_di_akun(akun, sesi.id).filter(start_time__gte=sesi.start_time).order_by("start_time").first()


class Command(BaseCommand):
    help = (
        "Bikin link Zoom untuk sesi mentoring terjadwal. Default dry-run; "
        "pakai --execute buat benar-benar membuat meeting."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute", action="store_true",
            help="Benar-benar membuat meeting di Zoom. Tanpa ini cuma laporan.",
        )
        parser.add_argument(
            "--session-id", default=None,
            help="Proses satu sesi saja, buat uji coba.",
        )
        parser.add_argument(
            "--perbarui-yang-ada", action="store_true",
            help="Terapkan pengaturan terbuka + durasi baru ke meeting yang SUDAH dibuat "
                 "untuk sesi mendatang, lalu selesai (tidak membuat meeting baru).",
        )
        parser.add_argument(
            "--lead-hours", type=int, default=None,
            help="Ambil sesi yang mulai dalam N jam ke depan (default dari settings).",
        )

    def handle(self, *args, **opts):
        execute = opts["execute"]
        lead = opts["lead_hours"] or getattr(settings, "ZOOM_GENERATE_LEAD_HOURS", 24)

        sekarang = timezone.now()
        batas = sekarang + timedelta(hours=lead)

        if opts["perbarui_yang_ada"]:
            return self._perbarui_yang_ada(sekarang, execute)

        antre = MentoringSession.objects.filter(
            status=MentoringSession.SessionStatus.SCHEDULED,
            zoom_link="",
            start_time__isnull=False,
            start_time__gt=sekarang,
            start_time__lte=batas,
            mentor__isnull=False,
            user_library__is_revoked=False,
        ).select_related("mentoring", "user_library__user", "mentor__user").order_by("start_time")

        if opts["session_id"]:
            antre = antre.filter(id=opts["session_id"])

        antre = list(antre)
        if not antre:
            self.stdout.write("Tidak ada sesi yang perlu dibuatkan link.")
            return

        akun_aktif = list(ZoomAccount.objects.filter(is_active=True))
        if not akun_aktif:
            pesan = ("Tidak ada akun Zoom aktif. Tambahkan lewat panel Akun Zoom, "
                     "atau tempel link manual di halaman pesanan mentoring.")
            self.stdout.write(self.style.ERROR(pesan))
            if execute:
                for sesi in antre:
                    self._gagal(sesi, pesan)
            return

        self.stdout.write(
            f"{len(antre)} sesi dalam {lead} jam ke depan, {len(akun_aktif)} akun aktif."
        )

        berhasil = gagal = 0
        for sesi in antre:
            akun = self._pilih_akun(akun_aktif, sesi)
            label = (
                f"{sesi.user_library.user.fullname} x {sesi.mentor.user.fullname} "
                f"({tanggal_indo(sesi.start_time)} WIB)"
            )

            if akun is None:
                pesan = (
                    "Semua akun Zoom sudah dipakai sesi lain yang jamnya beririsan. "
                    "Tambah akun Zoom kedua, atau tempel link manual."
                )
                self.stdout.write(self.style.WARNING(f"  [BENTROK] {label} -- {pesan}"))
                if execute:
                    self._gagal(sesi, pesan)
                gagal += 1
                continue

            berikutnya = sesi_berikutnya(akun, sesi)
            durasi = durasi_zoom(sesi, berikutnya.start_time if berikutnya else None)

            if not execute:
                self.stdout.write(f"  [DRY-RUN] {label} -> '{akun.label}', {durasi} menit")
                continue

            topik = f"Mentoring {sesi.mentoring.title} - Sesi {sesi.order}"
            hasil, err = create_meeting(akun, topik, sesi.start_time, durasi)
            if err:
                self.stdout.write(self.style.ERROR(f"  [GAGAL] {label} -- {err}"))
                self._gagal(sesi, err)
                gagal += 1
                continue

            sesi.zoom_link = hasil["join_url"]
            sesi.zoom_meeting_id = hasil["meeting_id"]
            sesi.zoom_account = akun
            sesi.zoom_generated_at = timezone.now()
            sesi.zoom_error = ""
            sesi.save(update_fields=[
                "zoom_link", "zoom_meeting_id", "zoom_account",
                "zoom_generated_at", "zoom_error",
            ])
            self.stdout.write(self.style.SUCCESS(f"  [OK] {label} -> {akun.label}, {durasi} menit"))
            berhasil += 1

            self._potong_sesi_sebelumnya(akun, sesi)
            self._kabari_link_siap(sesi, sekarang)

        self.stdout.write(f"\nSelesai. Berhasil: {berhasil}, gagal/bentrok: {gagal}.")
        if not execute:
            self.stdout.write(self.style.WARNING(
                "Ini baru dry-run. Jalankan ulang dengan --execute untuk menerapkan."
            ))

    # ------------------------------------------------------------------

    def _gagal(self, sesi, pesan):
        """Catat alasan gagal & kabari admin SEKALI per jadwal sesi -- dulu cuma
        tercatat di log dan admin baru tahu 3 jam sebelum sesi."""
        sesi.zoom_error = pesan[:500]
        sesi.save(update_fields=["zoom_error"])
        stempel = int(sesi.start_time.timestamp())
        if sekali(f"zoom_gagal@{stempel}", sesi.id, "tim"):
            kabar_mentoring.zoom_gagal_dibuat(sesi, pesan)

    def _kabari_link_siap(self, sesi, sekarang):
        """Sesi dekat (<= 24 jam) yang linknya baru jadi -> email + lonceng,
        karena pengingat yang sudah terkirim mungkin belum memuat link. Sesi
        yang masih jauh cukup lonceng; linknya ikut di email pengingat nanti."""
        if sesi.start_time - sekarang <= timedelta(hours=24):
            kabar_mentoring.link_zoom_siap(sesi)
            return
        mulai_str = tanggal_indo(sesi.start_time)
        notify_user(
            sesi.user_library.user,
            "Link Zoom Sesi Mentoring Siap",
            f"Link Zoom buat sesi mentoring \"{sesi.mentoring.title}\" (Sesi {sesi.order}) "
            f"pada {mulai_str} WIB sudah siap.",
            url=kabar_mentoring.url_produk(sesi),
        )
        notify_user(
            sesi.mentor.user,
            "Link Zoom Sesi Mentoring Siap",
            f"Link Zoom buat sesi mentoring bareng {sesi.user_library.user.fullname} "
            f"(\"{sesi.mentoring.title}\", Sesi {sesi.order}) pada {mulai_str} WIB sudah siap.",
            url="/mentor/mentoring-schedule",
        )

    def _potong_sesi_sebelumnya(self, akun, sesi):
        """Meeting sebelumnya di akun yang sama yang cadangannya melewati jam
        mulai sesi ini -> durasinya dipendekkan (best effort). Durasi di Zoom
        tidak memutus meeting, tapi kalender & catatan peserta jadi benar."""
        sebelumnya = sesi_lain_di_akun(akun, sesi.id).filter(
            start_time__lt=sesi.start_time).exclude(zoom_meeting_id="").order_by("-start_time").first()
        if not sebelumnya:
            return
        terjadwal_selesai = sebelumnya.start_time + timedelta(minutes=durasi_zoom(sebelumnya))
        if terjadwal_selesai <= sesi.start_time:
            return
        durasi_baru = durasi_zoom(sebelumnya, sesi.start_time)
        ok, err = update_meeting(akun, sebelumnya.zoom_meeting_id, durasi_baru)
        if not ok:
            self.stdout.write(self.style.WARNING(
                f"  [INFO] meeting {sebelumnya.zoom_meeting_id} gagal dipendekkan: {err}"))

    def _perbarui_yang_ada(self, sekarang, execute):
        sudah = list(MentoringSession.objects.filter(
            start_time__gt=sekarang, zoom_account__isnull=False,
        ).exclude(zoom_meeting_id="").select_related("mentoring", "zoom_account"))
        self.stdout.write(f"{len(sudah)} meeting mendatang akan diperbarui.")
        for sesi in sudah:
            berikutnya = sesi_berikutnya(sesi.zoom_account, sesi)
            durasi = durasi_zoom(sesi, berikutnya.start_time if berikutnya else None)
            if not execute:
                self.stdout.write(f"  [DRY-RUN] meeting {sesi.zoom_meeting_id} -> {durasi} menit, terbuka")
                continue
            ok, err = update_meeting(sesi.zoom_account, sesi.zoom_meeting_id, durasi)
            self.stdout.write(
                self.style.SUCCESS(f"  [OK] meeting {sesi.zoom_meeting_id}") if ok
                else self.style.ERROR(f"  [GAGAL] meeting {sesi.zoom_meeting_id} -- {err}")
            )

    def _pilih_akun(self, akun_aktif, sesi):
        """Akun pertama yang tidak punya sesi lain dengan JAM INTI beririsan.

        Pengecekan dilakukan ke database kita sendiri, bukan ke Zoom: sesi yang
        kita buat semuanya tercatat di sini, dan menanyakan Zoom satu per satu
        bakal lambat sekaligus boros kuota API.
        """
        mulai, selesai = jendela_inti(sesi)
        for akun in akun_aktif:
            bentrok = False
            for lain in sesi_lain_di_akun(akun, sesi.id).filter(start_time__lt=selesai):
                l_mulai, l_selesai = jendela_inti(lain)
                if l_mulai < selesai and l_selesai > mulai:
                    bentrok = True
                    break
            if not bentrok:
                return akun
        return None
