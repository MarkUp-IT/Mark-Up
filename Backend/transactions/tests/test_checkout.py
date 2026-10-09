"""Checkout produk (mentoring/modul), verifikasi admin, & pembatalan."""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import (
    ApiTestCase, buat_admin, buat_bootcamp, buat_expertise, buat_mentor, buat_mentoring, buat_modul,
    buat_referral, buat_slot, buat_user, bukti_pdf, nyalakan_ipaymu,
)
from products.models import MentoringSession, UserLibrary
from transactions.models import PaymentGateway, PaymentStatus, ReferralCodeUsage, Transaction
from transactions.views import RESERVATION_MINUTES

URL = "/api/transactions/checkout/"


class CheckoutDasarTests(ApiTestCase):
    def setUp(self):
        self.bcc = buat_expertise("BCC")
        self.mentor = buat_mentor(expertise=[self.bcc])
        self.slot = buat_slot(self.mentor)
        self.mentoring = buat_mentoring(harga=100000, sesi=2, expertise=[self.bcc])
        self.pembeli = buat_user()

    def checkout(self, user=None, **data):
        payload = {"product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
                   "proof_of_payment": bukti_pdf()}
        payload.update(data)
        payload = {k: v for k, v in payload.items() if v is not None}
        return self.post_form(URL, payload, user=user or self.pembeli)

    def test_tanpa_login_401(self):
        self.assertEqual(self.client.post(URL, {}).status_code, 401)

    def test_profil_belum_lengkap_ditolak(self):
        r = self.checkout(user=buat_user(lengkap=False))
        self.assertEqual(r.status_code, 400)
        self.assertIn("profil", r.json()["detail"].lower())

    def test_mentoring_manual_sukses_slot_terkunci_belum_dapat_akses(self):
        r = self.checkout()
        self.assertEqual(r.status_code, 201, r.content)
        txn = Transaction.objects.get(id=r.json()["transaction_id"])
        self.assertEqual(txn.payment_status, PaymentStatus.PENDING)
        self.assertEqual(txn.gateway, PaymentGateway.MANUAL)
        self.assertEqual(txn.grand_total, Decimal("100000"))
        self.assertIsNone(txn.expires_at)
        self.slot.refresh_from_db()
        self.assertTrue(self.slot.is_booked)
        self.assertFalse(UserLibrary.objects.filter(user=self.pembeli).exists())

    def test_slot_yang_sama_gak_bisa_dipesan_dua_orang(self):
        self.assertEqual(self.checkout().status_code, 201)
        r = self.checkout(user=buat_user(), proof_of_payment=bukti_pdf())
        self.assertEqual(r.status_code, 400)

    def test_mentoring_wajib_pilih_slot(self):
        self.assertEqual(self.checkout(availability_slot_id="").status_code, 400)

    def test_bootcamp_gak_boleh_lewat_checkout_biasa(self):
        product, _ = buat_bootcamp()
        r = self.checkout(product_id=str(product.id))
        self.assertEqual(r.status_code, 400)

    def test_produk_nonaktif_ditolak(self):
        nonaktif = buat_mentoring(aktif=False)
        self.assertEqual(self.checkout(product_id=str(nonaktif.id)).status_code, 400)

    def test_manual_wajib_bukti_dan_format_bukti_dicek(self):
        self.assertEqual(self.checkout(proof_of_payment=None).status_code, 400)
        from django.core.files.uploadedfile import SimpleUploadedFile
        exe = SimpleUploadedFile("virus.exe", b"MZ....", content_type="application/octet-stream")
        self.assertEqual(self.checkout(proof_of_payment=exe).status_code, 400)
        pdf_palsu = SimpleUploadedFile("bukti.pdf", b"bukan pdf", content_type="application/pdf")
        self.assertEqual(self.checkout(proof_of_payment=pdf_palsu).status_code, 400)

    def test_slot_yang_sudah_lewat_gak_bisa_dipesan(self):
        lewat = buat_slot(self.mentor, jam_lagi=-5)
        r = self.checkout(availability_slot_id=str(lewat.id))
        self.assertEqual(r.status_code, 400, "slot di masa lalu harus ditolak")

    def test_slot_mentor_yang_keahliannya_gak_cocok_ditolak(self):
        mentor_lain = buat_mentor(expertise=[buat_expertise("Karir")])
        slot_lain = buat_slot(mentor_lain)
        r = self.checkout(availability_slot_id=str(slot_lain.id))
        self.assertEqual(r.status_code, 400, "mentor di luar kategori produk harus ditolak")
        slot_lain.refresh_from_db()
        self.assertFalse(slot_lain.is_booked)


