import hashlib

from botocore.exceptions import ClientError
from django.core.cache import cache
from storages.backends.s3 import S3Storage

# Presigned URL berlaku 1 jam (AWS_QUERYSTRING_EXPIRE). URL hasil presign
# di-memoize sedikit lebih pendek dari itu supaya yang dipegang browser gak
# pernah keburu kedaluwarsa di tengah jalan.
_URL_CACHE_TTL = 3000  # 50 menit


class TolerantS3Storage(S3Storage):
    """Beberapa provider S3-compatible (DomainEsia salah satunya) balikin 403
    -- bukan 404 sesuai spek S3 -- buat HeadObject ke key yang belum pernah
    ada di bawah prefix/folder yang belum pernah "disentuh". django-storages
    cuma nganggep 404 sebagai "belum ada" dan re-raise error lainnya,
    sehingga upload gagal total tiap kali nyoba generate nama file unik lewat
    exists() (dipanggil otomatis oleh save() karena AWS_S3_FILE_OVERWRITE
    diset False). Override ini nganggep 403 di sini sama kayak 404, karena
    tujuannya cuma "apakah nama file ini perlu diganti", bukan cek izin akses
    yang sensitif."""

    def exists(self, name):
        try:
            return super().exists(name)
        except ClientError as err:
            status = err.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
            if status == 403:
                return False
            raise

    def url(self, name, parameters=None, expire=None, http_method=None):
        """Presigned URL yang di-memoize, supaya cache browser beneran kepakai.

        Presign SigV4 nyelipin X-Amz-Date (presisi detik) + X-Amz-Signature,
        jadi tanpa memo ini tiap pemanggilan ngasih URL BEDA walau filenya
        sama. Browser nganggep itu resource baru -> gambar yang sama diunduh
        ulang tiap halaman dibuka, walau header Cache-Control-nya panjang.
        Dengan memo, URL-nya konsisten selama 50 menit -> unduhan kedua dst.
        dilayani dari cache browser.

        Cuma buat pemanggilan default (tanpa parameter/expire/method khusus) --
        pemanggilan spesial dilewatkan apa adanya biar gak salah pakai memo.
        """
        if parameters or expire is not None or http_method is not None:
            return super().url(name, parameters=parameters, expire=expire, http_method=http_method)

        # Nama file bisa panjang & mengandung karakter yang gak valid buat key
        # cache (spasi, dsb), jadi di-hash.
        key = "s3url:" + hashlib.sha1(str(name).encode("utf-8")).hexdigest()

        try:
            cached = cache.get(key)
            if cached:
                return cached
        except Exception:
            # Cache bermasalah bukan alasan buat gagal nampilin gambar --
            # jatuh balik ke perilaku lama (presign tiap kali).
            return super().url(name)

        signed = super().url(name)
        try:
            cache.set(key, signed, _URL_CACHE_TTL)
        except Exception:
            pass
        return signed
