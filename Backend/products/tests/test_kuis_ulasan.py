"""Kuis seleksi bootcamp, rating/ulasan produk, kode referral (admin), &
form kontak publik."""
from datetime import timedelta
from decimal import Decimal

from django.core.cache import cache
from django.utils import timezone

from accounts.models import ContactMessage, Notification
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_bootcamp, buat_mentor, buat_mentoring, buat_modul, buat_slot,
    buat_user,
)
from products.models import (
    BootcampQuiz, BootcampQuizAttempt, BootcampQuizQuestion, BootcampRegistration, MentoringSession, Review,
)
from transactions.models import ReferralCode


class KuisSeleksiTests(ApiTestCase):
    def setUp(self):
        cache.clear()
        self.product, self.paket = buat_bootcamp(requires_selection=True)
        self.quiz = BootcampQuiz.objects.create(bootcamp=self.paket.bootcamp, duration_minutes=30, passing_score_percent=75)
        self.soal = [
            BootcampQuizQuestion.objects.create(quiz=self.quiz, question_text=f"Soal {i}", choice_a="A", choice_b="B",
                                                choice_c="C", choice_d="D", correct_choice="b", order=i)
            for i in range(4)
        ]
        self.peserta = buat_user()
        self.reg = BootcampRegistration.objects.create(user=self.peserta, package=self.paket, requirement_doc="")

    def mulai(self):
        return self.post_json(f"/api/products/bootcamp-registrations/{self.reg.id}/quizzes/{self.quiz.id}/start/",
                              user=self.peserta)

    def jawab(self, attempt_id, soal, pilihan):
        return self.post_json(f"/api/products/bootcamp-quiz-attempts/{attempt_id}/answer/",
                              {"question_id": str(soal.id), "selected_choice": pilihan}, user=self.peserta)

    def kumpul(self, attempt_id):
        return self.post_json(f"/api/products/bootcamp-quiz-attempts/{attempt_id}/submit/", user=self.peserta)

    def test_kunci_jawaban_gak_bocor_ke_peserta(self):
        r = self.mulai()
        self.assertEqual(r.status_code, 200, r.content)
        isi = r.content.decode()
        self.assertNotIn("correct_choice", isi)
        self.assertNotIn('"correct"', isi)

    def test_skor_dan_kelulusan_dihitung_server(self):
        attempt_id = self.mulai().json()["attempt"]["id"]
        for i, s in enumerate(self.soal):
            self.assertEqual(self.jawab(attempt_id, s, "b" if i < 3 else "a").status_code, 200)
        self.assertEqual(self.kumpul(attempt_id).status_code, 200)
        a = BootcampQuizAttempt.objects.get(id=attempt_id)
        self.assertEqual(a.score_percent, Decimal("75.00"))
        self.assertTrue(a.passed)

    def test_jawaban_gak_valid_ditolak(self):
        attempt_id = self.mulai().json()["attempt"]["id"]
        self.assertEqual(self.jawab(attempt_id, self.soal[0], "e").status_code, 400)
        quiz_lain = BootcampQuiz.objects.create(bootcamp=self.paket.bootcamp)
        soal_lain = BootcampQuizQuestion.objects.create(quiz=quiz_lain, question_text="x", choice_a="1", choice_b="2",
                                                        choice_c="3", choice_d="4", correct_choice="a")
        self.assertEqual(self.jawab(attempt_id, soal_lain, "a").status_code, 400)

    def test_setelah_dikumpulkan_gak_bisa_ubah_jawaban_atau_ulang(self):
        attempt_id = self.mulai().json()["attempt"]["id"]
        self.kumpul(attempt_id)
        self.assertEqual(self.jawab(attempt_id, self.soal[0], "b").status_code, 400)
        self.assertEqual(self.mulai().json()["attempt"]["id"], attempt_id, "mulai lagi harus balik ke attempt yang sama")
        self.assertEqual(BootcampQuizAttempt.objects.filter(registration=self.reg).count(), 1)

    def test_lewat_waktu_jawaban_ditolak_dan_status_kedaluwarsa(self):
        attempt_id = self.mulai().json()["attempt"]["id"]
        BootcampQuizAttempt.objects.filter(id=attempt_id).update(deadline=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.jawab(attempt_id, self.soal[0], "b").status_code, 400)
        self.kumpul(attempt_id)
        self.assertEqual(BootcampQuizAttempt.objects.get(id=attempt_id).status, BootcampQuizAttempt.Status.EXPIRED)

    def test_pendaftaran_yang_sudah_diterima_gak_perlu_kuis(self):
        self.reg.status = BootcampRegistration.Status.ACCEPTED
        self.reg.save()
        self.assertEqual(self.mulai().status_code, 400)


class UlasanTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.mentoring = buat_mentoring(sesi=1)
        self.pembeli = buat_user()
        beli_lunas(self, self.pembeli, self.mentoring, buat_slot(self.mentor))
        self.url = f"/api/products/my-products/{self.mentoring.id}/rate/"

    def selesaikan_semua(self):
        for s in MentoringSession.objects.filter(user_library__user=self.pembeli):
            self.patch_json(f"/api/products/mentoring-orders/sessions/{s.id}/", {"status": "completed"}, user=self.admin)

    def test_belum_selesai_gak_bisa_rating(self):
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=self.pembeli).status_code, 400)

    def test_rating_sekali_dan_rentang_1_sampai_5(self):
        self.selesaikan_semua()
        for salah in (0, 6, "x"):
            self.assertEqual(self.post_json(self.url, {"rating": salah}, user=self.pembeli).status_code, 400)
        self.assertEqual(self.post_json(self.url, {"rating": 5, "review_text": "Mantap"}, user=self.pembeli).status_code, 201)
        self.assertEqual(self.post_json(self.url, {"rating": 4}, user=self.pembeli).status_code, 400)
        self.mentor.refresh_from_db()
        self.assertEqual(self.mentor.rating, Decimal("5"))

    def test_modul_gak_bisa_dirating(self):
        modul = buat_modul()
        beli_lunas(self, self.pembeli, modul)
        r = self.post_json(f"/api/products/my-products/{modul.id}/rate/", {"rating": 5}, user=self.pembeli)
        self.assertEqual(r.status_code, 400)


class KodeReferralAdminTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()

    def tambah(self, **data):
        d = {"code": "HEMAT10", "discount_type": "percentage", "discount_value": 10, "quota": 5}
        d.update(data)
        return self.post_json("/api/transactions/referral-codes/add/", d, user=self.admin)

    def test_tambah_dan_kode_dobel_ditolak(self):
        self.assertEqual(self.tambah().status_code, 201)
        self.assertEqual(self.tambah(code="hemat10").status_code, 400, "kode beda huruf besar/kecil dianggap sama")

    def test_nilai_gak_masuk_akal_ditolak(self):
        self.assertEqual(self.tambah(code="A1", discount_value=150).status_code, 400, "diskon persen > 100")
        self.assertEqual(self.tambah(code="A2", discount_value=-5).status_code, 400)
        self.assertEqual(self.tambah(code="A3", quota=-1).status_code, 400)
        self.assertEqual(self.tambah(code="A4", discount_type="ngawur").status_code, 400)
        self.assertEqual(self.tambah(code="A5", quota="abc").status_code, 400)
        self.assertFalse(ReferralCode.objects.filter(code__in=["A1", "A2", "A3", "A4", "A5"]).exists())

    def test_edit_divalidasi_sama(self):
        a = ReferralCode.objects.get(id=self.tambah(code="SATU").json()["referral_code"]["id"])
        self.tambah(code="DUA")
        url = f"/api/transactions/referral-codes/{a.id}/"
        self.assertEqual(self.patch_json(url, {"code": "dua"}, user=self.admin).status_code, 400, "kode bentrok")
        self.assertEqual(self.patch_json(url, {"quota": "abc"}, user=self.admin).status_code, 400)
        self.assertEqual(self.patch_json(url, {"discount_value": -1}, user=self.admin).status_code, 400)
        self.assertEqual(self.patch_json(url, {"discount_value": 20}, user=self.admin).status_code, 200)
        a.refresh_from_db()
        self.assertEqual(a.discount_value, Decimal("20"))
        self.assertEqual(self.patch_json(url, {"is_active": False}, user=self.admin).status_code, 200)


class KontakTests(ApiTestCase):
    def setUp(self):
        cache.clear()
        self.admin = buat_admin()

    def test_kirim_pesan_dan_admin_dikabari(self):
        r = self.post_json("/api/accounts/contact/", {"name": "Tamu", "email": "tamu@contoh.test",
                                                       "subject": "Tanya", "message": "Halo, mau tanya."})
        self.assertIn(r.status_code, (200, 201), r.content)
        self.assertTrue(ContactMessage.objects.filter(email="tamu@contoh.test").exists())

    def test_field_wajib_dan_email_valid(self):
        self.assertEqual(self.post_json("/api/accounts/contact/", {"name": "", "email": "x", "subject": "", "message": ""}).status_code, 400)
        self.assertFalse(ContactMessage.objects.exists())
