"""Pembeli menjadwalkan / mengubah jadwal sesi mentoring, termasuk memilih
mentor sendiri untuk sesi yang belum punya mentor."""
from datetime import timedelta

from django.utils import timezone

from accounts.models import Notification, UserStatus
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_expertise, buat_mentor, buat_mentoring, buat_slot, buat_user,
)
from products.models import MentoringSession, UserLibrary
from transactions.models import TransactionItem


class JadwalBase(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.bcc = buat_expertise("BCC")
        self.mentor = buat_mentor(expertise=[self.bcc])
        self.slot1 = buat_slot(self.mentor, jam_lagi=48)
        self.mentoring = buat_mentoring(sesi=3, expertise=[self.bcc])
        self.pembeli = buat_user()
        beli_lunas(self, self.pembeli, self.mentoring, self.slot1)
        self.sesi = list(MentoringSession.objects.filter(user_library__user=self.pembeli).order_by("order"))

    def jadwalkan(self, sesi, slot, user=None):
        return self.post_json(f"/api/products/my-products/sessions/{sesi.id}/schedule/",
                              {"session_type": "mentoring", "availability_slot_id": str(slot.id)},
                              user=user or self.pembeli)


class JadwalkanSesiTests(JadwalBase):
    def test_jadwalkan_sesi_berikutnya_dan_mentor_dikabari(self):
        slot2 = buat_slot(self.mentor, jam_lagi=96)
        r = self.jadwalkan(self.sesi[1], slot2)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["status"], "scheduled")
        slot2.refresh_from_db()
        self.assertTrue(slot2.is_booked)
        self.assertTrue(Notification.objects.filter(user=self.mentor.user, title="Jadwal Sesi Mentoring Baru").exists())

    def test_slot_mentor_lain_ditolak(self):
        lain = buat_slot(buat_mentor(expertise=[self.bcc]), jam_lagi=96)
        self.assertEqual(self.jadwalkan(self.sesi[1], lain).status_code, 400)

    def test_slot_yang_sudah_dibooking_ditolak(self):
        self.assertEqual(self.jadwalkan(self.sesi[1], buat_slot(self.mentor, jam_lagi=96, booked=True)).status_code, 400)

    def test_ubah_jadwal_ke_slot_yang_sudah_lewat_ditolak(self):
        # Sesi 1 diubah jadwalnya -- gak ada sesi sebelumnya, jadi aturan
        # urutan gak ikut campur; yang diuji murni "slot sudah lewat".
        lewat = buat_slot(self.mentor, jam_lagi=-3)
        r = self.jadwalkan(self.sesi[0], lewat)
        self.assertEqual(r.status_code, 400, "sesi gak boleh dijadwalkan ke waktu yang sudah lewat")
        self.slot1.refresh_from_db()
        self.assertTrue(self.slot1.is_booked, "jadwal lama gak boleh ikut lepas kalau ditolak")

    def test_urutan_sesi_harus_berurutan(self):
        sebelum_sesi1 = buat_slot(self.mentor, jam_lagi=24)
        self.assertEqual(self.jadwalkan(self.sesi[1], sebelum_sesi1).status_code, 400)

    def test_sesi_orang_lain_404(self):
        self.assertEqual(self.jadwalkan(self.sesi[1], buat_slot(self.mentor, jam_lagi=96), user=buat_user()).status_code, 404)

    def test_ubah_jadwal_melepas_slot_lama_dan_memindah_pemiliknya(self):
        baru = buat_slot(self.mentor, jam_lagi=60)
        r = self.jadwalkan(self.sesi[0], baru)
        self.assertEqual(r.status_code, 200, r.content)
        self.slot1.refresh_from_db()
        self.assertFalse(self.slot1.is_booked)
        self.assertFalse(TransactionItem.objects.filter(mentor_availability=self.slot1).exists())
        self.assertTrue(TransactionItem.objects.filter(mentor_availability=baru).exists())

    def test_ubah_jadwal_kurang_dari_3_jam_ditolak(self):
        MentoringSession.objects.filter(pk=self.sesi[0].pk).update(start_time=timezone.now() + timedelta(hours=2))
        self.assertEqual(self.jadwalkan(self.sesi[0], buat_slot(self.mentor, jam_lagi=60)).status_code, 400)


class PilihMentorSendiriTests(ApiTestCase):
    """Sesi tanpa mentor (pembayaran yang dipulihkan setelah kedaluwarsa)."""

    def setUp(self):
        self.bcc = buat_expertise("BCC")
        self.mentoring = buat_mentoring(sesi=2, expertise=[self.bcc])
        self.pembeli = buat_user()
        lib = UserLibrary.objects.create(user=self.pembeli, product=self.mentoring)
        self.sesi = [
            MentoringSession.objects.create(mentoring=self.mentoring.mentoring_detail, user_library=lib, order=i)
            for i in (1, 2)
        ]

    def jadwalkan(self, sesi, slot):
        return self.post_json(f"/api/products/my-products/sessions/{sesi.id}/schedule/",
                              {"session_type": "mentoring", "availability_slot_id": str(slot.id)}, user=self.pembeli)

    def test_detail_produk_menandai_mentor_belum_dipilih(self):
        r = self.get(f"/api/products/my-products/{self.mentoring.id}/", user=self.pembeli)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(all(s["mentor_id"] is None for s in r.json()["sessions"]))

    def test_pilih_mentor_dipasang_ke_semua_sesi(self):
        mentor = buat_mentor(expertise=[self.bcc])
        r = self.jadwalkan(self.sesi[0], buat_slot(mentor, jam_lagi=48))
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(all(s.mentor_id == mentor.id for s in MentoringSession.objects.filter(user_library__user=self.pembeli)))

    def test_mentor_beda_keahlian_ditolak(self):
        mentor = buat_mentor(expertise=[buat_expertise("Karir")])
        self.assertEqual(self.jadwalkan(self.sesi[0], buat_slot(mentor)).status_code, 400)

    def test_slot_yang_sudah_lewat_ditolak(self):
        mentor = buat_mentor(expertise=[self.bcc])
        r = self.jadwalkan(self.sesi[0], buat_slot(mentor, jam_lagi=-3))
        self.assertEqual(r.status_code, 400, "sesi gak boleh dijadwalkan ke waktu yang sudah lewat")
        self.assertTrue(all(s.mentor_id is None for s in MentoringSession.objects.filter(user_library__user=self.pembeli)))

    def test_mentor_nonaktif_ditolak(self):
        mentor = buat_mentor(expertise=[self.bcc], status=UserStatus.INACTIVE)
        self.assertEqual(self.jadwalkan(self.sesi[0], buat_slot(mentor)).status_code, 400)
