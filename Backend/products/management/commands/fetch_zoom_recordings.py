"""Ambil link rekaman cloud Zoom dan isikan ke sesi yang sudah lewat.

Dijalankan cron tiap jam. Rekaman cloud tidak langsung jadi begitu meeting
bubar -- Zoom butuh waktu memproses -- jadi perintah ini menyapu berulang
sampai ketemu, lalu berhenti mencoba setelah beberapa hari.

Berlaku untuk DUA jenis sesi:
  - Mentoring: meeting-nya kita yang buat, jadi zoom_meeting_id sudah tersimpan.
  - Bootcamp:  link-nya ditempel manual admin, jadi ID meeting-nya dikorek dari
    URL. Tidak perlu kolom baru di model bootcamp -- selama meeting itu milik
    salah satu akun terdaftar, rekamannya tetap kebaca.

CATATAN PENTING: perintah ini TIDAK mengubah status sesi jadi 'completed'.
Status itu dipakai buat kelayakan refund commitment fee & penerbitan sertifikat,
jadi harus tetap keputusan sadar admin, bukan efek samping ada-tidaknya rekaman.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from mark_up.zoom import extract_meeting_id, get_recording_url
from products.models import BootcampSession, MentoringSession, ZoomAccount


class Command(BaseCommand):
    help = (
        "Isi recording_url sesi mentoring & bootcamp dari rekaman cloud Zoom. "
        "Default dry-run; pakai --execute buat menyimpan."
    )

    def add_arguments(self, parser):
        parser.add_argument("--execute", action="store_true",
                            help="Benar-benar menyimpan. Tanpa ini cuma laporan.")
        parser.add_argument("--days", type=int, default=7,
                            help="Sapu sesi yang selesai dalam N hari terakhir (default 7).")

    def handle(self, *args, **opts):
        execute = opts["execute"]
        sejak = timezone.now() - timedelta(days=opts["days"])
        # Beri jeda sesudah jam mulai supaya sesi yang baru saja/sedang berjalan
        # tidak ikut disapu percuma.
        sampai = timezone.now() - timedelta(minutes=30)

        akun = list(ZoomAccount.objects.all())
        if not akun:
            self.stdout.write(self.style.ERROR("Belum ada akun Zoom terdaftar."))
            return

        # Akun aktif dicoba lebih dulu; akun nonaktif tetap disertakan karena
        # rekaman meeting lama masih tersimpan di akun yang sudah dipensiunkan.
        akun.sort(key=lambda a: not a.is_active)

        total = 0
        total += self._sapu(
            "mentoring",
            MentoringSession.objects.filter(
                recording_url="",
                start_time__gte=sejak,
                start_time__lte=sampai,
                user_library__is_revoked=False,
            ).select_related("zoom_account", "user_library__user"),
            akun, execute,
        )
        total += self._sapu(
            "bootcamp",
            BootcampSession.objects.filter(
                recording_url="",
                start_time__gte=sejak,
                start_time__lte=sampai,
                user_library__is_revoked=False,
            ).exclude(meeting_link="").select_related("user_library__user"),
            akun, execute,
        )

        self.stdout.write(f"\nSelesai. {total} rekaman ditemukan.")
        if not execute:
            self.stdout.write(self.style.WARNING(
                "Ini baru dry-run. Jalankan ulang dengan --execute untuk menyimpan."
            ))

    def _sapu(self, jenis, antrean, semua_akun, execute):
        antrean = list(antrean)
        if not antrean:
            self.stdout.write(f"[{jenis}] tidak ada sesi yang menunggu rekaman.")
            return 0

        self.stdout.write(f"[{jenis}] {len(antrean)} sesi dicek...")

        # Satu meeting bootcamp dipakai banyak peserta (tiap peserta punya baris
        # sesi sendiri). Hasil per meeting di-cache supaya tidak menembak Zoom
        # berulang kali untuk ID yang sama.
        cache_meeting = {}
        ketemu = 0

        for sesi in antrean:
            mid = getattr(sesi, "zoom_meeting_id", "") or extract_meeting_id(
                getattr(sesi, "zoom_link", "") or getattr(sesi, "meeting_link", "")
            )
            if not mid:
                continue

            if mid in cache_meeting:
                url = cache_meeting[mid]
            else:
                url = None
                # Akun host-nya kalau tercatat; kalau tidak, coba semua akun.
                kandidat = semua_akun
                if getattr(sesi, "zoom_account_id", None):
                    kandidat = [sesi.zoom_account] + [
                        a for a in semua_akun if a.id != sesi.zoom_account_id
                    ]
                for a in kandidat:
                    url, err = get_recording_url(a, mid)
                    if err:
                        self.stdout.write(self.style.WARNING(f"    {a.label}: {err}"))
                        continue
                    if url:
                        break
                cache_meeting[mid] = url

            if not url:
                continue

            nama = sesi.user_library.user.fullname
            if execute:
                sesi.recording_url = url
                sesi.save(update_fields=["recording_url"])
                self.stdout.write(self.style.SUCCESS(f"    [OK] {nama} (meeting {mid})"))
            else:
                self.stdout.write(f"    [DRY-RUN] {nama} (meeting {mid}) -> {url[:70]}")
            ketemu += 1

        return ketemu
