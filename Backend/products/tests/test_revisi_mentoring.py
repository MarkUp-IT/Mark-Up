"""Revisi Okt 2026: link Zoom untuk sesi beruntun, link manual admin, sesi
selesai otomatis hanya kalau meeting berlangsung, pengingat setelah jadwal
ulang, feedback per sesi, invoice PDF di email, dan slot jam setengah."""
import json
from datetime import timedelta
from decimal import Decimal
from io import StringIO
from unittest import mock

from django.core import mail
from django.core.management import call_command
from django.utils import timezone

from accounts.models import Notification
from mark_up.testkit import (
    ApiTestCase, beli_lunas, buat_admin, buat_mentor, buat_mentoring, buat_modul, buat_slot, buat_user, bukti_pdf,
)
from mentors.models import MentorAvailability
from products.models import MentoringSession, SessionFeedback, UserLibrary, ZoomAccount
from transactions.models import MentorPayout


def cron():
    call_command("send_mentoring_reminders", "--execute", stdout=StringIO())


def zoom_cron():
    out = StringIO()
    call_command("generate_zoom_links", "--execute", stdout=out)
    return out.getvalue()


def surat_untuk(email):
    return [m for m in mail.outbox if email in m.to]


class ZoomPalsu:
    """Pengganti mark_up.zoom._request: mencatat setiap panggilan & membalas
    seperti Zoom. `berlangsung` = jawaban /past_meetings (True/False/None)."""

    def __init__(self, berlangsung=True):
        self.panggilan = []
        self.berlangsung = berlangsung
        self._id = 1000

    def __call__(self, account, method, path, **kw):
        self.panggilan.append((method, path, kw.get("json"), account.label))
        r = mock.Mock()
        if method == "POST" and path.endswith("/meetings"):
            self._id += 1
            r.status_code = 201
            r.json.return_value = {"id": self._id, "join_url": f"https://zoom.us/j/{self._id}"}
        elif method == "GET" and path.startswith("/past_meetings/"):
            if self.berlangsung is None:
                return None, "Tidak bisa menghubungi Zoom"
            r.status_code = 200 if self.berlangsung else 404
            r.json.return_value = {"start_time": "2026-10-20T12:00:00Z"} if self.berlangsung else {}
        else:
            r.status_code = 204
            r.json.return_value = {}
        return r, None

    def dibuat(self):
        return [(p[2], p[3]) for p in self.panggilan if p[0] == "POST"]

    def dipatch(self):
        return [(p[1], p[2]) for p in self.panggilan if p[0] == "PATCH"]


def akun_zoom(label="Akun A"):
    return ZoomAccount.objects.create(label=label, account_id="a", client_id="c", client_secret_encrypted="x",
                                      is_active=True, auto_record=True)


