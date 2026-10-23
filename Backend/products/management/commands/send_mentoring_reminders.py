"""Pengingat mentoring otomatis + penyelesaian sesi otomatis.

Dijalankan cron tiap 10 menit. Semua pengiriman dicatat di
accounts.PesanTerkirim (lewat mark_up.emails.sekali), jadi aman dijalankan
berulang: tiap kabar hanya terkirim sekali per sesi per penerima.

Yang dikerjakan:
  1. Pengingat sesi: H-24 jam ke pembeli; H-3 jam ke pembeli DAN mentor
     (berisi link Zoom). Sesi yang 3 jam lagi mulai tapi belum punya link
     Zoom dilaporkan ke admin.
  2. Pengingat "belum pilih jadwal": pembeli yang sudah bayar tapi masih
     punya sesi tanpa jadwal -- hari ke-1, 3, 7 sejak pembelian. Admin ikut
     dikabari di hari ke-3 dan ke-7 untuk follow up manual.
  3. Sesi yang jadwalnya sudah lewat ditandai selesai (honor mentor terbit)
     -- HANYA kalau meeting-nya terbukti berlangsung (tercatat di Zoom, atau
     link ditempel manual admin). Sesi tanpa link / meeting yang tidak pernah
     dimulai TIDAK diselesaikan; admin diminta konfirmasi. Lalu mentee diminta
     feedback untuk sesi itu.
  4. Pengingat feedback: sekali, 24 jam setelah diminta, kalau belum diisi.
  5. Cek paket akun Zoom (Pro/gratis) sekali sehari.

Kunci pengingat sesi memuat jam mulai sesi (mis. "pengingat_h3@1729425600"),
jadi sesi yang dijadwal ulang diingatkan lagi untuk jadwal barunya -- dulu
kuncinya cuma ID sesi, sehingga sesi yang dipindah jadwal tidak pernah
diingatkan lagi.
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.utils import tanggal_indo
from mark_up.emails import kabari_tim, sekali
from products import kabar_mentoring
from products.models import MentoringSession, ProductType, UserLibrary

HARI_PENGINGAT_JADWAL = (1, 3, 7)
HARI_KABARI_ADMIN = (3, 7)


class Command(BaseCommand):
    help = (
        "Kirim pengingat mentoring & tandai sesi yang sudah lewat sebagai selesai. "
        "Default dry-run; pakai --execute buat benar-benar mengirim/menyimpan."
    )

    def add_arguments(self, parser):
        parser.add_argument("--execute", action="store_true",
                            help="Benar-benar mengirim & menyimpan. Tanpa ini cuma laporan.")

    def handle(self, *args, **opts):
        self.execute = opts["execute"]
        self.sekarang = timezone.now()
        n = (self._pengingat_sesi() + self._belum_pilih_jadwal() + self._selesaikan_otomatis()
             + self._pengingat_feedback() + self._cek_akun_zoom())
        self.stdout.write(f"Selesai. {n} tindakan" + ("" if self.execute else " (dry-run, tidak ada yang dikirim)") + ".")

    def _lakukan(self, jenis, objek_id, penerima, label, aksi):
        """Jalankan `aksi` sekali saja untuk (jenis, objek, penerima)."""
        if not self.execute:
            # Yang sudah pernah terkirim tidak ikut didaftar -- dulu dry-run
            # menampilkannya lagi sehingga terlihat seolah akan dikirim ulang.
            if self._sudah_pernah_ke(jenis, objek_id, penerima):
                return 0
            self.stdout.write(f"  [DRY-RUN] {label}")
            return 1
        if not sekali(jenis, objek_id, penerima):
            return 0
        try:
            aksi()
        except Exception as exc:  # satu kegagalan tidak boleh menghentikan sisanya
            self.stdout.write(self.style.ERROR(f"  [GAGAL] {label} -- {exc}"))
            return 0
        self.stdout.write(self.style.SUCCESS(f"  [OK] {label}"))
        return 1

    # ------------------------------------------------------------ 1

    def _pengingat_sesi(self):
        n = 0
        mendatang = MentoringSession.objects.filter(
            status=MentoringSession.SessionStatus.SCHEDULED,
            start_time__gt=self.sekarang,
            start_time__lte=self.sekarang + timedelta(hours=24),
            mentor__isnull=False,
            user_library__is_revoked=False,
        ).select_related("mentoring", "mentor__user", "user_library__user")

        for s in mendatang:
            sisa = s.start_time - self.sekarang
            pembeli = s.user_library.user
            label = f"{pembeli.fullname} x {s.mentor.user.fullname} ({tanggal_indo(s.start_time)})"
            stempel = int(s.start_time.timestamp())
            if sisa <= timedelta(hours=3):
                n += self._lakukan(f"pengingat_h3@{stempel}", s.id, pembeli.email, f"H-3 pembeli: {label}",
                                   lambda s=s: kabar_mentoring.pengingat_sesi(s, 3, ke_mentor=False))
                n += self._lakukan(f"pengingat_h3@{stempel}", s.id, s.mentor.user.email, f"H-3 mentor: {label}",
                                   lambda s=s: kabar_mentoring.pengingat_sesi(s, 3, ke_mentor=True))
                if not s.zoom_link:
                    n += self._lakukan(
                        f"zoom_belum_ada@{stempel}", s.id, "tim", f"Zoom belum ada: {label}",
                        lambda s=s, label=label: kabari_tim(
                            "Sesi Mentoring Belum Punya Link Zoom",
                            f"Sesi {label} dimulai kurang dari 3 jam lagi tapi belum punya link Zoom"
                            + (f" ({s.zoom_error})" if s.zoom_error else "")
                            + ". Tempel link manual di halaman pesanan mentoring.",
                            url=f"/admin/orders/mentoring/{s.user_library_id}",
                        ))
            # H-24 cuma kalau sesinya memang masih jauh (dijadwalkan mepet
            # -> langsung dapat H-3 saja, tidak dua email beruntun).
            elif sisa > timedelta(hours=20):
                n += self._lakukan(f"pengingat_h24@{stempel}", s.id, pembeli.email, f"H-24 pembeli: {label}",
                                   lambda s=s: kabar_mentoring.pengingat_sesi(s, 24, ke_mentor=False))
        return n

    # ------------------------------------------------------------ 2

    def _belum_pilih_jadwal(self):
        n = 0
        akses = UserLibrary.objects.filter(
            product__type=ProductType.MENTORING, is_revoked=False,
            mentoring_sessions__status=MentoringSession.SessionStatus.WAITING_SCHEDULE,
        ).distinct().select_related("user", "product__mentoring_detail")

        for lib in akses:
            sesi = list(lib.mentoring_sessions.all())
            # Paket multi-sesi dijadwalkan berurutan: kalau masih ada sesi
            # terjadwal yang belum berlangsung, pembeli memang belum perlu
            # memilih sesi berikutnya -- jangan diganggu.
            if any(x.status == MentoringSession.SessionStatus.SCHEDULED for x in sesi):
                continue
            belum = [x for x in sesi if x.status == MentoringSession.SessionStatus.WAITING_SCHEDULE]
            # Dihitung dari kapan pembeli MULAI bisa menjadwalkan: tanggal
            # beli, atau kapan sesi sebelumnya selesai (pakai catatan
            # penyelesaian otomatis kalau ada).
            hari = (self.sekarang - self._mulai_menunggu(lib)).days
            jatuh_tempo = [h for h in HARI_PENGINGAT_JADWAL if h <= hari]
            if not jatuh_tempo:
                continue
            h = jatuh_tempo[-1]
            # Kalau cron sempat mati beberapa hari, cukup kirim pengingat
            # tahap terakhir yang jatuh tempo, bukan semuanya sekaligus.
            label = f"{lib.user.fullname} - {lib.product.mentoring_detail.title} (hari ke-{h}, {len(belum)} sesi)"
            n += self._lakukan(f"belum_jadwal_h{h}", lib.id, lib.user.email, f"Belum pilih jadwal: {label}",
                               lambda lib=lib, belum=belum, h=h: kabar_mentoring.belum_pilih_jadwal(lib, len(belum), h))
            if h in HARI_KABARI_ADMIN:
                n += self._lakukan(
                    f"belum_jadwal_admin_h{h}", lib.id, "tim", f"Kabari admin: {label}",
                    lambda lib=lib, belum=belum, h=h: kabari_tim(
                        "Pembeli Mentoring Belum Memilih Jadwal",
                        f"{lib.user.fullname} ({lib.user.email}, WA {lib.user.phone or '-'}) sudah {h} hari belum "
                        f"menjadwalkan {len(belum)} sesi \"{lib.product.mentoring_detail.title}\". Sudah diingatkan "
                        f"otomatis lewat email; mohon dihubungi langsung.",
                        url=f"/admin/orders/mentoring/{lib.id}",
                    ))
        return n

    def _mulai_menunggu(self, lib):
        from accounts.models import PesanTerkirim

        selesai_ids = [str(i) for i in lib.mentoring_sessions.filter(
            status=MentoringSession.SessionStatus.COMPLETED).values_list("id", flat=True)]
        terakhir = PesanTerkirim.objects.filter(
            jenis="sesi_selesai_otomatis", objek_id__in=selesai_ids,
        ).order_by("-dikirim_pada").first() if selesai_ids else None
        return terakhir.dikirim_pada if terakhir else lib.purchased_at

    # ------------------------------------------------------------ 4

    def _cek_akun_zoom(self):
        """Sekali sehari: cek paket akun Zoom aktif (Pro/gratis). Kalau turun
        jadi gratis (langganan habis), admin langsung dikabari -- akun gratis
        tidak merekam otomatis dan memutus meeting di menit ke-40."""
        from mark_up.zoom import check_account
        from products.models import ZoomAccount

        n = 0
        hari_ini = timezone.localdate().isoformat()
        for akun in ZoomAccount.objects.filter(is_active=True):
            def aksi(akun=akun):
                hasil = check_account(akun)
                sebelumnya = akun.is_licensed
                akun.last_check_at = timezone.now()
                akun.last_check_ok = bool(hasil.get("ok"))
                akun.last_check_note = (hasil.get("pesan") or "")[:500]
                if hasil.get("ok"):
                    akun.is_licensed = bool(hasil.get("berbayar"))
                akun.save(update_fields=["last_check_at", "last_check_ok", "last_check_note", "is_licensed"])
                if not hasil.get("ok"):
                    kabari_tim("Akun Zoom Bermasalah",
                               f"Akun Zoom \"{akun.label}\" gagal dicek: {hasil.get('pesan')}. Link Zoom mentoring "
                               f"tidak akan bisa dibuat sampai ini diperbaiki.", url="/admin/orders/mentoring")
                elif akun.is_licensed is False and sebelumnya is not False:
                    kabari_tim("Akun Zoom Sekarang Akun GRATIS",
                               f"Akun Zoom \"{akun.label}\" terbaca sebagai akun gratis (langganan Pro tidak aktif). "
                               f"Akibatnya: sesi mentoring TIDAK direkam otomatis dan meeting terputus di menit "
                               f"ke-40. Perpanjang langganannya atau ganti akun di panel Akun Zoom.",
                               url="/admin/orders/mentoring")

            n += self._lakukan(f"cek_zoom_{hari_ini}", akun.id, "", f"Cek paket akun Zoom: {akun.label}", aksi)
        return n

    # ------------------------------------------------------------ 3

    def _boleh_diselesaikan(self, s):
        """(boleh, alasan_kalau_tidak, perlu_coba_lagi).

        Dulu sesi apa pun yang jadwalnya lewat langsung ditandai selesai --
        termasuk sesi yang tidak pernah punya link Zoom, sehingga honor mentor
        terbit untuk meeting yang tidak pernah ada (kejadian 20 Okt 2026)."""
        from mark_up.zoom import meeting_pernah_berlangsung

        if not s.zoom_link:
            return False, "sesi ini tidak pernah punya link Zoom.", False
        if not (s.zoom_meeting_id and s.zoom_account_id):
            # Link ditempel manual admin (bukan dari akun Zoom kita) -- tidak bisa
            # dicek ke Zoom, dan admin sendiri yang menyiapkannya.
            return True, "", False
        hasil = meeting_pernah_berlangsung(s.zoom_account, s.zoom_meeting_id)
        if hasil is True:
            return True, "", False
        if hasil is False:
            return False, "Zoom mencatat meeting-nya tidak pernah dimulai (tidak ada yang masuk).", False
        return False, "", True  # Zoom tidak bisa dihubungi -- coba lagi di putaran berikutnya

    def _selesaikan_otomatis(self):
        from products.views import selesaikan_sesi_mentoring

        n = 0
        jeda = timedelta(hours=getattr(settings, "SESSION_AUTO_COMPLETE_HOURS", 2))
        lewat = MentoringSession.objects.filter(
            status=MentoringSession.SessionStatus.SCHEDULED,
            start_time__isnull=False,
            start_time__lte=self.sekarang,
            mentor__isnull=False,
            user_library__is_revoked=False,
        ).select_related("mentoring", "mentor__user", "user_library__user", "user_library__product",
                         "zoom_account")

        for s in lewat:
            durasi = (s.mentoring.duration_minutes if s.mentoring_id else None) or 60
            if s.start_time + timedelta(minutes=durasi) + jeda > self.sekarang:
                continue
            label = f"{s.user_library.user.fullname} x {s.mentor.user.fullname} ({tanggal_indo(s.start_time)})"
            # Koreksi admin ("Batalkan Selesai") tidak boleh ditimpa cron.
            stempel = int(s.start_time.timestamp())
            if (self._sudah_pernah("sesi_selesai_otomatis", s.id)
                    or self._sudah_pernah(f"konfirmasi_sesi@{stempel}", s.id)):
                continue  # sudah diputuskan / sudah diserahkan ke admin

            boleh, alasan, coba_lagi = self._boleh_diselesaikan(s) if self.execute else (True, "", False)
            if coba_lagi:
                self.stdout.write(f"  [TUNDA] {label} -- Zoom belum bisa dihubungi, dicoba lagi nanti")
                continue
            if not boleh:
                n += self._lakukan(f"konfirmasi_sesi@{stempel}", s.id, "tim", f"Minta konfirmasi admin: {label}",
                                   lambda s=s, alasan=alasan: kabar_mentoring.konfirmasi_sesi_ke_admin(s, alasan))
                continue

            def aksi(s=s):
                with transaction.atomic():
                    selesaikan_sesi_mentoring(s)
                if sekali("minta_feedback", s.id, s.user_library.user.email):
                    kabar_mentoring.minta_feedback(s)

            n += self._lakukan("sesi_selesai_otomatis", s.id, "", f"Selesai otomatis: {label}", aksi)
        return n

    def _sudah_pernah(self, jenis, objek_id):
        from accounts.models import PesanTerkirim

        return PesanTerkirim.objects.filter(jenis=jenis, objek_id=str(objek_id)).exists()

    def _sudah_pernah_ke(self, jenis, objek_id, penerima):
        from accounts.models import PesanTerkirim

        return PesanTerkirim.objects.filter(jenis=jenis, objek_id=str(objek_id),
                                            penerima=str(penerima)[:254]).exists()

    # ------------------------------------------------------------ 4

    def _pengingat_feedback(self):
        """Sekali, 24 jam setelah feedback diminta, kalau belum diisi."""
        from accounts.models import PesanTerkirim

        n = 0
        diminta = PesanTerkirim.objects.filter(
            jenis="minta_feedback", dikirim_pada__lte=self.sekarang - timedelta(hours=24),
            dikirim_pada__gte=self.sekarang - timedelta(days=14),
        )
        for catatan in diminta:
            s = MentoringSession.objects.filter(
                id=catatan.objek_id, status=MentoringSession.SessionStatus.COMPLETED,
                user_library__is_revoked=False, feedback__isnull=True,
            ).select_related("mentoring", "mentor__user", "user_library__user").first()
            if s is None:
                continue
            label = f"{s.user_library.user.fullname} - Sesi {s.order} {s.mentoring.title if s.mentoring_id else ''}"
            n += self._lakukan("pengingat_feedback", s.id, s.user_library.user.email, f"Ingatkan feedback: {label}",
                               lambda s=s: kabar_mentoring.pengingat_feedback(s))
        return n
