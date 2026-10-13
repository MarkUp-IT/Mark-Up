"""Pengajuan refund (pembeli) & keputusan admin termasuk persentase potongan."""
from datetime import timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_bootcamp, buat_mentor, buat_mentoring, buat_modul, buat_slot, buat_user, bukti_pdf,
)
from products.models import BootcampSession, MentoringSession, RefundRequest, UserLibrary
from transactions.models import PaymentStatus, Transaction


class RefundBase(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.slot = buat_slot(self.mentor, jam_lagi=72)
        self.mentoring = buat_mentoring(harga=200000, sesi=2)
        self.pembeli = buat_user()
        self.txn = beli_lunas(self, self.pembeli, self.mentoring, self.slot)

    REKENING = {"bank_name": "BCA", "bank_account": "1234567890", "bank_account_holder": "Pembeli Tes"}

    def ajukan(self, alasan="Jadwal saya bentrok", user=None, product=None, **rekening):
        data = {"reason": alasan, **self.REKENING, **rekening}
        return self.post_json(f"/api/products/my-products/{(product or self.mentoring).id}/refund/",
                              data, user=user or self.pembeli)

    def putuskan(self, refund_id, decision="approved", user=None, **extra):
        return self.patch_json(f"/api/products/refund-requests/{refund_id}/",
                               {"decision": decision, "admin_notes": "", **extra}, user=user or self.admin)


class PengajuanTests(RefundBase):
    def test_pengajuan_sukses_dan_admin_dikabari(self):
        r = self.ajukan()
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["status"], "pending")
        self.assertTrue(Notification.objects.filter(user=self.admin, title="Pengajuan Refund Baru").exists())

    def test_alasan_wajib_dan_gak_boleh_cuma_spasi(self):
        self.assertEqual(self.ajukan(alasan="").status_code, 400)
        self.assertEqual(self.ajukan(alasan="    ").status_code, 400)

    def test_rekening_tujuan_wajib_dan_tersimpan(self):
        self.assertEqual(self.ajukan(bank_account="").status_code, 400)
        self.assertEqual(self.ajukan(bank_name="  ").status_code, 400)
        self.assertEqual(self.ajukan(bank_account="nomor-ngawur").status_code, 400)
        self.assertEqual(self.ajukan(bank_account_holder="").status_code, 400)
        self.assertFalse(RefundRequest.objects.exists())
        self.assertEqual(self.ajukan().status_code, 201)
        r = self.get("/api/products/refund-requests/", user=self.admin)
        baris = r.json()["refund_requests"][0]
        self.assertEqual((baris["bank_name"], baris["bank_account"], baris["bank_account_holder"]),
                         ("BCA", "1234567890", "Pembeli Tes"))

    def test_produk_yang_gak_dibeli_404(self):
        self.assertEqual(self.ajukan(user=buat_user()).status_code, 404)

    def test_modul_gak_bisa_direfund(self):
        modul = buat_modul()
        beli_lunas(self, self.pembeli, modul)
        self.assertEqual(self.ajukan(product=modul).status_code, 403)

    def test_gak_bisa_mengajukan_dobel_selagi_masih_diproses(self):
        self.assertEqual(self.ajukan().status_code, 201)
        r = self.ajukan(alasan="Ngajuin lagi")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(RefundRequest.objects.filter(user_library__user=self.pembeli).count(), 1)


