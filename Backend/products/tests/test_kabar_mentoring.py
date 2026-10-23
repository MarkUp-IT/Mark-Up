"""Komunikasi mentoring: email + lonceng saat order/jadwal/refund, pengingat
cron (sekali saja), sesi selesai otomatis + koreksi admin, Zoom terbuka, invoice."""
from datetime import timedelta
from decimal import Decimal
from io import StringIO
from unittest import mock

from django.core import mail
from django.core.management import call_command
from django.utils import timezone

from accounts.models import Notification, PesanTerkirim
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_mentor, buat_mentoring, buat_modul, buat_slot, buat_user,
)
from products.models import MentoringSession, UserLibrary, ZoomAccount
from transactions.models import MentorPayout, PayoutStatus


def cron():
    out = StringIO()
    call_command("send_mentoring_reminders", "--execute", stdout=out)
    return out.getvalue()


def surat_untuk(email):
    return [m for m in mail.outbox if email in m.to]


class Dasar(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.pembeli = buat_user()
        self.mentoring = buat_mentoring(harga=200000, sesi=2)

    def beli(self, jam_lagi=72):
        self.slot = buat_slot(self.mentor, jam_lagi=jam_lagi)
        self.txn = beli_lunas(self, self.pembeli, self.mentoring, self.slot)
        self.sesi = list(MentoringSession.objects.filter(user_library__user=self.pembeli).order_by("order"))
        return self.txn


class OrderLunasTests(Dasar):
    def test_pembeli_mentor_dan_tim_dapat_email(self):
        self.beli()
        untuk_pembeli = surat_untuk(self.pembeli.email)
        self.assertEqual(len(untuk_pembeli), 1)
        isi = untuk_pembeli[0].body
        self.assertIn("Pembayaran Lunas", untuk_pembeli[0].subject)
        self.assertIn(f"/invoice/{self.txn.id}", isi)
        self.assertIn("belum dijadwalkan", isi, "sesi ke-2 belum punya jadwal -> pembeli diberi tahu")
        self.assertIn(self.mentor.user.fullname, isi)
        self.assertTrue(untuk_pembeli[0].alternatives, "harus ada versi HTML")

        untuk_mentor = surat_untuk(self.mentor.user.email)
        self.assertEqual(len(untuk_mentor), 1)
        self.assertIn("Booking Baru", untuk_mentor[0].subject)
        self.assertIn(self.pembeli.fullname, untuk_mentor[0].body)

        self.assertTrue(any("Pembayaran Lunas:" in m.subject for m in mail.outbox), "tim MarkUp ikut dikabari")
        # Setiap email punya notifikasi web padanannya.
        self.assertTrue(Notification.objects.filter(user=self.pembeli, title="Pembayaran Lunas").exists())
        self.assertTrue(Notification.objects.filter(user=self.mentor.user, title="Booking Baru").exists())

    def test_modul_cukup_konfirmasi_ke_pembeli(self):
        beli_lunas(self, self.pembeli, buat_modul())
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        # Tim tetap menerima invoice-nya, tapi tidak ada email ke mentor mana pun.
        self.assertEqual(len([m for m in mail.outbox if "Booking Baru" in m.subject]), 0)


class JadwalDanRefundTests(Dasar):
    def test_pilih_jadwal_sesi_kedua_mengabari_dua_pihak(self):
        self.beli()
        MentoringSession.objects.filter(id=self.sesi[0].id).update(status="completed")
        mail.outbox.clear()
        slot2 = buat_slot(self.mentor, jam_lagi=120)
        r = self.post_json(f"/api/products/my-products/sessions/{self.sesi[1].id}/schedule/",
                           {"session_type": "mentoring", "availability_slot_id": str(slot2.id)}, user=self.pembeli)
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(len(surat_untuk(self.mentor.user.email)), 1)
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        self.assertIn("calendar.google.com", surat_untuk(self.pembeli.email)[0].body)

    def test_refund_disetujui_mentor_dikabari_sesinya_batal(self):
        self.beli()
        r = self.post_json(f"/api/products/my-products/{self.mentoring.id}/refund/", {
            "reason": "bentrok", "bank_name": "BCA", "bank_account": "1234567890", "bank_account_holder": "Tes"},
            user=self.pembeli)
        mail.outbox.clear()
        self.patch_json(f"/api/products/refund-requests/{r.json()['id']}/", {"decision": "approved", "admin_notes": ""},
                        user=self.admin)
        untuk_mentor = surat_untuk(self.mentor.user.email)
        self.assertEqual(len(untuk_mentor), 1)
        self.assertIn("Dibatalkan", untuk_mentor[0].subject)


class PengingatTests(Dasar):
    def test_h24_lalu_h3_masing_masing_sekali(self):
        self.beli(jam_lagi=23)
        mail.outbox.clear()
        cron()
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1, "H-24 ke pembeli")
        self.assertEqual(len(surat_untuk(self.mentor.user.email)), 0, "mentor baru diingatkan H-3")
        cron()
        self.assertEqual(len(mail.outbox), 1, "cron jalan lagi -> tidak kirim ulang")

        MentoringSession.objects.filter(id=self.sesi[0].id).update(
            start_time=timezone.now() + timedelta(hours=2), zoom_link="https://zoom.us/j/123")
        mail.outbox.clear()
        cron()
        cron()
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        self.assertEqual(len(surat_untuk(self.mentor.user.email)), 1)
        self.assertIn("https://zoom.us/j/123", surat_untuk(self.mentor.user.email)[0].body)
        self.assertIn("tanpa menunggu host", surat_untuk(self.mentor.user.email)[0].body)

    def test_h3_tanpa_link_zoom_admin_diperingatkan(self):
        self.beli(jam_lagi=2)
        cron()
        self.assertTrue(Notification.objects.filter(user=self.admin, title="Sesi Mentoring Belum Punya Link Zoom").exists())

    def test_belum_pilih_jadwal_hari_1_3_7(self):
        # Pembayaran yang dipulihkan: sesi dibuat tanpa mentor & jadwal.
        lib = UserLibrary.objects.create(user=self.pembeli, product=self.mentoring)
        for i in (1, 2):
            MentoringSession.objects.create(user_library=lib, mentoring=self.mentoring.mentoring_detail, order=i)

        def mundurkan(hari):
            UserLibrary.objects.filter(id=lib.id).update(purchased_at=timezone.now() - timedelta(days=hari, hours=1))
            mail.outbox.clear()
            cron()
            cron()

        mundurkan(0)
        self.assertEqual(len(mail.outbox), 0, "baru beli -> belum diingatkan")
        mundurkan(1)
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        self.assertIn("mentor dan jadwal", surat_untuk(self.pembeli.email)[0].body)
        mundurkan(2)
        self.assertEqual(len(mail.outbox), 0, "hari ke-2 tidak ada pengingat baru")
        mundurkan(3)
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        self.assertTrue(Notification.objects.filter(user=self.admin, title="Pembeli Mentoring Belum Memilih Jadwal").exists())
        mundurkan(7)
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1)
        mundurkan(30)
        self.assertEqual(len(mail.outbox), 0, "setelah hari ke-7 berhenti")

    def test_sesi_berikutnya_tidak_ditagih_selama_sesi_berjalan_belum_lewat(self):
        self.beli()
        UserLibrary.objects.filter(user=self.pembeli).update(purchased_at=timezone.now() - timedelta(days=5))
        mail.outbox.clear()
        cron()
        self.assertEqual(len(mail.outbox), 0, "sesi 1 masih terjadwal -> sesi 2 belum perlu dipilih")


