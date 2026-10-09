"""Alur bootcamp: daftar -> ditinjau admin -> bayar -> akses (+ anggota tim)."""
from datetime import timedelta
from decimal import Decimal

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import ApiTestCase, buat_admin, buat_bootcamp, buat_referral, buat_user, bukti_pdf
from products.models import BootcampPackage, BootcampRegistration, BootcampSession, UserLibrary
from programs.models import BootcampSession as SesiTemplate
from transactions.models import PaymentStatus, Transaction

DAFTAR = "/api/products/bootcamp-register/"


def pdf(nama="dok.pdf"):
    return SimpleUploadedFile(nama, b"%PDF-1.4 dokumen tes", content_type="application/pdf")


class BootcampBase(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.product, self.paket = buat_bootcamp(stok=10, price=200000, commitment_fee=Decimal(50000))
        self.detail = self.product.bootcamp_detail
        SesiTemplate.objects.create(bootcamp=self.detail, title="Sesi 1", order=1,
                                    start_time=timezone.now() + timedelta(days=7))
        SesiTemplate.objects.create(bootcamp=self.detail, title="Sesi 2", order=2,
                                    start_time=timezone.now() + timedelta(days=14))
        self.pendaftar = buat_user()

    def daftar(self, user=None, **extra):
        data = {"package_id": str(self.paket.id), "requirement_doc": pdf(), "cv": pdf("cv.pdf"),
                "commitment_letter": pdf("commitment.pdf")}
        data.update(extra)
        return self.post_form(DAFTAR, {k: v for k, v in data.items() if v is not None}, user=user or self.pendaftar)

    def tinjau(self, reg_id, decision="accepted"):
        return self.patch_json(f"/api/products/bootcamp-registrations/{reg_id}/review/",
                               {"decision": decision, "admin_notes": ""}, user=self.admin)

    def bayar(self, reg_id, user=None, **extra):
        data = {"proof_of_payment": bukti_pdf()}
        data.update(extra)
        return self.post_form(f"/api/products/bootcamp-registrations/{reg_id}/pay/",
                              {k: v for k, v in data.items() if v is not None}, user=user or self.pendaftar)

    def daftar_diterima(self, user=None):
        r = self.daftar(user=user)
        self.assertEqual(r.status_code, 201, r.content)
        reg_id = BootcampRegistration.objects.get(user=user or self.pendaftar, package=self.paket).id
        self.assertEqual(self.tinjau(reg_id).status_code, 200)
        return reg_id


class PendaftaranTests(BootcampBase):
    def test_daftar_sukses_admin_dikabari(self):
        r = self.daftar()
        self.assertEqual(r.status_code, 201, r.content)
        self.assertTrue(Notification.objects.filter(user=self.admin, title__startswith="Pendaftaran Bootcamp Baru").exists())

    def test_dokumen_wajib_dan_harus_pdf(self):
        self.assertEqual(self.daftar(requirement_doc=None).status_code, 400)
        self.assertEqual(self.daftar(cv=None).status_code, 400)
        bukan_pdf = SimpleUploadedFile("dok.docx", b"x", content_type="application/msword")
        self.assertEqual(self.daftar(requirement_doc=bukan_pdf).status_code, 400)

    def test_gak_bisa_daftar_dua_kali_paket_yang_sama(self):
        self.assertEqual(self.daftar().status_code, 201)
        self.assertEqual(self.daftar().status_code, 400)

    def test_satu_orang_satu_paket_per_bootcamp(self):
        paket_lain = BootcampPackage.objects.create(bootcamp=self.detail, slug="elite-tes", name="Elite",
                                                    price=Decimal(300000))
        self.assertEqual(self.daftar().status_code, 201)
        r = self.daftar(package_id=str(paket_lain.id))
        self.assertEqual(r.status_code, 400)
        self.assertIn("satu paket", r.json()["detail"])
        # Kalau pendaftaran pertamanya DITOLAK, boleh coba paket lain.
        reg = BootcampRegistration.objects.get(user=self.pendaftar, package=self.paket)
        self.assertEqual(self.tinjau(reg.id, decision="rejected").status_code, 200)
        self.assertEqual(self.daftar(package_id=str(paket_lain.id)).status_code, 201)

    def test_pendaftaran_belum_dibuka_atau_sudah_tutup(self):
        self.paket.registration_opens_at = timezone.now() + timedelta(days=1)
        self.paket.save()
        self.assertEqual(self.daftar().status_code, 400)
        self.paket.registration_opens_at = None
        self.paket.registration_closes_at = timezone.now() - timedelta(days=1)
        self.paket.save()
        self.assertEqual(self.daftar().status_code, 400)


class TinjauanAdminTests(BootcampBase):
    def test_diterima_kirim_email_dan_notifikasi_sekali(self):
        self.daftar()
        reg = BootcampRegistration.objects.get(user=self.pendaftar)
        mail.outbox.clear()
        self.assertEqual(self.tinjau(reg.id).status_code, 200)
        self.assertEqual(BootcampRegistration.objects.get(id=reg.id).status, "accepted")
        self.assertEqual(len([m for m in mail.outbox if self.pendaftar.email in m.to]), 1)
        # disentuh ulang dengan keputusan sama -> gak kirim email kedua
        self.tinjau(reg.id)
        self.assertEqual(len([m for m in mail.outbox if self.pendaftar.email in m.to]), 1)

    def test_pendaftaran_yang_sudah_dibayar_gak_bisa_ditolak_begitu_saja(self):
        reg_id = self.daftar_diterima()
        r = self.bayar(reg_id)
        txn = Transaction.objects.get(bootcamp_registration_id=reg_id)
        self.patch_json(f"/api/transactions/{txn.id}/verify/", {"decision": "paid"}, user=self.admin)
        r = self.tinjau(reg_id, "rejected")
        self.assertEqual(r.status_code, 400, "peserta yang sudah lunas gak boleh ditolak -- harus lewat refund")


class PembayaranTests(BootcampBase):
    def test_belum_diterima_gak_bisa_bayar(self):
        self.daftar()
        reg = BootcampRegistration.objects.get(user=self.pendaftar)
        self.assertEqual(self.bayar(reg.id).status_code, 400)

    def test_bayar_termasuk_commitment_fee_lalu_lunas_dapat_akses_dan_sesi(self):
        reg_id = self.daftar_diterima()
        r = self.bayar(reg_id)
        self.assertEqual(r.status_code, 201, r.content)
        txn = Transaction.objects.get(bootcamp_registration_id=reg_id)
        self.assertEqual(txn.grand_total, Decimal("250000"))
        self.assertEqual(txn.commitment_fee_amount, Decimal("50000"))
        self.detail.refresh_from_db()
        self.assertEqual(self.detail.stock, 9)
        self.assertEqual(self.bayar(reg_id).status_code, 400, "pembayaran dobel harus ditolak")

        self.assertEqual(self.patch_json(f"/api/transactions/{txn.id}/verify/", {"decision": "paid"}, user=self.admin).status_code, 200)
        lib = UserLibrary.objects.get(user=self.pendaftar, product=self.product)
        self.assertEqual(lib.package_id, self.paket.id)
        self.assertEqual(BootcampSession.objects.filter(user_library=lib).count(), 2)
        self.detail.refresh_from_db()
        self.assertEqual(self.detail.sold_count, 1)

    def test_lewat_batas_bayar_ditolak(self):
        reg_id = self.daftar_diterima()
        self.paket.payment_deadline_at = timezone.now() - timedelta(hours=1)
        self.paket.save()
        self.assertEqual(self.bayar(reg_id).status_code, 400)

    def test_bukti_bayar_palsu_ditolak_sama_seperti_checkout_biasa(self):
        reg_id = self.daftar_diterima()
        palsu = SimpleUploadedFile("bukti.pdf", b"<html>bukan pdf</html>", content_type="application/pdf")
        self.assertEqual(self.bayar(reg_id, proof_of_payment=palsu).status_code, 400)

    def test_REGRESI_kuota_referral_gak_bocor_kalau_stok_habis(self):
        reg_id = self.daftar_diterima()
        kode = buat_referral(kuota=5, applies_to_all=True)
        type(self.detail).objects.filter(pk=self.detail.pk).update(stock=0)
        r = self.bayar(reg_id, voucher_code=kode.code)
        self.assertEqual(r.status_code, 400)
        kode.refresh_from_db()
        self.assertEqual(kode.used_count, 0)


class TimTests(BootcampBase):
    def setUp(self):
        super().setUp()
        self.paket.group_size = 2
        self.paket.group_price = Decimal(350000)
        self.paket.save()
        self.anggota = buat_user()

    def test_ketua_bayar_anggota_otomatis_dapat_akses(self):
        r = self.daftar(team_member_emails=self.anggota.email)
        self.assertEqual(r.status_code, 201, r.content)
        reg = BootcampRegistration.objects.get(user=self.pendaftar)
        self.tinjau(reg.id)
        r = self.bayar(reg.id)
        self.assertEqual(r.status_code, 201, r.content)
        txn = Transaction.objects.get(bootcamp_registration_id=reg.id)
        self.patch_json(f"/api/transactions/{txn.id}/verify/", {"decision": "paid"}, user=self.admin)
        self.assertTrue(UserLibrary.objects.filter(user=self.anggota, product=self.product).exists())
        reg_anggota = BootcampRegistration.objects.get(user=self.anggota, package__bootcamp=self.detail)
        self.assertEqual(reg_anggota.status, "accepted")
        self.assertTrue(Transaction.objects.filter(user=self.anggota, payment_status=PaymentStatus.PAID).exists())

    def test_anggota_yang_diundang_gak_bisa_daftar_sendiri(self):
        self.daftar(team_member_emails=self.anggota.email)
        r = self.daftar(user=self.anggota)
        self.assertEqual(r.status_code, 400)

    def test_jumlah_anggota_harus_pas(self):
        lain = buat_user()
        r = self.daftar(team_member_emails=f"{self.anggota.email},{lain.email}")
        self.assertEqual(r.status_code, 400)
