import os
import subprocess
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

BACKUP_PREFIX = "db-backups/"
RETENTION_DAYS = 30


class Command(BaseCommand):
    help = (
        "Dump database PostgreSQL (pg_dump) lalu upload ke storage yang lagi "
        "aktif (S3-compatible di produksi, lokal di dev). Backup yang lebih "
        "tua dari 30 hari otomatis dihapus. Dijadwalkan jalan harian lewat "
        "cron di server produksi."
    )

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        if "postgresql" not in db["ENGINE"]:
            raise CommandError(
                f"backup_database cuma didukung buat PostgreSQL, ENGINE saat ini: {db['ENGINE']}"
            )

        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        # Sengaja disimpan mentah (.sql, bukan .gz) -- sempat dicoba kompres
        # gzip, tapi storage S3-compatible yang dipakai (di belakang
        # Cloudflare) diam-diam nge-decompress file ".gz" pas diunduh (keliatan
        # dari mimetypes yang nebak encoding "gzip" dari nama file, plus
        # header respons yang nunjukin campur tangan Cloudflare). Databasenya
        # masih kecil, jadi gak worth resiko itu cuma buat hemat storage.
        filename = f"{BACKUP_PREFIX}markup_{timestamp}.sql"

        env = os.environ.copy()
        if db.get("PASSWORD"):
            env["PGPASSWORD"] = db["PASSWORD"]

        dump_cmd = [
            "pg_dump",
            "--host", db.get("HOST") or "localhost",
            "--port", str(db.get("PORT") or "5432"),
            "--username", db["USER"],
            "--no-password",
            "--format=plain",
            db["NAME"],
        ]
        self.stdout.write("Menjalankan pg_dump...")
        dump_proc = subprocess.run(dump_cmd, env=env, capture_output=True)

        if dump_proc.returncode != 0:
            raise CommandError(
                f"pg_dump gagal (exit {dump_proc.returncode}): {dump_proc.stderr.decode(errors='replace')}"
            )

        size_mb = len(dump_proc.stdout) / (1024 * 1024)
        self.stdout.write(f"Dump selesai ({size_mb:.2f} MB), upload ke storage...")

        saved_name = default_storage.save(filename, ContentFile(dump_proc.stdout))
        self.stdout.write(self.style.SUCCESS(f"Backup tersimpan: {saved_name}"))

        self._cleanup_old_backups()

    def _cleanup_old_backups(self):
        cutoff = timezone.now() - timedelta(days=RETENTION_DAYS)
        try:
            _, files = default_storage.listdir(BACKUP_PREFIX.rstrip("/"))
        except FileNotFoundError:
            return
        except NotImplementedError:
            self.stdout.write(
                "Storage ini gak dukung listdir() -- lewati pembersihan backup lama."
            )
            return

        deleted = 0
        for name in files:
            full_name = f"{BACKUP_PREFIX}{name}"
            try:
                modified = default_storage.get_modified_time(full_name)
            except (NotImplementedError, OSError):
                continue
            if timezone.is_naive(modified):
                modified = timezone.make_aware(modified)
            if modified < cutoff:
                default_storage.delete(full_name)
                deleted += 1

        if deleted:
            self.stdout.write(f"Hapus {deleted} backup lama (>{RETENTION_DAYS} hari).")
