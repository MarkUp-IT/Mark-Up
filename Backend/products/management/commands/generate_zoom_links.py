"""Bikin link Zoom otomatis buat sesi mentoring yang sudah dekat.

Dijalankan cron tiap 15 menit (lihat deploy/deploy.sh). Sengaja DI LUAR jalur
request: memanggil API pihak ketiga saat admin memverifikasi pembayaran itu
persis pola yang dulu bikin worker gunicorn mati kena timeout gara-gara SMTP.

Kenapa dibuat mepet (H-24 jam), bukan pas sesi dijadwalkan?
Akun Zoom-nya dirotasi ~2 minggu sekali. Meeting yang dibuat jauh-jauh hari
bakal di-host akun yang sudah tidak dipakai lagi -- peserta klik "Gabung Sesi"
pas hari-H, link-nya mati. Dibuat menjelang sesi berarti selalu memakai akun
yang benar-benar aktif saat itu.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from mark_up.zoom import create_meeting
from products.models import MentoringSession, ZoomAccount


def jendela_pakai(session, buffer_menit):
    """Rentang waktu sebuah sesi 'menguasai' satu akun Zoom.

    Satu akun cuma bisa meng-host SATU meeting live dalam satu waktu, jadi
    rentang ini yang dipakai buat mendeteksi bentrok. Diberi bantalan supaya
    sesi yang mepet-mepetan tidak saling tabrak.
    """
    durasi = 60
    mentoring = getattr(session, "mentoring", None)
    if mentoring and mentoring.duration_minutes:
        durasi = mentoring.duration_minutes
    mulai = session.start_time
    return mulai, mulai + timedelta(minutes=durasi + buffer_menit)


class Command(BaseCommand):
    help = (
        "Bikin link Zoom untuk sesi mentoring yang mulai dalam beberapa jam ke "
        "depan. Default dry-run; pakai --execute buat benar-benar membuat meeting."
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
            "--lead-hours", type=int, default=None,
            help="Ambil sesi yang mulai dalam N jam ke depan (default dari settings).",
        )

    def handle(self, *args, **opts):
        execute = opts["execute"]
        lead = opts["lead_hours"] or getattr(settings, "ZOOM_GENERATE_LEAD_HOURS", 24)
        buffer_menit = getattr(settings, "ZOOM_BUFFER_MINUTES", 15)

        sekarang = timezone.now()
        batas = sekarang + timedelta(hours=lead)

        antre = MentoringSession.objects.filter(
            status=MentoringSession.SessionStatus.SCHEDULED,
            zoom_link="",
            start_time__isnull=False,
            start_time__gt=sekarang,
            start_time__lte=batas,
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
            self.stdout.write(self.style.ERROR(
                "Tidak ada akun Zoom aktif. Tambahkan lewat Pengaturan admin, "
                "atau tempel link manual di halaman pesanan mentoring."
            ))
            return

        self.stdout.write(
            f"{len(antre)} sesi dalam {lead} jam ke depan, {len(akun_aktif)} akun aktif."
        )

        berhasil = gagal = 0
        for sesi in antre:
            mulai, selesai = jendela_pakai(sesi, buffer_menit)
            akun = self._pilih_akun(akun_aktif, sesi, mulai, selesai, buffer_menit)

            label = (
                f"{sesi.user_library.user.fullname} x {sesi.mentor.user.fullname} "
                f"({mulai:%d %b %H:%M})"
            )

            if akun is None:
                pesan = (
                    "Semua akun Zoom sudah dipakai meeting lain di jam ini. "
                    "Tambah akun, atau tempel link manual."
                )
                self.stdout.write(self.style.WARNING(f"  [BENTROK] {label} -- {pesan}"))
                if execute:
                    sesi.zoom_error = pesan
                    sesi.save(update_fields=["zoom_error"])
                gagal += 1
                continue

            if not execute:
                self.stdout.write(f"  [DRY-RUN] {label} -> akan pakai '{akun.label}'")
                continue

            topik = f"Mentoring {sesi.mentoring.title} - Sesi {sesi.order}"
            durasi = int((selesai - mulai).total_seconds() // 60) - buffer_menit
            hasil, err = create_meeting(akun, topik, mulai, durasi)
            if err:
                self.stdout.write(self.style.ERROR(f"  [GAGAL] {label} -- {err}"))
                sesi.zoom_error = err[:500]
                sesi.save(update_fields=["zoom_error"])
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
            self.stdout.write(self.style.SUCCESS(f"  [OK] {label} -> {akun.label}"))
            berhasil += 1

        self.stdout.write(f"\nSelesai. Berhasil: {berhasil}, gagal/bentrok: {gagal}.")
        if not execute:
            self.stdout.write(self.style.WARNING(
                "Ini baru dry-run. Jalankan ulang dengan --execute untuk menerapkan."
            ))

    def _pilih_akun(self, akun_aktif, sesi, mulai, selesai, buffer_menit):
        """Akun pertama yang tidak punya sesi lain beririsan jamnya.

        Pengecekan dilakukan ke database kita sendiri, bukan ke Zoom: sesi yang
        kita buat semuanya tercatat di sini, dan menanyakan Zoom satu per satu
        bakal lambat sekaligus boros kuota API.
        """
        for akun in akun_aktif:
            tetangga = MentoringSession.objects.filter(
                zoom_account=akun,
                start_time__isnull=False,
                start_time__lt=selesai,
            ).exclude(id=sesi.id).select_related("mentoring")

            bentrok = False
            for lain in tetangga:
                l_mulai, l_selesai = jendela_pakai(lain, buffer_menit)
                if l_selesai > mulai:   # dua rentang beririsan
                    bentrok = True
                    break
            if not bentrok:
                return akun
        return None
