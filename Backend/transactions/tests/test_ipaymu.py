"""Alur iPaymu: webhook (dikonfirmasi ke API), cron kedaluwarsa, pemulihan
pembayaran telat, polling status, & sesi redirect. Semua panggilan ke
server iPaymu di-mock -- tes gak pernah nembak iPaymu asli."""
from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.core.cache import cache
from django.core.management import call_command
from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import (
    ApiTestCase, buat_admin, buat_mentor, buat_mentoring, buat_modul, buat_slot, buat_user, nyalakan_ipaymu,
)
from products.models import MentoringSession, UserLibrary
from transactions.models import PaymentMethod, PaymentStatus, Transaction

CHECKOUT = "/api/transactions/checkout/"
WEBHOOK = "/api/transactions/ipaymu/webhook/"
FETCH = "mark_up.ipaymu.fetch_paid_entry"


def lunas(txn, amount=None):
    """Bentuk entri /history iPaymu yang LUNAS (dicocokkan ke response asli)."""
    return {"TransactionId": 123, "ReferenceId": txn.id, "Status": 1, "StatusDesc": "Berhasil",
            "PaidStatus": "paid", "Amount": int(amount if amount is not None else txn.grand_total),
            "PaymentMethod": "qris", "PaymentChannel": "QRIS"}, None


class IpaymuBase(ApiTestCase):
    def setUp(self):
        cache.clear()
        nyalakan_ipaymu()
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.slot = buat_slot(self.mentor)
        self.mentoring = buat_mentoring(harga=150000, sesi=2)
        self.pembeli = buat_user()
        r = self.post_form(CHECKOUT, {"product_id": str(self.mentoring.id), "availability_slot_id": str(self.slot.id),
                                      "payment_gateway": "IPAYMU"}, user=self.pembeli)
        self.assertEqual(r.status_code, 201, r.content)
        self.txn = Transaction.objects.get(id=r.json()["transaction_id"])

    def webhook(self, status_code="1"):
        body = f"trx_id=999&reference_id={self.txn.id}&status=berhasil&status_code={status_code}&amount=150000"
        return self.client.post(WEBHOOK, body, content_type="application/x-www-form-urlencoded")

    def kedaluwarsakan(self):
        Transaction.objects.filter(pk=self.txn.pk).update(expires_at=timezone.now() - timedelta(minutes=1))


class WebhookTests(IpaymuBase):
    def test_webhook_terkonfirmasi_api_memberi_akses(self):
        with mock.patch(FETCH, return_value=lunas(self.txn)):
            self.assertEqual(self.webhook().status_code, 200)
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PAID)
        self.assertEqual(self.txn.payment_method, PaymentMethod.QRIS)
        self.assertEqual(self.txn.ipaymu_last_webhook["status_code"], "1")
        self.assertTrue(UserLibrary.objects.filter(user=self.pembeli, product=self.mentoring).exists())

    def test_KEAMANAN_webhook_palsu_gak_memberi_akses(self):
        with mock.patch(FETCH, return_value=(None, None)):
            self.assertEqual(self.webhook().status_code, 200)
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PENDING)
        self.assertFalse(UserLibrary.objects.filter(user=self.pembeli).exists())

    def test_ipaymu_gak_bisa_dihubungi_status_tetap(self):
        with mock.patch(FETCH, return_value=(None, "timeout")):
            self.assertEqual(self.webhook().status_code, 200)
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PENDING)

    def test_nominal_kurang_gak_diberi_akses_dan_admin_dikabari(self):
        with mock.patch(FETCH, return_value=lunas(self.txn, amount=1000)):
            self.webhook()
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PENDING)
        self.assertTrue(Notification.objects.filter(user=self.admin, title__icontains="Nominal iPaymu Kurang").exists())

    def test_reference_gak_dikenal_diabaikan(self):
        r = self.client.post(WEBHOOK, "reference_id=TESTCONN-xx&status_code=1",
                             content_type="application/x-www-form-urlencoded")
        self.assertEqual(r.status_code, 200)

    def test_webhook_dobel_gak_memberi_akses_dobel(self):
        with mock.patch(FETCH, return_value=lunas(self.txn)):
            self.webhook()
            self.webhook()
        self.assertEqual(UserLibrary.objects.filter(user=self.pembeli).count(), 1)
        self.assertEqual(MentoringSession.objects.filter(user_library__user=self.pembeli).count(), 2)


