from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse

from .models import User
from .utils import get_client_ip


OUR_CLIENT_ID = "markup-client-id.apps.googleusercontent.com"
ATTACKER_CLIENT_ID = "attacker-client-id.apps.googleusercontent.com"


class _FakeResponse:
    """Pengganti objek respons `requests` seadanya -- cukup buat view ini,
    yang cuma baca status_code dan json()."""

    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


@override_settings(GOOGLE_CLIENT_ID=OUR_CLIENT_ID)
class GoogleLoginAudienceTests(TestCase):
    """Login Google harus nolak access token yang diterbitkan buat OAuth
    client LAIN.

    Ini regression test buat celah pengambilalihan akun: endpoint userinfo
    Google nerima access token dari client mana pun yang punya scope
    email/profile, jadi kalau audience-nya nggak dicek, penyerang tinggal
    bikin OAuth client sendiri, mancing korban login sekali di situ, lalu
    muter ulang tokennya ke sini buat dapet JWT atas nama korban.
    """

    def setUp(self):
        self.url = reverse("api_google_login")
        self.userinfo = {
            "email": "korban@example.com",
            "email_verified": True,
            "name": "Korban",
        }

    def _post(self):
        return self.client.post(
            self.url,
            data={"access_token": "token-apa-aja"},
            content_type="application/json",
        )

    def _mock_google(self, tokeninfo_payload, tokeninfo_status=200):
        """Bikin pengganti requests.get yang ngebedain dua endpoint Google."""

        def fake_get(url, *args, **kwargs):
            if "tokeninfo" in url:
                return _FakeResponse(tokeninfo_status, tokeninfo_payload)
            return _FakeResponse(200, self.userinfo)

        return patch("requests.get", side_effect=fake_get)

    def test_token_dari_oauth_client_lain_ditolak(self):
        with self._mock_google({"aud": ATTACKER_CLIENT_ID, "azp": ATTACKER_CLIENT_ID}):
            response = self._post()

        self.assertEqual(response.status_code, 401)
        # Yang paling penting: TIDAK ADA akun yang kebikin, dan TIDAK ADA
        # token yang keterbit buat email korban.
        self.assertNotIn("access", response.json())
        self.assertFalse(User.objects.filter(email="korban@example.com").exists())

    def test_token_tanpa_audience_ditolak(self):
        with self._mock_google({"scope": "openid email profile"}):
            response = self._post()

        self.assertEqual(response.status_code, 401)
        self.assertFalse(User.objects.filter(email="korban@example.com").exists())

    def test_token_milik_aplikasi_kita_diterima(self):
        with self._mock_google({"aud": OUR_CLIENT_ID, "azp": OUR_CLIENT_ID}):
            response = self._post()

        self.assertIn(response.status_code, (200, 201))
        self.assertIn("access", response.json())
        self.assertTrue(User.objects.filter(email="korban@example.com").exists())

    def test_azp_cocok_walau_aud_beda_tetap_diterima(self):
        """Sebagian token ngisi azp dengan client ID kita sementara aud-nya
        beda (mis. token buat API Google lain). Salah satu cocok = sah."""
        with self._mock_google({"aud": "https://some.google.api", "azp": OUR_CLIENT_ID}):
            response = self._post()

        self.assertIn(response.status_code, (200, 201))


class ClientIpSpoofingTests(TestCase):
    """get_client_ip nentuin cache key rate limiter. Kalau klien bisa ngarang
    nilainya, semua limit per-IP (login, register, lupa password, hapus akun)
    jadi nggak ada artinya -- tinggal acak headernya tiap request."""

    def _request_with(self, xff, remote_addr="203.0.113.9"):
        from django.test import RequestFactory

        request = RequestFactory().get("/")
        request.META["REMOTE_ADDR"] = remote_addr
        if xff is not None:
            request.META["HTTP_X_FORWARDED_FOR"] = xff
        return request

    def test_nilai_karangan_klien_diabaikan(self):
        # Nginx nimpa header ini, tapi seandainya suatu saat balik ke mode
        # "nambah", entri depan tetap kiriman klien dan nggak boleh dipercaya.
        request = self._request_with("1.2.3.4, 198.51.100.7")
        self.assertEqual(get_client_ip(request), "198.51.100.7")

    def test_header_satu_nilai_dari_proxy_dipakai(self):
        request = self._request_with("198.51.100.7")
        self.assertEqual(get_client_ip(request), "198.51.100.7")

    def test_tanpa_header_pakai_remote_addr(self):
        request = self._request_with(None, remote_addr="198.51.100.7")
        self.assertEqual(get_client_ip(request), "198.51.100.7")

    def test_header_kosong_tidak_bikin_ip_kosong(self):
        request = self._request_with("   ", remote_addr="198.51.100.7")
        self.assertEqual(get_client_ip(request), "198.51.100.7")
