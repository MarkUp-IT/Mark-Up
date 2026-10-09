"""Tes asap: SEMUA endpoint GET dipanggil dengan data yang terisi lengkap,
pakai peran yang memang berhak. Tujuannya menangkap error 500 (crash) di
mana pun -- halaman admin, dashboard mentor, halaman pembeli -- termasuk
endpoint baru yang nanti ditambahkan (daftarnya dibaca otomatis)."""
import re
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from accounts.models import ContactMessage, Notification, UserRole
from mark_up.izin_akses import daftar_endpoint_api
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_bootcamp, buat_expertise, buat_mentor, buat_mentoring, buat_modul,
    buat_referral, buat_slot, buat_user,
)
from products.models import (
    BootcampQuiz, BootcampRegistration, MentoringSession, RefundRequest, Review, UserLibrary,
)
from programs.models import BootcampSession as SesiTemplate


class AsapSemuaEndpointGetTests(ApiTestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = buat_admin()
        bcc = buat_expertise("BCC")
        cls.mentor = buat_mentor(expertise=[bcc])
        cls.pembeli = buat_user()
        cls.mentoring = buat_mentoring(sesi=2, expertise=[bcc])
        cls.modul = buat_modul()
        cls.bootcamp, cls.paket = buat_bootcamp()
        SesiTemplate.objects.create(bootcamp=cls.bootcamp.bootcamp_detail, title="Sesi 1",
                                    start_time=timezone.now() + timedelta(days=3))
        cls.quiz = BootcampQuiz.objects.create(bootcamp=cls.bootcamp.bootcamp_detail)
        cls.reg = BootcampRegistration.objects.create(user=cls.pembeli, package=cls.paket, requirement_doc="",
                                                      status=BootcampRegistration.Status.ACCEPTED)
        buat_referral()
        ContactMessage.objects.create(name="A", email="a@contoh.test", subject="Halo", message="Tes")
        Notification.objects.create(user=cls.pembeli, title="T", message="M")

    def setUp(self):
        # Data yang butuh request (checkout -> ACC) dibuat per tes.
        self.txn = beli_lunas(self, self.pembeli, self.mentoring, buat_slot(self.mentor))
        self.lib = UserLibrary.objects.get(user=self.pembeli, product=self.mentoring)
        sesi = MentoringSession.objects.filter(user_library=self.lib).first()
        self.patch_json(f"/api/products/mentoring-orders/sessions/{sesi.id}/", {"status": "completed"}, user=self.admin)
        RefundRequest.objects.create(user_library=self.lib, reason="Tes")
        Review.objects.create(user=self.pembeli, product=self.mentoring, rating=5, review_text="Mantap")

    def isi_path(self, pola):
        """Ganti parameter URL dengan ID data sungguhan yang relevan."""
        nilai = {
            "product_id": self.mentoring.id, "mentor_id": self.mentor.id, "user_id": self.pembeli.id,
            "transaction_id": self.txn.id, "registration_id": self.reg.id, "quiz_id": self.quiz.id,
            "user_library_id": self.lib.id,
        }

        def ganti(m):
            nama = m.group(2)
            if nama in nilai:
                return str(nilai[nama])
            return None

        if any(ganti(m) is None for m in re.finditer(r"<(?:(\w+):)?(\w+)>", pola)):
            return None
        return "/" + re.sub(r"<(?:(\w+):)?(\w+)>", lambda m: ganti(m), pola)

    def test_semua_get_gak_crash(self):
        peran_ke_user = {UserRole.ADMIN: self.admin, UserRole.MENTOR: self.mentor.user, UserRole.STUDENT: self.pembeli}
        crash, dicek = [], 0
        for _, pola, _, login, peran in daftar_endpoint_api():
            path = self.isi_path(pola)
            if path is None or pola.endswith("webhook/"):
                continue
            pengguna = [peran_ke_user[p] for p in peran] if peran else ([self.pembeli, self.admin] if login else [None])
            for user in pengguna:
                r = self.get(path, user=user)
                dicek += 1
                if r.status_code >= 500:
                    crash.append(f"GET {pola} ({getattr(user, 'role', 'anonim')}) -> {r.status_code}")
        self.assertGreater(dicek, 60)
        self.assertEqual(crash, [])

    def test_halaman_produk_publik_tampil(self):
        for p in (self.mentoring, self.modul, self.bootcamp):
            r = self.get(f"/api/products/{p.id}/")
            self.assertEqual(r.status_code, 200, f"{p.type}: {r.content[:200]}")
        r = self.get("/api/products/")
        self.assertEqual(r.status_code, 200)