class CheckoutModulTests(ApiTestCase):
    def setUp(self):
        self.pembeli = buat_user()

    def test_stok_berkurang_dan_habis_ditolak(self):
        modul = buat_modul(stok=1)
        r = self.post_form(URL, {"product_id": str(modul.id), "proof_of_payment": bukti_pdf()}, user=self.pembeli)
        self.assertEqual(r.status_code, 201, r.content)
        modul.module_detail.refresh_from_db()
        self.assertEqual(modul.module_detail.stock, 0)
        r = self.post_form(URL, {"product_id": str(modul.id), "proof_of_payment": bukti_pdf()}, user=buat_user())
        self.assertEqual(r.status_code, 400)


class CheckoutReferralTests(ApiTestCase):
    def setUp(self):
        self.mentor = buat_mentor()
        self.mentoring = buat_mentoring(harga=100000)
        self.pembeli = buat_user()

    def checkout(self, slot, kode, user=None):
        return self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(slot.id),
                                    "voucher_code": kode, "proof_of_payment": bukti_pdf()}, user=user or self.pembeli)

    def test_diskon_dipotong_dan_kuota_tercatat(self):
        kode = buat_referral(persen=10, kuota=5)
        r = self.checkout(buat_slot(self.mentor), kode.code.lower())
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(Decimal(r.json()["grand_total"]), Decimal("90000"))
        kode.refresh_from_db()
        self.assertEqual(kode.used_count, 1)
        self.assertTrue(ReferralCodeUsage.objects.filter(referral_code=kode, user=self.pembeli).exists())

    def test_satu_user_gak_bisa_pakai_kode_yang_sama_dua_kali(self):
        kode = buat_referral(kuota=5)
        self.assertEqual(self.checkout(buat_slot(self.mentor), kode.code).status_code, 201)
        self.assertEqual(self.checkout(buat_slot(self.mentor), kode.code).status_code, 400)

    def test_kuota_habis_ditolak(self):
        kode = buat_referral(kuota=1)
        self.assertEqual(self.checkout(buat_slot(self.mentor), kode.code).status_code, 201)
        self.assertEqual(self.checkout(buat_slot(self.mentor), kode.code, user=buat_user()).status_code, 400)

    def test_kode_tidak_ada_ditolak(self):
        self.assertEqual(self.checkout(buat_slot(self.mentor), "GAKADA").status_code, 400)

    def test_REGRESI_kuota_gak_bocor_kalau_checkout_gagal(self):
        """Dulu: kuota kode dinaikkan duluan, lalu checkout gagal (slot sudah
        dibooking) lewat `return` biasa di dalam blok atomic -> kenaikan
        kuota ikut tersimpan walau gak ada transaksi."""
        kode = buat_referral(kuota=5)
        slot_terisi = buat_slot(self.mentor, booked=True)
        r = self.checkout(slot_terisi, kode.code)
        self.assertEqual(r.status_code, 400)
        kode.refresh_from_db()
        self.assertEqual(kode.used_count, 0, "kuota referral terpakai padahal checkout gagal")


class CheckoutIpaymuTests(ApiTestCase):
    def setUp(self):
        self.mentor = buat_mentor()
        self.mentoring = buat_mentoring()
        self.pembeli = buat_user()

    def test_ipaymu_mati_ditolak(self):
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(buat_slot(self.mentor).id),
                                 "payment_gateway": "IPAYMU"}, user=self.pembeli)
        self.assertEqual(r.status_code, 400)

    def test_ipaymu_nyala_tanpa_bukti_dan_ada_batas_waktu(self):
        nyalakan_ipaymu()
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(buat_slot(self.mentor).id),
                                 "payment_gateway": "IPAYMU"}, user=self.pembeli)
        self.assertEqual(r.status_code, 201, r.content)
        txn = Transaction.objects.get(id=r.json()["transaction_id"])
        self.assertEqual(txn.gateway, PaymentGateway.IPAYMU)
        sisa = (txn.expires_at - timezone.now()).total_seconds() / 60
        self.assertAlmostEqual(sisa, RESERVATION_MINUTES, delta=1)
        self.assertEqual(RESERVATION_MINUTES, 15)


class VerifikasiAdminTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.slot = buat_slot(self.mentor)
        self.mentoring = buat_mentoring(sesi=3)
        self.pembeli = buat_user()
        self.kode = buat_referral(kuota=5)
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
                                 "voucher_code": self.kode.code, "proof_of_payment": bukti_pdf()}, user=self.pembeli)
        self.txn_id = r.json()["transaction_id"]

    def verify(self, decision, user=None):
        return self.patch_json(f"/api/transactions/{self.txn_id}/verify/", {"decision": decision}, user=user or self.admin)

    def test_hanya_admin(self):
        self.assertEqual(self.verify("paid", user=self.pembeli).status_code, 403)
        self.assertEqual(self.verify("paid", user=self.mentor.user).status_code, 403)

    def test_lunas_memberi_akses_sesi_dan_notifikasi(self):
        self.assertEqual(self.verify("paid").status_code, 200)
        self.assertEqual(Transaction.objects.get(id=self.txn_id).payment_status, PaymentStatus.PAID)
        lib = UserLibrary.objects.get(user=self.pembeli, product=self.mentoring)
        sesi = list(MentoringSession.objects.filter(user_library=lib).order_by("order"))
        self.assertEqual(len(sesi), 3)
        self.assertEqual(sesi[0].status, "scheduled")
        self.assertEqual(sesi[0].availability_slot, self.slot)
        self.assertTrue(all(s.mentor_id == self.mentor.id for s in sesi))
        self.mentoring.mentoring_detail.refresh_from_db()
        self.assertEqual(self.mentoring.mentoring_detail.sold_count, 1)
        self.assertTrue(Notification.objects.filter(user=self.pembeli, title="Pembayaran Lunas").exists())
        self.assertTrue(Notification.objects.filter(user=self.mentor.user, title="Booking Baru").exists())

    def test_ditolak_melepas_slot_dan_kuota_referral(self):
        self.assertEqual(self.verify("failed").status_code, 200)
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_booked)
        self.kode.refresh_from_db()
        self.assertEqual(self.kode.used_count, 0)
        self.assertFalse(UserLibrary.objects.filter(user=self.pembeli).exists())
        # slotnya bisa dipesan orang lain lagi
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
                                 "proof_of_payment": bukti_pdf()}, user=buat_user())
        self.assertEqual(r.status_code, 201, r.content)

    def test_gak_bisa_diverifikasi_dua_kali(self):
        self.assertEqual(self.verify("paid").status_code, 200)
        self.assertEqual(self.verify("failed").status_code, 400)
        self.assertEqual(UserLibrary.objects.filter(user=self.pembeli).count(), 1)


class BatalkanTransaksiTests(ApiTestCase):
    def setUp(self):
        self.mentor = buat_mentor()
        self.slot = buat_slot(self.mentor)
        self.mentoring = buat_mentoring()
        self.pembeli = buat_user()
        nyalakan_ipaymu()
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
                                 "payment_gateway": "IPAYMU"}, user=self.pembeli)
        self.txn_id = r.json()["transaction_id"]

    def test_pembeli_membatalkan_melepas_slot(self):
        r = self.post_json(f"/api/transactions/{self.txn_id}/cancel/", user=self.pembeli)
        self.assertEqual(r.status_code, 200)
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_booked)

    def test_orang_lain_gak_bisa_membatalkan(self):
        r = self.post_json(f"/api/transactions/{self.txn_id}/cancel/", user=buat_user())
        self.assertEqual(r.status_code, 404)

    def test_transaksi_manual_yang_sudah_ada_bukti_gak_bisa_dibatalkan_pembeli(self):
        """Bukti transfer sudah diunggah = uangnya sudah dikirim. Kalau pembeli
        bisa membatalkan sendiri, transaksinya jadi GAGAL padahal dananya sudah
        masuk -> admin gak lagi lihat ada yang perlu diverifikasi."""
        slot = buat_slot(self.mentor)
        r = self.post_form(URL, {"product_id": str(self.mentoring.id), "availability_slot_id": str(slot.id),
                                 "proof_of_payment": bukti_pdf()}, user=self.pembeli)
        r = self.post_json(f"/api/transactions/{r.json()['transaction_id']}/cancel/", user=self.pembeli)
        self.assertEqual(r.status_code, 400)


class BadgeTransaksiPembeliTests(ApiTestCase):
    """Badge sidebar "Transaksi": nyala saat admin menolak, padam begitu
    pembeli membuka halaman Transaksi (dulu gak pernah padam)."""

    def setUp(self):
        self.admin = buat_admin()
        self.pembeli = buat_user()
        self.mentoring = buat_mentoring()

    def badge(self):
        return self.get("/api/accounts/me/sidebar-badges/", user=self.pembeli).json()["transactions"]

    def test_ditolak_lalu_dilihat_badge_padam(self):
        r = self.post_form("/api/transactions/checkout/", {
            "product_id": str(self.mentoring.id), "availability_slot_id": str(buat_slot(buat_mentor()).id),
            "proof_of_payment": bukti_pdf()}, user=self.pembeli)
        self.patch_json(f"/api/transactions/{r.json()['transaction_id']}/verify/", {"decision": "failed"},
                        user=self.admin)
        self.assertEqual(self.badge(), 1)
        self.assertEqual(self.get("/api/transactions/me/transactions/", user=self.pembeli).status_code, 200)
        self.assertEqual(self.badge(), 0)

    def test_badge_admin_transaksi_cuma_transfer_manual(self):
        nyalakan_ipaymu()
        Transaction.objects.create(user=self.pembeli, sub_total=1000, grand_total=1000,
                                   gateway=PaymentGateway.IPAYMU)
        r = self.get("/api/accounts/admin/sidebar-badges/", user=self.admin)
        self.assertEqual(r.json()["transactions"], 0, "iPaymu PENDING nunggu pembeli, bukan tugas admin")