class KeputusanAdminTests(RefundBase):
    def setUp(self):
        super().setUp()
        self.refund_id = self.ajukan().json()["id"]

    def test_hanya_admin(self):
        self.assertEqual(self.putuskan(self.refund_id, user=self.pembeli).status_code, 403)

    def test_daftar_menampilkan_total_bayar_dan_perkiraan(self):
        r = self.get("/api/products/refund-requests/", user=self.admin)
        item = r.json()["refund_requests"][0]
        self.assertEqual(Decimal(item["paid_amount"]), Decimal("200000"))
        self.assertEqual(item["admin_fee_percent"], 10)
        self.assertEqual(Decimal(item["refund_amount"]), Decimal("180000"))

    def test_setujui_potongan_default_10_persen(self):
        r = self.putuskan(self.refund_id)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(Decimal(r.json()["refund_amount"]), Decimal("180000"))
        notif = Notification.objects.get(user=self.pembeli, title="Refund Disetujui")
        self.assertIn("Rp180.000", notif.message)
        self.assertIn("10%", notif.message)

    def test_setujui_penuh_0_persen(self):
        r = self.putuskan(self.refund_id, admin_fee_percent=0)
        self.assertEqual(Decimal(r.json()["refund_amount"]), Decimal("200000"))
        self.assertIn("dikembalikan penuh", Notification.objects.get(user=self.pembeli, title="Refund Disetujui").message)

    def test_setujui_100_persen_nominal_nol(self):
        r = self.putuskan(self.refund_id, admin_fee_percent=100)
        self.assertEqual(Decimal(r.json()["refund_amount"]), Decimal("0"))

    def test_persen_gak_valid_ditolak_dan_status_gak_berubah(self):
        for salah in (101, -1, "abc", 12.5):
            r = self.putuskan(self.refund_id, admin_fee_percent=salah)
            self.assertEqual(r.status_code, 400, f"persen {salah!r} harusnya ditolak")
        self.assertEqual(RefundRequest.objects.get(id=self.refund_id).status, "pending")

    def unggah_bukti(self, berkas=None, user=None):
        return self.post_form(f"/api/products/refund-requests/{self.refund_id}/proof/",
                              {"transfer_proof": berkas or bukti_pdf("transfer.pdf")}, user=user or self.admin)

    def test_bukti_transfer_cuma_setelah_disetujui_dan_terlihat_pembeli(self):
        self.assertEqual(self.unggah_bukti().status_code, 400, "masih pending -> belum boleh")
        self.putuskan(self.refund_id, admin_fee_percent=10)
        self.assertEqual(self.unggah_bukti(user=self.pembeli).status_code, 403)
        palsu = SimpleUploadedFile("bukti.pdf", b"bukan pdf", content_type="application/pdf")
        self.assertEqual(self.unggah_bukti(berkas=palsu).status_code, 400)
        r = self.unggah_bukti()
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(r.json()["transfer_proof_url"])
        self.assertTrue(Notification.objects.filter(user=self.pembeli, title="Dana Refund Sudah Ditransfer").exists())
        # Pembeli melihatnya di halaman Transaksi (akses produknya sudah dicabut).
        trx = self.get("/api/transactions/me/transactions/", user=self.pembeli).json()["transactions"]
        info = next(t for t in trx if t["transaction_id"] == self.txn.id)["refund"]
        self.assertEqual(Decimal(info["amount"]), Decimal("180000"))
        self.assertTrue(info["transfer_proof_url"])

    def test_setujui_mengurangi_jumlah_terjual(self):
        detail = self.mentoring.mentoring_detail
        detail.refresh_from_db()
        sebelum = detail.sold_count
        self.assertEqual(sebelum, 1)
        self.putuskan(self.refund_id)
        detail.refresh_from_db()
        self.assertEqual(detail.sold_count, 0)

    def test_setujui_mencabut_akses_melepas_slot_dan_transaksi_refunded(self):
        self.putuskan(self.refund_id)
        self.assertTrue(UserLibrary.objects.get(user=self.pembeli, product=self.mentoring).is_revoked)
        self.assertEqual(Transaction.objects.get(id=self.txn.id).payment_status, PaymentStatus.REFUNDED)
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_booked)
        # slotnya bisa dipesan orang lain lagi
        r = self.post_form("/api/transactions/checkout/", {
            "product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
            "proof_of_payment": bukti_pdf()}, user=buat_user())
        self.assertEqual(r.status_code, 201, r.content)

    def test_tolak_akses_tetap_ada(self):
        r = self.putuskan(self.refund_id, decision="rejected")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(UserLibrary.objects.get(user=self.pembeli, product=self.mentoring).is_revoked)
        self.assertTrue(Notification.objects.filter(user=self.pembeli, title="Refund Ditolak").exists())

    def test_gak_bisa_diputuskan_dua_kali(self):
        self.assertEqual(self.putuskan(self.refund_id).status_code, 200)
        self.assertEqual(self.putuskan(self.refund_id, decision="rejected").status_code, 400)


