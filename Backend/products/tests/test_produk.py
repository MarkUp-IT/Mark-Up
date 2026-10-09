"""Katalog produk: produk nonaktif tersembunyi dari publik, tapi admin tetap
bisa membuka (& mengedit) detailnya."""
from mark_up.testkit import ApiTestCase, buat_admin, buat_modul, buat_user


class ProdukNonaktifTests(ApiTestCase):
    def setUp(self):
        self.admin = buat_admin()
        self.modul = buat_modul(aktif=False)
        self.url = f"/api/products/{self.modul.id}/"

    def test_publik_dan_pelajar_dapat_404(self):
        self.assertEqual(self.get(self.url).status_code, 404)
        self.assertEqual(self.get(self.url, user=buat_user()).status_code, 404)

    def test_admin_tetap_bisa_buka(self):
        r = self.get(self.url, user=self.admin)
        self.assertEqual(r.status_code, 200, r.content)

    def test_admin_nonaktif_diperlakukan_publik(self):
        self.admin.status = "INACTIVE"
        self.admin.save()
        self.assertEqual(self.get(self.url, user=self.admin).status_code, 404)