class KedaluwarsaTests(IpaymuBase):
    def test_kedaluwarsa_belum_bayar_melepas_slot(self):
        self.kedaluwarsakan()
        with mock.patch(FETCH, return_value=(None, None)):
            call_command("expire_stale_transactions")
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.EXPIRED)
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_booked)

    def test_REGRESI_sudah_bayar_tapi_webhook_gagal_jadi_lunas_bukan_kedaluwarsa(self):
        self.kedaluwarsakan()
        with mock.patch(FETCH, return_value=lunas(self.txn)):
            call_command("expire_stale_transactions")
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PAID)

    def test_ipaymu_mati_tetap_dikedaluwarsakan(self):
        self.kedaluwarsakan()
        with mock.patch(FETCH, return_value=(None, "timeout")):
            call_command("expire_stale_transactions")
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.EXPIRED)

    def test_belum_lewat_batas_gak_disentuh(self):
        with mock.patch(FETCH) as fetch:
            call_command("expire_stale_transactions")
            fetch.assert_not_called()
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PENDING)


class PembayaranTelatTests(IpaymuBase):
    def test_mentoring_telat_dipulihkan_pembeli_pilih_mentor_sendiri(self):
        self.kedaluwarsakan()
        with mock.patch(FETCH, return_value=(None, None)):
            call_command("expire_stale_transactions")
        with mock.patch(FETCH, return_value=lunas(self.txn)):
            self.webhook()
        self.txn.refresh_from_db()
        self.assertEqual(self.txn.payment_status, PaymentStatus.PAID)
        sesi = MentoringSession.objects.filter(user_library__user=self.pembeli)
        self.assertEqual(sesi.count(), 2)
        self.assertTrue(all(s.mentor_id is None and s.status == "waiting_schedule" for s in sesi))
        self.assertTrue(Notification.objects.filter(user=self.pembeli, title="Pilih Mentor & Jadwal Mentoring").exists())

    def test_modul_telat_stok_diambil_lagi_atau_ke_admin_kalau_habis(self):
        modul = buat_modul(stok=1)
        r = self.post_form(CHECKOUT, {"product_id": str(modul.id), "payment_gateway": "IPAYMU"}, user=self.pembeli)
        txn = Transaction.objects.get(id=r.json()["transaction_id"])
        Transaction.objects.filter(pk=txn.pk).update(expires_at=timezone.now() - timedelta(minutes=1))
        with mock.patch(FETCH, return_value=(None, None)):
            call_command("expire_stale_transactions")
        modul.module_detail.refresh_from_db()
        self.assertEqual(modul.module_detail.stock, 1)
        # stoknya keburu dibeli orang lain
        ModuleDetail = type(modul.module_detail)
        ModuleDetail.objects.filter(pk=modul.module_detail.pk).update(stock=0)
        cache.clear()
        with mock.patch(FETCH, return_value=lunas(txn)):
            self.client.post(WEBHOOK, f"reference_id={txn.id}&status_code=1",
                             content_type="application/x-www-form-urlencoded")
        txn.refresh_from_db()
        self.assertEqual(txn.payment_status, PaymentStatus.EXPIRED)
        self.assertTrue(Notification.objects.filter(user=self.admin, title__icontains="Terlambat").exists())


class PollingStatusTests(IpaymuBase):
    def test_polling_langsung_lunas_tanpa_nunggu_webhook(self):
        with mock.patch(FETCH, return_value=lunas(self.txn)):
            r = self.get(f"/api/transactions/{self.txn.id}/status/", user=self.pembeli)
        self.assertEqual(r.json()["payment_status"], PaymentStatus.PAID)

    def test_polling_dibatasi_gak_nembak_ipaymu_tiap_request(self):
        with mock.patch(FETCH, return_value=(None, None)) as fetch:
            for _ in range(5):
                self.get(f"/api/transactions/{self.txn.id}/status/", user=self.pembeli)
            self.assertEqual(fetch.call_count, 1)

    def test_orang_lain_gak_bisa_lihat_status(self):
        r = self.get(f"/api/transactions/{self.txn.id}/status/", user=buat_user())
        self.assertEqual(r.status_code, 404)


class SesiRedirectTests(IpaymuBase):
    def test_sesi_redirect_ikut_sisa_waktu_reservasi(self):
        with mock.patch("mark_up.ipaymu.create_payment_session", return_value=("sid", "https://ipaymu", None)) as buat:
            r = self.post_json(f"/api/transactions/{self.txn.id}/ipaymu/create-session/", user=self.pembeli)
        self.assertEqual(r.status_code, 200, r.content)
        kwargs = buat.call_args.kwargs
        self.assertEqual(kwargs["expired_type"], "minutes")
        self.assertLessEqual(kwargs["expired_hours"], 15)

    def test_sisa_waktu_habis_ditolak(self):
        Transaction.objects.filter(pk=self.txn.pk).update(expires_at=timezone.now() + timedelta(seconds=20))
        with mock.patch("mark_up.ipaymu.create_payment_session") as buat:
            r = self.post_json(f"/api/transactions/{self.txn.id}/ipaymu/create-session/", user=self.pembeli)
            buat.assert_not_called()
        self.assertEqual(r.status_code, 400)