class SelesaiOtomatisTests(Dasar):
    def lewatkan(self, jam):
        # Link manual (tanpa meeting_id) -> dianggap disiapkan admin, boleh selesai otomatis.
        MentoringSession.objects.filter(id=self.sesi[0].id).update(
            start_time=timezone.now() - timedelta(hours=jam), zoom_link="https://zoom.us/j/manual")

    def test_selesai_otomatis_menerbitkan_honor_sekali(self):
        self.beli()
        self.lewatkan(2)   # 60 menit sesi + jeda 2 jam belum lewat
        cron()
        self.assertEqual(MentoringSession.objects.get(id=self.sesi[0].id).status, "scheduled")
        self.lewatkan(4)
        mail.outbox.clear()
        cron()
        cron()
        self.assertEqual(MentoringSession.objects.get(id=self.sesi[0].id).status, "completed")
        self.assertEqual(MentorPayout.objects.filter(mentoring_session=self.sesi[0]).count(), 1)
        self.assertEqual(MentorPayout.objects.get(mentoring_session=self.sesi[0]).gross_amount, Decimal("100000"))
        self.assertEqual(len(surat_untuk(self.pembeli.email)), 1, "diminta feedback + diajak jadwalkan berikutnya")
        surat = surat_untuk(self.pembeli.email)[0]
        self.assertIn("Bagaimana Sesi Mentoringmu", surat.subject)
        self.assertIn(f"?feedback={self.sesi[0].id}", surat.body)
        self.assertIn("pilih jadwal sesi berikutnya", surat.body)

    def test_admin_bisa_membatalkan_selesai_dan_tidak_diselesaikan_ulang(self):
        self.beli()
        self.lewatkan(4)
        cron()
        url = f"/api/products/mentoring-orders/sessions/{self.sesi[0].id}/"
        self.assertEqual(self.patch_json(url, {"status": "scheduled"}, user=self.admin).status_code, 200)
        self.assertEqual(MentoringSession.objects.get(id=self.sesi[0].id).status, "scheduled")
        self.assertFalse(MentorPayout.objects.filter(mentoring_session=self.sesi[0]).exists())
        cron()
        self.assertEqual(MentoringSession.objects.get(id=self.sesi[0].id).status, "scheduled",
                         "koreksi admin tidak ditimpa cron")

    def test_honor_yang_sudah_cair_tidak_bisa_dibatalkan(self):
        self.beli()
        url = f"/api/products/mentoring-orders/sessions/{self.sesi[0].id}/"
        self.patch_json(url, {"status": "completed"}, user=self.admin)
        MentorPayout.objects.filter(mentoring_session=self.sesi[0]).update(status=PayoutStatus.PAID)
        self.assertEqual(self.patch_json(url, {"status": "scheduled"}, user=self.admin).status_code, 400)
        self.assertEqual(MentoringSession.objects.get(id=self.sesi[0].id).status, "completed")


