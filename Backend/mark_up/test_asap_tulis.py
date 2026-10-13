"""Tes asap TULIS: setiap endpoint POST/PATCH/PUT/DELETE ditembak input kosong
& input sampah oleh peran yang berhak, dengan ID di URL diisi data SUNGGUHAN
(biar input sampahnya beneran sampai ke logika validasi, bukan mentok 404).
Harusnya ditolak sopan (4xx), BUKAN crash 500. Endpoint baru otomatis ikut
diuji (daftarnya dibaca dari URL)."""
import json
import re
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from accounts.models import ContactMessage, UserRole
from mark_up.izin_akses import daftar_endpoint_api
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_bootcamp, buat_expertise, buat_mentor, buat_mentoring, buat_referral,
    buat_slot, buat_user,
)
from mentors.models import MentorExperience
from products.models import (
    BootcampQuiz, BootcampQuizAttempt, BootcampQuizQuestion, BootcampRegistration, MentoringSession,
    RefundRequest, Review, UserLibrary,
)
from programs.models import BootcampSession as SesiTemplate
from transactions.models import MentorPayout

INPUT_SAMPAH = [
    {},
    {"status": 123, "decision": ["x"], "rating": "abc", "quota": "abc", "price": "mahal", "title": None,
     "start_time": "kemarin", "email": "bukan-email", "id": "bukan-uuid", "product_id": "bukan-uuid",
     "package_id": "bukan-uuid", "user_library_id": "bukan-uuid", "availability_slot_id": "bukan-uuid",
     "recipient_id": "bukan-uuid", "fee_percent": "x", "discount_value": "x", "is_active": "mungkin",
     "admin_fee_percent": "x", "session_type": "mentoring", "mentor_ids": "bukan-list", "times": "x"},
]


class AsapTulisTests(ApiTestCase):
    def setUp(self):
        cache.clear()
        # Crash di view dibalas 500 (bukan dilempar ke tes), biar SEMUA
        # endpoint yang crash terkumpul dalam satu laporan.
        self.client.raise_request_exception = False
        self.admin = buat_admin()
        bcc = buat_expertise("BCC")
        self.mentor = buat_mentor(expertise=[bcc])
        self.pembeli = buat_user()
        self.peran = {UserRole.ADMIN: self.admin, UserRole.MENTOR: self.mentor.user, UserRole.STUDENT: self.pembeli}

        mentoring = buat_mentoring(sesi=2, expertise=[bcc])
        txn = beli_lunas(self, self.pembeli, mentoring, buat_slot(self.mentor))
        lib = UserLibrary.objects.get(user=self.pembeli, product=mentoring)
        sesi = MentoringSession.objects.filter(user_library=lib).order_by("order")
        self.patch_json(f"/api/products/mentoring-orders/sessions/{sesi[0].id}/", {"status": "completed"}, user=self.admin)
        bootcamp, paket = buat_bootcamp()
        templ = SesiTemplate.objects.create(bootcamp=bootcamp.bootcamp_detail, title="S1",
                                            start_time=timezone.now() + timedelta(days=3))
        quiz = BootcampQuiz.objects.create(bootcamp=bootcamp.bootcamp_detail)
        soal = BootcampQuizQuestion.objects.create(quiz=quiz, question_text="?", choice_a="1", choice_b="2",
                                                   choice_c="3", choice_d="4", correct_choice="a")
        reg = BootcampRegistration.objects.create(user=self.pembeli, package=paket, requirement_doc="")
        attempt = BootcampQuizAttempt.objects.create(registration=reg, quiz=quiz,
                                                     deadline=timezone.now() + timedelta(minutes=30))
        self.id = {
            "product_id": mentoring.id, "session_id": sesi[1].id, "transaction_id": txn.id, "user_id": self.pembeli.id,
            "user_library_id": lib.id, "registration_id": reg.id, "quiz_id": quiz.id, "question_id": soal.id,
            "attempt_id": attempt.id, "package_id": paket.id, "mentor_id": self.mentor.id,
            "refund_id": RefundRequest.objects.create(user_library=lib, reason="x").id,
            "review_id": Review.objects.create(user=self.pembeli, product=mentoring, rating=5).id,
            "payout_id": MentorPayout.objects.first().id, "referral_code_id": buat_referral().id,
            "availability_id": buat_slot(self.mentor, jam_lagi=300).id,
            "experience_id": MentorExperience.objects.create(mentor_profile=self.mentor, title="x", description="x",
                                                             start_date=timezone.now().date()).id,
            "message_id": ContactMessage.objects.create(name="a", email="a@contoh.test", subject="s", message="m").id,
        }
        self.id_bootcamp = {"product_id": bootcamp.id, "session_id": templ.id}

    def isi_path(self, path_contoh, pola):
        nilai = dict(self.id)
        if "bootcamp" in pola or "programs" in pola or any(
                k in pola for k in ("packages", "timeline", "requirements", "quizzes", "resources", "teams",
                                    "registration-settings", "commitment-letter", "registration-questions")):
            nilai.update(self.id_bootcamp)

        def ganti(m):
            return str(nilai.get(m.group(2), "00000000-0000-0000-0000-000000000000"))

        return "/" + re.sub(r"<(?:(\w+):)?(\w+)>", ganti, pola)

    def test_input_kosong_dan_sampah_gak_bikin_crash(self):
        crash = []
        # Panggilan keluar (iPaymu/Zoom/email) dimatikan -- yang diuji cuma
        # ketahanan validasi input kita sendiri.
        with mock.patch("requests.post"), mock.patch("requests.get"), mock.patch("requests.patch"), \
                mock.patch("requests.delete"), mock.patch("accounts.utils.send_mail_async"):
            for path, pola, _, login, peran in daftar_endpoint_api():
                if not login:
                    continue
                path = self.isi_path(path, pola)
                user = self.peran[peran[0]] if peran else self.pembeli
                for metode in ("post", "patch", "put"):
                    for data in INPUT_SAMPAH:
                        cache.clear()
                        # savepoint per request: error database di satu endpoint
                        # gak menghentikan pengecekan endpoint berikutnya.
                        with transaction.atomic():
                            r = getattr(self.client, metode)(path, json.dumps(data), content_type="application/json",
                                                             **self.auth(user))
                        if r.status_code >= 500:
                            crash.append(f"{metode.upper()} {pola} (json) -> {r.status_code}")
                # Sebagian endpoint (upload) baca request.POST, bukan JSON.
                form = {k: str(v) for k, v in INPUT_SAMPAH[1].items() if v is not None}
                cache.clear()
                with transaction.atomic():
                    r = self.client.post(path, form, **self.auth(user))
                if r.status_code >= 500:
                    crash.append(f"POST {pola} (form) -> {r.status_code}")
        self.assertEqual(crash, [], "\n" + "\n".join(sorted(set(crash))))