class Dasar(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.mentor2 = buat_mentor()
        self.mentoring = buat_mentoring(harga=200000, sesi=2)

    def jadwal(self, mentor, mulai, pembeli=None):
        """Sesi terjadwal (lewat pembelian asli) yang mulai pada `mulai`."""
        pembeli = pembeli or buat_user()
        slot = buat_slot(mentor, jam_lagi=200)
        MentorAvailability.objects.filter(id=slot.id).update(start_time=mulai, end_time=mulai + timedelta(hours=1))
        slot.refresh_from_db()
        beli_lunas(self, pembeli, self.mentoring, slot)
        return MentoringSession.objects.get(user_library__user=pembeli, order=1)


# =========================================================== Poin 3 & 4: Zoom

class ZoomSesiBeruntunTests(Dasar):
    """Kasus 20 Okt: sesi 19:00 & 20:00 di satu akun -> dulu sesi 19:00 tidak
    pernah dapat link karena cadangan +30 & jeda 15 menit dihitung bentrok."""

    def setUp(self):
        super().setUp()
        self.akun = akun_zoom()
        besok = (timezone.now() + timedelta(days=2)).replace(minute=0, second=0, microsecond=0)
        self.jam19 = besok.replace(hour=12)   # 19:00 WIB
        self.jam20 = besok.replace(hour=13)   # 20:00 WIB

    def test_sesi_beruntun_mentor_sama_dua_duanya_dapat_link(self):
        a = self.jadwal(self.mentor, self.jam19)
        b = self.jadwal(self.mentor, self.jam20)
        zoom = ZoomPalsu()
        with mock.patch("mark_up.zoom._request", zoom):
            zoom_cron()
        a.refresh_from_db(); b.refresh_from_db()
        self.assertTrue(a.zoom_link and b.zoom_link, "dua-duanya harus dapat link")
        self.assertEqual(a.zoom_account_id, b.zoom_account_id)
        self.assertEqual([p["duration"] for p, _ in zoom.dibuat()], [90, 90])
        # Sesi pertama langsung dipendekkan begitu sesi 20:00 dibuat di akun yang sama.
        patch = [body for path, body in zoom.dipatch() if path == f"/meetings/{a.zoom_meeting_id}"]
        self.assertEqual([b["duration"] for b in patch], [60], "cadangan sesi pertama dipotong sampai sesi berikutnya")

    def test_sesi_berikutnya_dibuat_belakangan_meeting_sebelumnya_dipendekkan(self):
        a = self.jadwal(self.mentor, self.jam19)
        zoom = ZoomPalsu()
        with mock.patch("mark_up.zoom._request", zoom):
            zoom_cron()
            self.assertEqual(zoom.dibuat()[0][0]["duration"], 90, "belum ada sesi lain -> penuh +30")
            self.jadwal(self.mentor, self.jam20)
            zoom_cron()
        a.refresh_from_db()
        patch = [(path, body) for path, body in zoom.dipatch() if path == f"/meetings/{a.zoom_meeting_id}"]
        self.assertEqual(len(patch), 1)
        self.assertEqual(patch[0][1]["duration"], 60)

    def test_jam_inti_bentrok_satu_akun_admin_langsung_dikabari_sekali(self):
        a = self.jadwal(self.mentor, self.jam19)
        b = self.jadwal(self.mentor2, self.jam19 + timedelta(minutes=30))
        zoom = ZoomPalsu()
        with mock.patch("mark_up.zoom._request", zoom):
            zoom_cron()
            zoom_cron()
        a.refresh_from_db(); b.refresh_from_db()
        self.assertTrue(a.zoom_link)
        self.assertEqual(b.zoom_link, "")
        self.assertIn("beririsan", b.zoom_error)
        self.assertEqual(Notification.objects.filter(user=self.admin, title="Link Zoom Mentoring Gagal Dibuat").count(), 1,
                         "admin dikabari sekali, tidak tiap 15 menit")

    def test_dua_akun_sesi_bersamaan_dapat_link_di_akun_berbeda(self):
        akun_zoom("Akun B")
        a = self.jadwal(self.mentor, self.jam19)
        b = self.jadwal(self.mentor2, self.jam19)
        with mock.patch("mark_up.zoom._request", ZoomPalsu()):
            zoom_cron()
        a.refresh_from_db(); b.refresh_from_db()
        self.assertTrue(a.zoom_link and b.zoom_link)
        self.assertNotEqual(a.zoom_account_id, b.zoom_account_id)

    def test_link_dekat_jadwal_dikirim_lewat_email(self):
        sesi = self.jadwal(self.mentor, timezone.now() + timedelta(hours=5))
        mail.outbox.clear()
        with mock.patch("mark_up.zoom._request", ZoomPalsu()):
            zoom_cron()
        sesi.refresh_from_db()
        for email in (sesi.user_library.user.email, self.mentor.user.email):
            surat = surat_untuk(email)
            self.assertEqual(len(surat), 1, email)
            self.assertIn("Link Zoom Mentoring Sudah Tersedia", surat[0].subject)
            self.assertIn(sesi.zoom_link, surat[0].body)

    def test_pengingat_mentor_memuat_catatan_sesi_berikutnya(self):
        a = self.jadwal(self.mentor, timezone.now() + timedelta(hours=2))
        self.jadwal(self.mentor2, a.start_time + timedelta(minutes=60))
        with mock.patch("mark_up.zoom._request", ZoomPalsu()):
            zoom_cron()
        mail.outbox.clear()
        cron()
        surat = [m for m in surat_untuk(self.mentor.user.email) if "3 Jam Lagi" in m.subject]
        self.assertEqual(len(surat), 1)
        self.assertIn("dipakai sesi lain", surat[0].body)


class LinkManualAdminTests(Dasar):
    def setUp(self):
        super().setUp()
        self.sesi = self.jadwal(self.mentor, timezone.now() + timedelta(days=2))
        self.url = f"/api/products/mentoring-orders/sessions/{self.sesi.id}/"
        mail.outbox.clear()

    def test_link_manual_mengabari_mentee_dan_mentor(self):
        r = self.patch_json(self.url, {"zoom_link": "https://zoom.us/j/555"}, user=self.admin)
        self.assertEqual(r.status_code, 200, r.content)
        for email in (self.sesi.user_library.user.email, self.mentor.user.email):
            surat = surat_untuk(email)
            self.assertEqual(len(surat), 1, email)
            self.assertIn("https://zoom.us/j/555", surat[0].body)
        mail.outbox.clear()
        self.patch_json(self.url, {"zoom_link": "https://zoom.us/j/555"}, user=self.admin)
        self.assertEqual(len(mail.outbox), 0, "link sama -> tidak dikabari ulang")

    def test_link_manual_menggantikan_meeting_otomatis(self):
        akun = akun_zoom()
        MentoringSession.objects.filter(id=self.sesi.id).update(
            zoom_link="https://zoom.us/j/111", zoom_meeting_id="111", zoom_account=akun)
        with mock.patch("mark_up.zoom.delete_meeting", return_value=(True, None)) as hapus, \
                mock.patch("threading.Thread") as utas:
            utas.return_value.start.side_effect = lambda: utas.call_args.kwargs["target"]()
            self.patch_json(self.url, {"zoom_link": "https://meet.lain/abc"}, user=self.admin)
        self.sesi.refresh_from_db()
        self.assertEqual((self.sesi.zoom_link, self.sesi.zoom_meeting_id, self.sesi.zoom_account_id),
                         ("https://meet.lain/abc", "", None))
        hapus.assert_called_once()

    def test_sesi_yang_sudah_lewat_tidak_dikabari(self):
        MentoringSession.objects.filter(id=self.sesi.id).update(start_time=timezone.now() - timedelta(hours=1))
        self.patch_json(self.url, {"zoom_link": "https://zoom.us/j/777"}, user=self.admin)
        self.assertEqual(len(mail.outbox), 0)


class SelesaiOtomatisAmanTests(Dasar):
    """Kasus 20 Okt: sesi tanpa link tetap ditandai selesai & honor terbit."""

    def setUp(self):
        super().setUp()
        self.akun = akun_zoom()
        self.sesi = self.jadwal(self.mentor, timezone.now() + timedelta(days=2))
        self.lewat = timezone.now() - timedelta(hours=4)

    def set(self, **kw):
        MentoringSession.objects.filter(id=self.sesi.id).update(start_time=self.lewat, **kw)

    def status(self):
        return MentoringSession.objects.get(id=self.sesi.id).status

    def test_tanpa_link_tidak_selesai_dan_admin_diminta_konfirmasi_sekali(self):
        self.set(zoom_link="")
        cron(); cron()
        self.assertEqual(self.status(), "scheduled")
        self.assertFalse(MentorPayout.objects.filter(mentoring_session=self.sesi).exists())
        self.assertEqual(Notification.objects.filter(
            user=self.admin, title="Konfirmasi Sesi Mentoring yang Sudah Lewat").count(), 1)

    def test_meeting_tidak_pernah_dimulai_tidak_selesai(self):
        self.set(zoom_link="https://zoom.us/j/9", zoom_meeting_id="9", zoom_account=self.akun)
        with mock.patch("mark_up.zoom._request", ZoomPalsu(berlangsung=False)):
            cron()
        self.assertEqual(self.status(), "scheduled")
        self.assertFalse(MentorPayout.objects.filter(mentoring_session=self.sesi).exists())

    def test_zoom_tidak_bisa_dihubungi_ditunda_tanpa_kabar(self):
        self.set(zoom_link="https://zoom.us/j/9", zoom_meeting_id="9", zoom_account=self.akun)
        with mock.patch("mark_up.zoom._request", ZoomPalsu(berlangsung=None)):
            cron()
        self.assertEqual(self.status(), "scheduled")
        self.assertFalse(Notification.objects.filter(title__startswith="Konfirmasi Sesi").exists())
        with mock.patch("mark_up.zoom._request", ZoomPalsu(berlangsung=True)):
            cron()
        self.assertEqual(self.status(), "completed", "putaran berikutnya Zoom bisa dihubungi -> selesai")

    def test_meeting_berlangsung_selesai_dan_minta_feedback(self):
        self.set(zoom_link="https://zoom.us/j/9", zoom_meeting_id="9", zoom_account=self.akun)
        mail.outbox.clear()
        with mock.patch("mark_up.zoom._request", ZoomPalsu(berlangsung=True)):
            cron(); cron()
        self.assertEqual(self.status(), "completed")
        self.assertEqual(MentorPayout.objects.filter(mentoring_session=self.sesi).count(), 1)
        surat = surat_untuk(self.sesi.user_library.user.email)
        self.assertEqual(len(surat), 1)
        self.assertIn("Bagaimana Sesi Mentoringmu", surat[0].subject)


class PengingatJadwalUlangTests(Dasar):
    def test_sesi_dijadwal_ulang_diingatkan_lagi(self):
        sesi = self.jadwal(self.mentor, timezone.now() + timedelta(hours=2))
        pembeli = sesi.user_library.user.email
        mail.outbox.clear()
        cron()
        self.assertEqual(len([m for m in surat_untuk(pembeli) if "3 Jam Lagi" in m.subject]), 1)
        # Jadwal dipindah ke hari lain, lalu mendekat lagi.
        MentoringSession.objects.filter(id=sesi.id).update(start_time=timezone.now() + timedelta(hours=2, minutes=30))
        mail.outbox.clear()
        cron(); cron()
        self.assertEqual(len([m for m in surat_untuk(pembeli) if "3 Jam Lagi" in m.subject]), 1,
                         "jadwal baru -> pengingat baru (sekali)")


# =========================================================== Poin 5: feedback

class FeedbackSesiTests(Dasar):
    def setUp(self):
        super().setUp()
        self.sesi = self.jadwal(self.mentor, timezone.now() + timedelta(days=2))
        self.pembeli = self.sesi.user_library.user
        self.url = f"/api/products/my-products/sessions/{self.sesi.id}/feedback/"

    def selesaikan(self):
        return self.patch_json(f"/api/products/mentoring-orders/sessions/{self.sesi.id}/", {"status": "completed"},
                               user=self.admin)

    def test_belum_selesai_ditolak(self):
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=self.pembeli).status_code, 400)

    def test_validasi_dan_hanya_sekali(self):
        self.selesaikan()
        for salah in (0, 6, "x", None):
            self.assertEqual(self.post_json(self.url, {"rating": salah}, user=self.pembeli).status_code, 400, salah)
        self.assertEqual(self.post_json(self.url, {"rating": 4, "comment": "x" * 2001}, user=self.pembeli).status_code, 400)
        r = self.post_json(self.url, {"rating": 4, "comment": "  Mantap, jelas sekali  "}, user=self.pembeli)
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(SessionFeedback.objects.get(session=self.sesi).comment, "Mantap, jelas sekali")
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=self.pembeli).status_code, 400)

    def test_orang_lain_dan_akses_dicabut(self):
        self.selesaikan()
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=buat_user()).status_code, 404)
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=self.mentor.user).status_code, 404)
        self.assertEqual(self.post_json(self.url, {"rating": 5}).status_code, 401)
        UserLibrary.objects.filter(id=self.sesi.user_library_id).update(is_revoked=True)
        self.assertEqual(self.post_json(self.url, {"rating": 5}, user=self.pembeli).status_code, 400)

    def test_tampil_di_pembeli_mentor_dan_admin(self):
        self.selesaikan()
        self.post_json(self.url, {"rating": 3, "comment": "Cukup"}, user=self.pembeli)
        r = self.get(f"/api/products/my-products/{self.mentoring.id}/", user=self.pembeli)
        sesi = next(s for s in r.json()["sessions"] if s["id"] == str(self.sesi.id))
        self.assertEqual(sesi["feedback"]["rating"], 3)
        r = self.get("/api/mentors/me/sessions/", user=self.mentor.user)
        sesi = next(s for s in r.json()["mentoring"] if s["id"] == str(self.sesi.id))
        self.assertEqual(sesi["feedback"], {"rating": 3, "comment": "Cukup"})
        r = self.get(f"/api/products/mentoring-orders/{self.sesi.user_library_id}/", user=self.admin)
        sesi = next(s for s in r.json()["sessions"] if s["id"] == str(self.sesi.id))
        self.assertEqual(sesi["feedback"]["rating"], 3)

    def test_admin_menandai_selesai_minta_feedback_sekali_walau_dibatalkan_lalu_diulang(self):
        mail.outbox.clear()
        self.selesaikan()
        self.patch_json(f"/api/products/mentoring-orders/sessions/{self.sesi.id}/", {"status": "scheduled"},
                        user=self.admin)
        self.selesaikan()
        surat = [m for m in surat_untuk(self.pembeli.email) if "Bagaimana Sesi" in m.subject]
        self.assertEqual(len(surat), 1)

    def test_pengingat_feedback_sekali_setelah_24_jam(self):
        from accounts.models import PesanTerkirim
        self.selesaikan()
        mail.outbox.clear()
        cron()
        self.assertEqual(len(mail.outbox), 0, "belum 24 jam")
        PesanTerkirim.objects.filter(jenis="minta_feedback").update(dikirim_pada=timezone.now() - timedelta(hours=25))
        cron(); cron()
        surat = [m for m in surat_untuk(self.pembeli.email) if "Pengingat: Beri Feedback" in m.subject]
        self.assertEqual(len(surat), 1)

    def test_tidak_diingatkan_kalau_sudah_mengisi(self):
        from accounts.models import PesanTerkirim
        self.selesaikan()
        self.post_json(self.url, {"rating": 5}, user=self.pembeli)
        PesanTerkirim.objects.filter(jenis="minta_feedback").update(dikirim_pada=timezone.now() - timedelta(hours=25))
        mail.outbox.clear()
        cron()
        self.assertEqual(len(mail.outbox), 0)


