"""Mentor: kelola slot jadwal, & alur uang mentor (sesi selesai -> payout ->
admin bayar)."""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_mentor, buat_mentoring, buat_slot, buat_user,
)
from accounts.models import Notification
from mentors.models import MentorAvailability
from products.models import MentoringSession
from transactions.models import CommissionSetting, MentorPayout, PayoutStatus


def tgl(hari_lagi):
    return (timezone.localtime() + timedelta(days=hari_lagi)).strftime("%Y-%m-%d")


class SlotMentorTests(ApiTestCase):
    def setUp(self):
        self.mentor = buat_mentor()
        self.user = self.mentor.user

    def tambah(self, hari=3, mulai="10:00", selesai="11:00"):
        return self.post_json("/api/mentors/availability/add/", {
            "start_date": tgl(hari), "end_date": tgl(hari), "start_time": mulai, "end_time": selesai}, user=self.user)

    def test_tambah_slot_dan_jam_mulai_sama_gak_dobel(self):
        self.assertIn(self.tambah().status_code, (200, 201))
        self.assertIn(self.tambah().status_code, (200, 201))
        self.assertEqual(MentorAvailability.objects.filter(mentor_profile=self.mentor).count(), 1)

    def test_jam_selesai_sebelum_mulai_ditolak(self):
        self.assertEqual(self.tambah(mulai="11:00", selesai="10:00").status_code, 400)

    def test_slot_di_masa_lalu_ditolak(self):
        self.assertEqual(self.tambah(hari=-2).status_code, 400)
        self.assertFalse(MentorAvailability.objects.filter(mentor_profile=self.mentor).exists())

    def test_slot_tumpang_tindih_ditolak(self):
        self.tambah(mulai="10:00", selesai="11:00")
        self.assertEqual(self.tambah(mulai="10:30", selesai="11:30").status_code, 400)
        self.assertEqual(MentorAvailability.objects.filter(mentor_profile=self.mentor).count(), 1)

    def test_bulk_gak_bikin_slot_masa_lalu_atau_tumpang_tindih(self):
        r = self.post_json("/api/mentors/availability/add-bulk/", {
            "start_date": tgl(-2), "end_date": tgl(2), "times": ["10:00", "10:30", "14:00"]}, user=self.user)
        self.assertEqual(r.status_code, 201, r.content)
        slot = list(MentorAvailability.objects.filter(mentor_profile=self.mentor).order_by("start_time"))
        self.assertTrue(all(s.start_time > timezone.now() for s in slot), "slot masa lalu ikut dibuat")
        for a, b in zip(slot, slot[1:]):
            self.assertLessEqual(a.end_time, b.start_time, f"tumpang tindih: {a.start_time} & {b.start_time}")

    def test_hapus_slot_yang_sudah_dibooking_ditolak(self):
        slot = buat_slot(self.mentor, booked=True)
        self.assertEqual(self.delete(f"/api/mentors/me/availability/{slot.id}/", user=self.user).status_code, 400)
        kosong = buat_slot(self.mentor, jam_lagi=100)
        self.assertEqual(self.delete(f"/api/mentors/me/availability/{kosong.id}/", user=self.user).status_code, 200)

    def test_pelajar_gak_bisa_bikin_slot(self):
        r = self.post_json("/api/mentors/availability/add/", {
            "start_date": tgl(3), "end_date": tgl(3), "start_time": "10:00", "end_time": "11:00"}, user=buat_user())
        self.assertIn(r.status_code, (403, 404))


class PayoutTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.mentoring = buat_mentoring(harga=200000, sesi=2)
        beli_lunas(self, buat_user(), self.mentoring, buat_slot(self.mentor))
        self.sesi = MentoringSession.objects.filter(mentor=self.mentor).order_by("order").first()

    def selesaikan(self, user=None):
        return self.patch_json(f"/api/products/mentoring-orders/sessions/{self.sesi.id}/", {"status": "completed"},
                               user=user or self.admin)

    def test_sesi_selesai_menerbitkan_payout_sesuai_komisi(self):
        self.assertEqual(self.selesaikan().status_code, 200)
        p = MentorPayout.objects.get(mentoring_session=self.sesi)
        self.assertEqual(p.gross_amount, Decimal("100000"))
        self.assertEqual(p.fee_percent, CommissionSetting.get_solo().mentoring_fee_percent)
        self.assertEqual(p.status, PayoutStatus.PENDING)
        r = self.get("/api/transactions/me/payouts/", user=self.mentor.user)
        self.assertEqual(len(r.json()["payouts"]), 1)

    def test_payout_dari_harga_setelah_diskon_referral(self):
        from mark_up.testkit import buat_referral, bukti_pdf
        pembeli = buat_user()
        kode = buat_referral(persen=10)
        r = self.post_form("/api/transactions/checkout/", {
            "product_id": str(self.mentoring.id), "availability_slot_id": str(buat_slot(self.mentor, jam_lagi=100).id),
            "voucher_code": kode.code, "proof_of_payment": bukti_pdf()}, user=pembeli)
        self.assertEqual(r.status_code, 201, r.content)
        self.patch_json(f"/api/transactions/{r.json()['transaction_id']}/verify/", {"decision": "paid"},
                        user=self.admin)
        sesi = MentoringSession.objects.get(user_library__user=pembeli, order=1)
        self.patch_json(f"/api/products/mentoring-orders/sessions/{sesi.id}/", {"status": "completed"},
                        user=self.admin)
        # Bayar 180.000 (200.000 - 10%) untuk 2 sesi -> 90.000 per sesi.
        self.assertEqual(MentorPayout.objects.get(mentoring_session=sesi).gross_amount, Decimal("90000"))

    def test_tandai_selesai_dua_kali_gak_dobel_payout(self):
        self.selesaikan()
        self.selesaikan()
        self.assertEqual(MentorPayout.objects.filter(mentoring_session=self.sesi).count(), 1)

    def test_komisi_override_per_mentor(self):
        self.mentor.mentoring_fee_percent_override = 10
        self.mentor.save()
        self.selesaikan()
        self.assertEqual(MentorPayout.objects.get(mentoring_session=self.sesi).fee_percent, 10)

    def test_admin_bayar_payout_sekali(self):
        self.selesaikan()
        p = MentorPayout.objects.get(mentoring_session=self.sesi)
        url = f"/api/transactions/payouts/{p.id}/mark-paid/"
        self.assertEqual(self.patch_json(url, user=self.mentor.user).status_code, 403)
        r = self.patch_json(url, user=self.admin)
        self.assertEqual(r.status_code, 200, r.content)
        p.refresh_from_db()
        self.assertEqual(p.status, PayoutStatus.PAID)
        self.assertIsNotNone(p.paid_at)
        self.assertEqual(self.patch_json(url, user=self.admin).status_code, 400)
        r = self.patch_json(f"/api/transactions/payouts/{p.id}/fee/", {"fee_percent": 5}, user=self.admin)
        self.assertEqual(r.status_code, 400, "komisi payout yang sudah lunas gak boleh diubah")

    def test_validasi_komisi(self):
        url = "/api/transactions/payouts/commission-setting/"
        for salah in (-1, 101, "abc"):
            self.assertEqual(self.patch_json(url, {"mentoring_fee_percent": salah}, user=self.admin).status_code, 400)
        self.assertEqual(self.patch_json(url, {"mentoring_fee_percent": 30}, user=self.admin).status_code, 200)
        self.assertEqual(CommissionSetting.get_solo().mentoring_fee_percent, 30)