class ZoomTerbukaTests(Dasar):
    def test_meeting_terbuka_tanpa_host_dan_ditambah_30_menit(self):
        self.beli(jam_lagi=5)
        akun = ZoomAccount.objects.create(label="Tes", account_id="a", client_id="c", client_secret_encrypted="x",
                                          is_active=True, auto_record=True)
        jawaban = mock.Mock(status_code=201)
        jawaban.json.return_value = {"id": 999, "join_url": "https://zoom.us/j/999"}
        with mock.patch("mark_up.zoom._request", return_value=(jawaban, None)) as req:
            call_command("generate_zoom_links", "--execute", stdout=StringIO())
        payload = req.call_args.kwargs["json"]
        self.assertEqual(payload["duration"], 90, "60 menit mentoring + 30 menit cadangan")
        s = payload["settings"]
        self.assertTrue(s["join_before_host"])
        self.assertFalse(s["waiting_room"])
        self.assertEqual(s["jbh_time"], 0)
        self.assertEqual(s["auto_recording"], "cloud")
        sesi = MentoringSession.objects.get(id=self.sesi[0].id)
        self.assertEqual((sesi.zoom_link, sesi.zoom_account_id), ("https://zoom.us/j/999", akun.id))


class InvoiceTests(Dasar):
    def test_pemilik_dan_admin_bisa_orang_lain_tidak(self):
        self.beli()
        url = f"/api/transactions/{self.txn.id}/invoice/"
        r = self.get(url, user=self.pembeli)
        self.assertEqual(r.status_code, 200, r.content)
        data = r.json()
        self.assertTrue(data["invoice_number"].startswith("INV/"))
        self.assertEqual(Decimal(data["grand_total"]), Decimal("200000"))
        self.assertEqual(data["items"][0]["title"], self.mentoring.mentoring_detail.title)
        self.assertEqual(self.get(url, user=self.admin).status_code, 200)
        self.assertEqual(self.get(url, user=buat_user()).status_code, 404)
        self.assertEqual(self.get(url).status_code, 401)

    def test_belum_lunas_belum_ada_invoice(self):
        from mark_up.testkit import bukti_pdf
        r = self.post_form("/api/transactions/checkout/", {
            "product_id": str(self.mentoring.id), "availability_slot_id": str(buat_slot(self.mentor).id),
            "proof_of_payment": bukti_pdf()}, user=self.pembeli)
        self.assertEqual(self.get(f"/api/transactions/{r.json()['transaction_id']}/invoice/", user=self.pembeli).status_code, 400)


class CatatanPesanTests(Dasar):
    def test_tercatat_untuk_ditelusuri(self):
        self.beli(jam_lagi=2)
        cron()
        jenis = set(PesanTerkirim.objects.filter(objek_id=str(self.sesi[0].id)).values_list("jenis", flat=True))
        self.assertTrue(any(j.startswith("pengingat_h3@") for j in jenis), jenis)


class PaketAkunZoomTests(ApiTestCase):
    def test_akun_turun_jadi_gratis_admin_dikabari_sekali_sehari(self):
        admin = buat_admin()
        akun = ZoomAccount.objects.create(label="Tes", account_id="a", client_id="c", client_secret_encrypted="x",
                                          is_active=True, is_licensed=True)
        gratis = {"ok": True, "berbayar": False, "pesan": "Kredensial valid. AKUN GRATIS"}
        with mock.patch("mark_up.zoom.check_account", return_value=gratis) as cek:
            cron()
            cron()
        self.assertEqual(cek.call_count, 1, "cukup sekali sehari")
        akun.refresh_from_db()
        self.assertIs(akun.is_licensed, False)
        self.assertEqual(Notification.objects.filter(user=admin, title="Akun Zoom Sekarang Akun GRATIS").count(), 1)
        r = self.get("/api/products/zoom-accounts/", user=admin)
        self.assertEqual(r.json()["accounts"][0]["plan"], "free")