class AturanKebijakanRefundTests(RefundBase):
    """Aturan di halaman /refund-policy: 48 jam setelah lunas, mentoring maks
    24 jam sebelum sesi, bootcamp final begitu sesi ke-2 dimulai."""

    def detail_refund(self, product=None):
        r = self.get(f"/api/products/my-products/{(product or self.mentoring).id}/", user=self.pembeli)
        return r.json()["refund"]

    def test_lewat_48_jam_setelah_lunas_ditolak(self):
        Transaction.objects.filter(id=self.txn.id).update(paid_at=timezone.now() - timedelta(hours=49))
        r = self.ajukan()
        self.assertEqual(r.status_code, 400)
        self.assertIn("48 jam", r.json()["detail"])
        self.assertFalse(self.detail_refund()["eligible"])

    def test_batas_khusus_menggantikan_48_jam(self):
        Transaction.objects.filter(id=self.txn.id).update(
            paid_at=timezone.now() - timedelta(days=5), refund_deadline=timezone.now() + timedelta(days=3))
        self.assertEqual(self.ajukan().status_code, 201)

    def test_mentoring_kurang_dari_24_jam_sebelum_sesi_ditolak(self):
        sesi = MentoringSession.objects.get(user_library__user=self.pembeli, order=1)
        MentoringSession.objects.filter(id=sesi.id).update(start_time=timezone.now() + timedelta(hours=20))
        r = self.ajukan()
        self.assertEqual(r.status_code, 400)
        self.assertIn("24 jam", r.json()["detail"])

    def test_mentoring_detail_menampilkan_batas_waktu(self):
        info = self.detail_refund()
        self.assertTrue(info["eligible"])
        # sesi 72 jam lagi -> batasnya 48 jam setelah lunas (lebih dulu dari 72-24).
        self.assertIsNotNone(info["deadline"])
        self.assertIsNone(info["last_request"])
        self.ajukan()
        info = self.detail_refund()
        self.assertFalse(info["eligible"])
        self.assertEqual(info["last_request"]["status"], "pending")

    def test_mentoring_setelah_ada_sesi_selesai_ditolak(self):
        sesi = MentoringSession.objects.get(user_library__user=self.pembeli, order=1)
        self.patch_json(f"/api/products/mentoring-orders/sessions/{sesi.id}/", {"status": "completed"},
                        user=self.admin)
        self.assertEqual(self.ajukan().status_code, 400)

    def test_bootcamp_final_setelah_sesi_kedua_dimulai(self):
        bootcamp, paket = buat_bootcamp()
        lib = UserLibrary.objects.create(user=self.pembeli, product=bootcamp, package=paket)
        sekarang = timezone.now()
        for i, jam in enumerate((-48, 24)):
            BootcampSession.objects.create(user_library=lib, bootcamp=bootcamp.bootcamp_detail, order=i + 1,
                                           start_time=sekarang + timedelta(hours=jam))
        self.assertEqual(self.ajukan(product=bootcamp).status_code, 201, "baru 1 sesi berjalan -> masih boleh")
        RefundRequest.objects.all().delete()
        BootcampSession.objects.filter(user_library=lib, order=2).update(start_time=sekarang - timedelta(hours=1))
        r = self.ajukan(product=bootcamp)
        self.assertEqual(r.status_code, 400)
        self.assertIn("sesi ke-2", r.json()["detail"])
