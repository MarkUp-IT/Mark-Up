"""Alur akun: daftar -> verifikasi email -> login, lupa/reset password,
ganti password, hapus akun. Email ditangkap lewat mock send_mail_async
(aslinya dikirim di thread terpisah) supaya link di dalamnya bisa dipakai."""
import re
from unittest import mock

from django.core.cache import cache

from accounts.models import User, UserStatus
from mark_up.testkit import ApiTestCase, buat_user

PASSWORD = "Rahasia123!"


def link_dari(mock_kirim, kata_kunci):
    """Ambil uid & token dari link di email terakhir yang memuat kata_kunci."""
    for call in reversed(mock_kirim.call_args_list):
        pesan = call.kwargs.get("message") or (call.args[1] if len(call.args) > 1 else "")
        if kata_kunci in pesan:
            m = re.search(r"uid=([^&\s]+)&token=([^&\s]+)", pesan)
            return {"uid": m.group(1), "token": m.group(2)}
    raise AssertionError(f"gak ada email berisi {kata_kunci!r}")


class AkunBase(ApiTestCase):
    def setUp(self):
        cache.clear()
        p = mock.patch("accounts.views.send_mail_async")
        self.kirim = p.start()
        self.addCleanup(p.stop)

    def login(self, email, password=PASSWORD):
        return self.post_json("/api/accounts/login/", {"email": email, "password": password})


class DaftarDanVerifikasiTests(AkunBase):
    def data(self, **extra):
        d = {"fullname": "Budi Tes", "email": "budi@contoh.test", "phone": "081234567890",
             "institution": "Univ Tes", "current_status": "Mahasiswa",
             "password": PASSWORD, "confirm_password": PASSWORD}
        d.update(extra)
        return d

    def test_daftar_verifikasi_lalu_login(self):
        r = self.post_json("/api/accounts/register/", self.data())
        self.assertEqual(r.status_code, 201, r.content)
        self.assertFalse(User.objects.get(email="budi@contoh.test").is_email_verified)
        self.assertNotEqual(self.login("budi@contoh.test").status_code, 200, "belum verifikasi gak boleh login")
        r = self.post_json("/api/accounts/verify-email/", link_dari(self.kirim, "verifikasi"))
        self.assertEqual(r.status_code, 200, r.content)
        r = self.login("budi@contoh.test")
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn("access", r.content.decode())

    def test_email_dobel_beda_huruf_ditolak(self):
        buat_user(email="budi@contoh.test")
        self.assertEqual(self.post_json("/api/accounts/register/", self.data(email="BUDI@contoh.test")).status_code, 400)

    def test_password_lemah_atau_beda_ditolak(self):
        for pw in ("pendek!A", "tanpakapital1!", "TanpaSimbol123", "Ab!"):
            r = self.post_json("/api/accounts/register/", self.data(email=f"{abs(hash(pw))}@contoh.test",
                                                                     password=pw, confirm_password=pw))
            if len(pw) >= 8 and any(c.isupper() for c in pw) and not pw.isalnum():
                continue
            self.assertEqual(r.status_code, 400, f"password {pw!r} harusnya ditolak")
        r = self.post_json("/api/accounts/register/", self.data(confirm_password="Beda123!"))
        self.assertEqual(r.status_code, 400)

    def test_token_verifikasi_ngawur_ditolak(self):
        self.post_json("/api/accounts/register/", self.data())
        link = link_dari(self.kirim, "verifikasi")
        link["token"] = "token-palsu"
        self.assertEqual(self.post_json("/api/accounts/verify-email/", link).status_code, 400)


class LoginTests(AkunBase):
    def setUp(self):
        super().setUp()
        self.user = buat_user(email="ani@contoh.test")

    def test_pesan_salah_sama_untuk_email_ada_maupun_tidak(self):
        a = self.login("ani@contoh.test", "SalahBanget1!")
        b = self.login("gakada@contoh.test", "SalahBanget1!")
        self.assertEqual(a.status_code, b.status_code)
        self.assertEqual(a.json()["detail"], b.json()["detail"])

    def test_email_huruf_besar_tetap_bisa_login(self):
        self.assertEqual(self.login("ANI@Contoh.test").status_code, 200)

    def test_rate_limit_tebak_password(self):
        kode = [self.login("ani@contoh.test", "Salah123!").status_code for _ in range(7)]
        self.assertIn(429, kode)


class LupaPasswordTests(AkunBase):
    def setUp(self):
        super().setUp()
        self.user = buat_user(email="cici@contoh.test")

    def test_email_gak_terdaftar_tetap_200_dan_gak_kirim_apa_apa(self):
        r = self.post_json("/api/accounts/forgot-password/", {"email": "gakada@contoh.test"})
        self.assertEqual(r.status_code, 200)
        self.kirim.assert_not_called()

    def test_reset_sekali_pakai_lalu_login_password_baru(self):
        self.assertEqual(self.post_json("/api/accounts/forgot-password/", {"email": "cici@contoh.test"}).status_code, 200)
        link = link_dari(self.kirim, "kata sandi")
        r = self.post_json("/api/accounts/reset-password/", {**link, "new_password": "Baru1234!"})
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.login("cici@contoh.test", "Baru1234!").status_code, 200)
        r = self.post_json("/api/accounts/reset-password/", {**link, "new_password": "Lagi1234!"})
        self.assertEqual(r.status_code, 400, "link reset gak boleh dipakai dua kali")

    def test_reset_password_lemah_ditolak(self):
        self.post_json("/api/accounts/forgot-password/", {"email": "cici@contoh.test"})
        link = link_dari(self.kirim, "kata sandi")
        self.assertEqual(self.post_json("/api/accounts/reset-password/", {**link, "new_password": "lemah"}).status_code, 400)


class GantiPasswordDanHapusAkunTests(AkunBase):
    def setUp(self):
        super().setUp()
        self.user = buat_user(email="dodi@contoh.test")

    def test_ganti_password(self):
        url = "/api/accounts/me/change-password/"
        self.assertEqual(self.post_json(url, {"current_password": "Salah123!", "new_password": "Baru1234!"}, user=self.user).status_code, 400)
        self.assertEqual(self.post_json(url, {"current_password": PASSWORD, "new_password": "lemah"}, user=self.user).status_code, 400)
        r = self.post_json(url, {"current_password": PASSWORD, "new_password": "Baru1234!"}, user=self.user)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.login("dodi@contoh.test", "Baru1234!").status_code, 200)

    def test_hapus_akun_lewat_konfirmasi_email(self):
        self.assertEqual(self.post_json("/api/accounts/me/delete/", user=self.user).status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.ACTIVE, "belum dikonfirmasi, akun masih aktif")
        link = link_dari(self.kirim, "hapus")
        r = self.post_json("/api/accounts/delete-account/confirm/", link)
        self.assertEqual(r.status_code, 200, r.content)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, UserStatus.INACTIVE)
        self.assertNotEqual(self.login("dodi@contoh.test").status_code, 200)
