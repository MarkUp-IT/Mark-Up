from botocore.exceptions import ClientError
from storages.backends.s3 import S3Storage


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