# =========================================================== Poin 1: invoice

class InvoiceEmailTests(Dasar):
    def lampiran_pdf(self, surat):
        return [a for a in surat.attachments if a[2] == "application/pdf"]

    def test_mentoring_invoice_ke_pembeli_tim_dan_mentor(self):
        mail.outbox.clear()
        sesi = self.jadwal(self.mentor, timezone.now() + timedelta(days=2))
        pembeli = sesi.user_library.user
        tim = [m for m in mail.outbox if "Pembayaran Lunas:" in m.subject]
        for surat in (surat_untuk(pembeli.email)[0], surat_untuk(self.mentor.user.email)[0], tim[0]):
            pdf = self.lampiran_pdf(surat)
            self.assertEqual(len(pdf), 1, surat.subject)
            self.assertTrue(pdf[0][1].startswith(b"%PDF"), surat.subject)
            self.assertTrue(pdf[0][0].startswith("Invoice MARK-UP INV-"), pdf[0][0])
            self.assertNotIn("/", pdf[0][0])

    def test_modul_invoice_ke_pembeli_dan_tim(self):
        pembeli = buat_user()
        mail.outbox.clear()
        beli_lunas(self, pembeli, buat_modul())
        self.assertEqual(len(self.lampiran_pdf(surat_untuk(pembeli.email)[0])), 1)
        self.assertEqual(len([m for m in mail.outbox if "Pembayaran Lunas:" in m.subject and self.lampiran_pdf(m)]), 1)

    def test_mentor_yang_baru_dipilih_belakangan_dapat_invoice(self):
        pembeli = buat_user()
        lib = UserLibrary.objects.create(user=pembeli, product=self.mentoring)
        beli = beli_lunas(self, buat_user(), buat_modul())  # transaksi lain, bukan milik pembeli ini
        sesi = MentoringSession.objects.create(user_library=lib, mentoring=self.mentoring.mentoring_detail, order=1)
        # Transaksi pembeli untuk produk mentoring ini (pembayaran yang dipulihkan).
        from transactions.models import Transaction, TransactionItem
        txn = Transaction.objects.create(user=pembeli, sub_total=200000, grand_total=200000, payment_status="PAID",
                                         paid_at=timezone.now())
        TransactionItem.objects.create(transaction=txn, product=self.mentoring, price_at_checkout=200000)
        slot = buat_slot(self.mentor, jam_lagi=48)
        mail.outbox.clear()
        r = self.post_json(f"/api/products/my-products/sessions/{sesi.id}/schedule/",
                           {"session_type": "mentoring", "availability_slot_id": str(slot.id)}, user=pembeli)
        self.assertEqual(r.status_code, 200, r.content)
        surat = surat_untuk(self.mentor.user.email)[0]
        pdf = self.lampiran_pdf(surat)
        self.assertEqual(len(pdf), 1)
        self.assertIn(txn.id.rsplit("-", 1)[-1], pdf[0][0])
        self.assertNotEqual(beli.id, txn.id)

    def test_pdf_gagal_dibuat_email_tetap_terkirim(self):
        pembeli = buat_user()
        mail.outbox.clear()
        with mock.patch("transactions.invoice.pdf_invoice", side_effect=RuntimeError("rusak")):
            beli_lunas(self, pembeli, buat_modul())
        surat = surat_untuk(pembeli.email)
        self.assertEqual(len(surat), 1)
        self.assertEqual(surat[0].attachments, [])

    def test_backend_brevo_mengirim_lampiran(self):
        from django.core.mail import EmailMultiAlternatives
        from mark_up.email_backend import BrevoAPIEmailBackend

        pesan = EmailMultiAlternatives("Subjek", "Isi", "a@contoh.test", ["b@contoh.test"])
        pesan.attach("nota.pdf", b"%PDF-1.4 isi", "application/pdf")
        with mock.patch("requests.post") as post, self.settings(BREVO_API_KEY="kunci-tes"):
            post.return_value.status_code = 201
            BrevoAPIEmailBackend().send_messages([pesan])
        payload = json.loads(post.call_args.kwargs["data"])
        self.assertEqual(payload["attachment"][0]["name"], "nota.pdf")
        import base64
        self.assertEqual(base64.b64decode(payload["attachment"][0]["content"]), b"%PDF-1.4 isi")


