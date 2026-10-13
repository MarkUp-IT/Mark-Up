"""IDOR: user yang sudah login gak boleh membaca / mengubah data milik user
lain cuma dengan mengganti ID di URL."""
from datetime import timedelta

from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_bootcamp, buat_mentor, buat_mentoring, buat_slot, buat_user,
    bukti_pdf, nyalakan_ipaymu,
)
from mentors.models import MentorAvailability, MentorExperience
from products.models import (
    BootcampQuiz, BootcampQuizAttempt, BootcampQuizQuestion, BootcampRegistration, MentoringSession,
)


class IdorPembeliTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.mentoring = buat_mentoring(sesi=2)
        self.korban = buat_user()
        self.penyerang = buat_user()
        self.txn = beli_lunas(self, self.korban, self.mentoring, buat_slot(self.mentor))

    def test_detail_produk_milik_orang_lain(self):
        self.assertEqual(self.get(f"/api/products/my-products/{self.mentoring.id}/", user=self.penyerang).status_code, 404)
        self.assertEqual(self.get(f"/api/transactions/me/products/{self.mentoring.id}/", user=self.penyerang).status_code, 404)

    def test_daftar_transaksi_cuma_milik_sendiri(self):
        r = self.get("/api/transactions/me/transactions/", user=self.penyerang)
        self.assertEqual(r.status_code, 200)
        self.assertNotIn(self.txn.id, r.content.decode())

    def test_refund_dan_rating_produk_orang_lain(self):
        url = f"/api/products/my-products/{self.mentoring.id}/"
        self.assertEqual(self.post_json(url + "refund/", {"reason": "x"}, user=self.penyerang).status_code, 404)
        self.assertEqual(self.post_json(url + "rate/", {"rating": 1}, user=self.penyerang).status_code, 404)

    def test_jadwalkan_sesi_orang_lain(self):
        sesi = MentoringSession.objects.filter(user_library__user=self.korban).order_by("order").last()
        r = self.post_json(f"/api/products/my-products/sessions/{sesi.id}/schedule/",
                           {"session_type": "mentoring", "availability_slot_id": str(buat_slot(self.mentor, jam_lagi=200).id)},
                           user=self.penyerang)
        self.assertEqual(r.status_code, 404)

    def test_transaksi_ipaymu_orang_lain(self):
        nyalakan_ipaymu()
        r = self.post_form("/api/transactions/checkout/", {"product_id": str(self.mentoring.id),
                           "availability_slot_id": str(buat_slot(self.mentor, jam_lagi=100).id),
                           "payment_gateway": "IPAYMU"}, user=self.korban)
        tid = r.json()["transaction_id"]
        for akhiran in ("status/", "cancel/", "ipaymu/qris/", "ipaymu/create-session/"):
            metode = self.get if akhiran == "status/" else self.post_json
            self.assertEqual(metode(f"/api/transactions/{tid}/{akhiran}", user=self.penyerang).status_code, 404, akhiran)

    def test_tandai_baca_notifikasi_cuma_milik_sendiri(self):
        notif = Notification.objects.create(user=self.korban, title="Rahasia", message="isi")
        self.post_json("/api/accounts/me/notifications/mark-read/", {"id": str(notif.id)}, user=self.penyerang)
        self.post_json("/api/accounts/me/notifications/mark-read/", {"all": True}, user=self.penyerang)
        notif.refresh_from_db()
        self.assertFalse(notif.is_read)
        r = self.get("/api/accounts/me/notifications/", user=self.penyerang)
        self.assertNotIn("Rahasia", r.content.decode())


class IdorBootcampTests(ApiTestCase):
    def setUp(self):
        self.product, self.paket = buat_bootcamp()
        self.korban = buat_user()
        self.penyerang = buat_user()
        self.reg = BootcampRegistration.objects.create(user=self.korban, package=self.paket, requirement_doc="",
                                                       status=BootcampRegistration.Status.ACCEPTED)
        self.quiz = BootcampQuiz.objects.create(bootcamp=self.paket.bootcamp)
        BootcampQuizQuestion.objects.create(quiz=self.quiz, question_text="1+1?", choice_a="1", choice_b="2",
                                            choice_c="3", choice_d="4", correct_choice="b")
        self.attempt = BootcampQuizAttempt.objects.create(registration=self.reg, quiz=self.quiz,
                                                          deadline=timezone.now() + timedelta(minutes=30))

    def test_bayar_pendaftaran_orang_lain(self):
        r = self.post_form(f"/api/products/bootcamp-registrations/{self.reg.id}/pay/", {"proof_of_payment": bukti_pdf()},
                           user=self.penyerang)
        self.assertIn(r.status_code, (403, 404))

    def test_kuis_orang_lain(self):
        r = self.post_json(f"/api/products/bootcamp-registrations/{self.reg.id}/quizzes/{self.quiz.id}/start/",
                           user=self.penyerang)
        self.assertIn(r.status_code, (403, 404))
        soal = self.quiz.questions.first()
        r = self.post_json(f"/api/products/bootcamp-quiz-attempts/{self.attempt.id}/answer/",
                           {"question_id": str(soal.id), "selected_choice": "b"}, user=self.penyerang)
        self.assertIn(r.status_code, (403, 404))
        r = self.post_json(f"/api/products/bootcamp-quiz-attempts/{self.attempt.id}/submit/", user=self.penyerang)
        self.assertIn(r.status_code, (403, 404))
        self.attempt.refresh_from_db()
        self.assertIsNone(self.attempt.submitted_at)

    def test_daftar_pendaftaran_saya_cuma_milik_sendiri(self):
        r = self.get("/api/products/bootcamp-registrations/me/", user=self.penyerang)
        self.assertEqual(r.status_code, 200)
        self.assertNotIn(str(self.reg.id), r.content.decode())


class IdorMentorTests(ApiTestCase):
    def setUp(self):
        self.korban = buat_mentor()
        self.penyerang = buat_mentor()

    def test_hapus_slot_mentor_lain(self):
        slot = buat_slot(self.korban)
        r = self.delete(f"/api/mentors/me/availability/{slot.id}/", user=self.penyerang.user)
        self.assertIn(r.status_code, (403, 404))
        self.assertTrue(MentorAvailability.objects.filter(id=slot.id).exists())

    def test_ubah_hapus_pengalaman_mentor_lain(self):
        exp = MentorExperience.objects.create(mentor_profile=self.korban, title="Asli", description="x",
                                              start_date=timezone.now().date())
        url = f"/api/mentors/me/experiences/{exp.id}/"
        self.assertIn(self.patch_json(url, {"title": "Dibajak"}, user=self.penyerang.user).status_code, (403, 404))
        self.assertIn(self.delete(url, user=self.penyerang.user).status_code, (403, 404))
        exp.refresh_from_db()
        self.assertEqual(exp.title, "Asli")
