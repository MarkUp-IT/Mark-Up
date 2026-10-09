"""Matriks izin akses SEMUA endpoint API -- dibaca otomatis dari dekorator
tiap view (mark_up/izin_akses.py), jadi endpoint baru otomatis ikut diuji.

Kalau tes `test_daftar_endpoint_publik_disetujui` gagal karena ada endpoint
publik baru: pastikan memang sengaja publik, baru tambahkan ke PUBLIK_DISETUJUI.
"""
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import UserRole, UserStatus
from mark_up.izin_akses import daftar_endpoint_api
from mark_up.testkit import ApiTestCase, buat_admin, buat_mentor, buat_mentoring, buat_user

METODE = ("get", "post", "patch", "delete")

# Endpoint yang SENGAJA bisa diakses tanpa login.
PUBLIK_DISETUJUI = {
    # autentikasi & akun
    "api/auth/refresh/", "api/accounts/register/", "api/accounts/login/", "api/accounts/google-login/",
    "api/accounts/logout/", "api/accounts/delete-account/confirm/", "api/accounts/forgot-password/",
    "api/accounts/reset-password/", "api/accounts/verify-email/", "api/accounts/resend-verification/",
    # form publik
    "api/accounts/contact/", "api/accounts/client-error/",
    # katalog (baca)
    "api/products/", "api/products/promo-popup/", "api/products/<uuid:product_id>/packages/",
    "api/products/<uuid:product_id>/timeline/", "api/products/<uuid:product_id>/requirements/",
    "api/products/<uuid:product_id>/", "api/mentors/", "api/mentors/expertise/",
    "api/mentors/<uuid:mentor_id>/availability/", "api/programs/", "api/programs/categories/",
    # pembayaran
    "api/transactions/bank-account/", "api/transactions/ipaymu/webhook/", "api/transactions/ipaymu/available/",
}

# Endpoint publik yang memang menerima tulisan dari orang tanpa login.
PUBLIK_BOLEH_MENULIS = {
    "api/auth/refresh/", "api/accounts/register/", "api/accounts/login/", "api/accounts/google-login/",
    "api/accounts/logout/", "api/accounts/delete-account/confirm/", "api/accounts/forgot-password/",
    "api/accounts/reset-password/", "api/accounts/verify-email/", "api/accounts/resend-verification/",
    "api/accounts/contact/", "api/accounts/client-error/", "api/transactions/ipaymu/webhook/",
}


class MatriksIzinAksesTests(ApiTestCase):
    def setUp(self):
        self.pelajar = buat_user()
        self.mentor = buat_mentor().user
        self.admin = buat_admin()
        self.endpoint = daftar_endpoint_api()

    def panggil(self, metode, path, user=None):
        return getattr(self.client, metode)(path, **self.auth(user))

    def test_jumlah_endpoint_terbaca(self):
        self.assertGreater(len(self.endpoint), 150)

    def test_daftar_endpoint_publik_disetujui(self):
        publik = {pola for _, pola, _, login, _ in self.endpoint if not login}
        self.assertEqual(publik - PUBLIK_DISETUJUI, set(), "ada endpoint publik baru yang belum direview")

    def test_semua_endpoint_ber_login_menolak_anonim(self):
        gagal = []
        for path, pola, _, login, _ in self.endpoint:
            if not login:
                continue
            for m in METODE:
                kode = self.panggil(m, path).status_code
                if kode != 401:
                    gagal.append(f"{m.upper()} {pola} -> {kode}")
        self.assertEqual(gagal, [])

    def test_endpoint_admin_menolak_pelajar_dan_mentor(self):
        gagal = []
        for path, pola, _, login, peran in self.endpoint:
            if peran != (UserRole.ADMIN,):
                continue
            for user in (self.pelajar, self.mentor):
                for m in METODE:
                    kode = self.panggil(m, path, user).status_code
                    if kode != 403:
                        gagal.append(f"{m.upper()} {pola} ({user.role}) -> {kode}")
        self.assertEqual(gagal, [])

    def test_endpoint_khusus_peran_menolak_peran_lain(self):
        gagal = []
        for path, pola, _, login, peran in self.endpoint:
            if not peran or peran == (UserRole.ADMIN,):
                continue
            for user in (self.pelajar, self.mentor, self.admin):
                if user.role in peran:
                    continue
                kode = self.panggil("get", path, user).status_code
                if kode != 403:
                    gagal.append(f"GET {pola} ({user.role}) -> {kode}")
        self.assertEqual(gagal, [])

    def test_endpoint_publik_baca_gak_bisa_ditulis_anonim(self):
        gagal = []
        for path, pola, _, login, _ in self.endpoint:
            if login or pola in PUBLIK_BOLEH_MENULIS:
                continue
            for m in ("post", "patch", "delete"):
                kode = self.panggil(m, path).status_code
                if 200 <= kode < 300:
                    gagal.append(f"{m.upper()} {pola} -> {kode}")
        self.assertEqual(gagal, [])

    def test_ubah_hapus_produk_hanya_admin(self):
        produk = buat_mentoring()
        url = f"/api/products/{produk.id}/"
        self.assertEqual(self.get(url).status_code, 200)
        for m in ("patch", "delete"):
            self.assertEqual(self.panggil(m, url).status_code, 401)
            self.assertEqual(self.panggil(m, url, self.pelajar).status_code, 403)


class AkunNonaktifTests(ApiTestCase):
    """Akun yang dinonaktifkan admin harus langsung kehilangan akses --
    termasuk sesi login yang sudah terlanjur aktif di browsernya."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()  # rate limiter login
        self.admin = buat_admin()
        self.user = buat_user()
        self.refresh = RefreshToken.for_user(self.user)
        self.akses = str(self.refresh.access_token)
        r = self.patch_json(f"/api/accounts/users/{self.user.id}/update/", {"status": UserStatus.INACTIVE}, user=self.admin)
        self.assertEqual(r.status_code, 200, r.content)

    def test_token_lama_ditolak(self):
        r = self.client.get("/api/accounts/me/", HTTP_AUTHORIZATION=f"Bearer {self.akses}")
        self.assertEqual(r.status_code, 401)

    def test_refresh_token_lama_gak_bisa_bikin_token_baru(self):
        r = self.post_json("/api/auth/refresh/", {"refresh": str(self.refresh)})
        self.assertNotEqual(r.status_code, 200)

    def test_gak_bisa_login_lagi(self):
        r = self.post_json("/api/accounts/login/", {"email": self.user.email, "password": "Rahasia123!"})
        self.assertNotEqual(r.status_code, 200)

    def test_diaktifkan_lagi_bisa_login(self):
        self.patch_json(f"/api/accounts/users/{self.user.id}/update/", {"status": UserStatus.ACTIVE}, user=self.admin)
        r = self.post_json("/api/accounts/login/", {"email": self.user.email, "password": "Rahasia123!"})
        self.assertEqual(r.status_code, 200, r.content)