# =========================================================== Poin 2: slot :30

class SlotSetengahJamTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.mentor = buat_mentor()
        self.tgl = (timezone.localtime() + timedelta(days=3)).strftime("%Y-%m-%d")

    def tambah(self, mulai, selesai):
        return self.post_json("/api/mentors/availability/add/", {
            "start_date": self.tgl, "end_date": self.tgl, "start_time": mulai, "end_time": selesai},
            user=self.mentor.user)

    def jam(self):
        return sorted(timezone.localtime(a.start_time).strftime("%H:%M")
                      for a in MentorAvailability.objects.filter(mentor_profile=self.mentor))

    def test_tambah_satuan_jam_setengah(self):
        self.assertIn(self.tambah("06:30", "07:30").status_code, (200, 201))
        a = MentorAvailability.objects.get(mentor_profile=self.mentor)
        self.assertEqual(timezone.localtime(a.start_time).strftime("%H:%M"), "06:30")
        self.assertEqual(a.end_time - a.start_time, timedelta(hours=1))
        self.assertEqual(self.tambah("07:00", "08:00").status_code, 400, "beririsan dengan 06:30-07:30")
        self.assertIn(self.tambah("07:30", "08:30").status_code, (200, 201), "bersentuhan di batas boleh")

    def test_tambah_massal_campuran_dan_yang_bentrok_dilewati(self):
        r = self.post_json("/api/mentors/availability/add-bulk/", {
            "start_date": self.tgl, "end_date": self.tgl, "times": ["06:30", "07:00", "07:30", "09:00"]},
            user=self.mentor.user)
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(self.jam(), ["06:30", "07:30", "09:00"])
        for a in MentorAvailability.objects.filter(mentor_profile=self.mentor):
            self.assertEqual(a.end_time - a.start_time, timedelta(hours=1))

    def test_slot_jam_setengah_bisa_dibeli_dan_tampil_benar(self):
        self.tambah("06:30", "07:30")
        slot = MentorAvailability.objects.get(mentor_profile=self.mentor)
        r = self.get(f"/api/mentors/{self.mentor.id}/availability/")
        self.assertIn("06:30", json.dumps(r.json()))
        mentoring = buat_mentoring(sesi=1)
        pembeli = buat_user()
        beli_lunas(self, pembeli, mentoring, slot)
        sesi = MentoringSession.objects.get(user_library__user=pembeli)
        self.assertEqual(timezone.localtime(sesi.start_time).strftime("%H:%M"), "06:30")
        self.assertIn("06:30", surat_untuk(pembeli.email)[0].body)
