"""Setting khusus tes otomatis -- pakai:

    python manage.py test --settings=mark_up.test_settings

Turunan settings.py biasa, tapi semua yang bisa "bocor" ke dunia nyata
dimatikan, supaya tes aman dijalankan di server produksi:

  - Database: Django otomatis bikin `test_<nama db>` terpisah lalu
    membuangnya setelah selesai (butuh izin CREATEDB buat user DB-nya).
  - Berkas upload -> memori (BUKAN bucket S3 asli).
  - Email -> memori (`django.core.mail.outbox`), gak ada yang terkirim.
  - Cache (rate limiter) -> memori per proses tes, gak ikut tabel cache prod.
  - HTTPS redirect produksi dimatikan -- kalau nyala, semua request tes
    dibalas 301 dan hasilnya menyesatkan (lihat catatan memory dev_testing).

Panggilan ke layanan luar (iPaymu, Zoom, Google) TIDAK otomatis dimatikan
di sini -- tiap tes yang menyentuhnya wajib mock sendiri.
"""
from .settings import *  # noqa: F401,F403

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

ALLOWED_HOSTS = ["testserver", "localhost", "mark-up.id"]

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# Hash password cepat -- tes bikin banyak user, PBKDF2 asli bikin lambat.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

FRONTEND_BASE_URL = "https://mark-up.id"
EMAIL_SINKRON = True