class StatusMentorTests(ApiTestCase):
    """Dua status terpisah: status AKUN (User.status) & status MENTOR
    (lengkap-tidaknya profil + saklar admin is_mentor_active)."""

    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.url = f"/api/accounts/users/{self.mentor.user.id}/update/"

    def nama_di_direktori(self):
        r = self.get("/api/mentors/")
        return [m["id"] for m in r.json()["mentors"]]

    def checkout(self):
        from mark_up.testkit import bukti_pdf
        return self.post_form("/api/transactions/checkout/", {
            "product_id": str(buat_mentoring(sesi=1).id), "proof_of_payment": bukti_pdf(),
            "availability_slot_id": str(buat_slot(self.mentor).id)}, user=buat_user())

    def baris_admin(self):
        r = self.get("/api/accounts/users/?role=MENTOR", user=self.admin)
        return next(u for u in r.json()["users"] if u["id"] == str(self.mentor.user.id))

    def test_lengkap_otomatis_aktif(self):
        self.assertEqual(self.baris_admin()["mentor_status"], "ACTIVE")
        self.assertIn(str(self.mentor.id), self.nama_di_direktori())
        self.assertEqual(self.checkout().status_code, 201)

    def test_belum_lengkap_tersembunyi_dan_gak_bisa_dibeli(self):
        belum = buat_mentor(lengkap=False)
        self.mentor = belum
        baris = self.baris_admin()
        self.assertEqual(baris["mentor_status"], "INCOMPLETE")
        self.assertTrue(baris["mentor_missing_fields"])
        self.assertNotIn(str(belum.id), self.nama_di_direktori())
        self.assertEqual(self.checkout().status_code, 400)

    def test_admin_nonaktifkan_lalu_aktifkan_lagi(self):
        r = self.patch_json(self.url, {"is_mentor_active": False}, user=self.admin)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()["user"]["mentor_status"], "DISABLED")
        self.assertEqual(r.json()["user"]["status"], "ACTIVE", "status akun gak ikut berubah")
        self.assertNotIn(str(self.mentor.id), self.nama_di_direktori())
        self.assertEqual(self.checkout().status_code, 400)
        self.assertTrue(Notification.objects.filter(user=self.mentor.user, title="Status Mentor Dinonaktifkan").exists())
        # Mentor-nya sendiri tetap bisa login & pakai dashboard.
        self.assertEqual(self.get("/api/mentors/me/availability/", user=self.mentor.user).status_code, 200)

        r = self.patch_json(self.url, {"is_mentor_active": True}, user=self.admin)
        self.assertEqual(r.json()["user"]["mentor_status"], "ACTIVE")
        self.assertIn(str(self.mentor.id), self.nama_di_direktori())

    def test_nilai_ngawur_ditolak_tanpa_perubahan_setengah(self):
        r = self.patch_json(self.url, {"is_mentor_active": "mungkin", "mentoring_fee_percent_override": 5},
                            user=self.admin)
        self.assertEqual(r.status_code, 400)
        self.mentor.refresh_from_db()
        self.assertTrue(self.mentor.is_mentor_active)
        self.assertIsNone(self.mentor.mentoring_fee_percent_override)

    def test_pilih_mentor_sesi_pemulihan_tolak_mentor_nonaktif(self):
        self.mentor.is_mentor_active = False
        self.mentor.save()
        pembeli = buat_user()
        mentoring = buat_mentoring(sesi=1)
        from products.models import UserLibrary
        lib = UserLibrary.objects.create(user=pembeli, product=mentoring)
        sesi = MentoringSession.objects.create(user_library=lib, mentoring=mentoring.mentoring_detail, order=1)
        r = self.post_json(f"/api/products/my-products/sessions/{sesi.id}/schedule/",
                           {"session_type": "mentoring", "availability_slot_id": str(buat_slot(self.mentor).id)},
                           user=pembeli)
        self.assertEqual(r.status_code, 400, r.content)
        self.assertIn("tidak aktif", r.json()["detail"])
