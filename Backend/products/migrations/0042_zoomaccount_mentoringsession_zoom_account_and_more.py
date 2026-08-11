import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0041_bootcampresource_for_all_packages_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ZoomAccount",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "label",
                    models.CharField(
                        help_text="Nama panggilan biar gampang dibedakan, mis. 'Akun Utama Agustus'.",
                        max_length=120,
                    ),
                ),
                ("account_id", models.CharField(max_length=120)),
                ("client_id", models.CharField(max_length=120)),
                (
                    "client_secret_encrypted",
                    models.TextField(
                        help_text="Terenkripsi Fernet pakai ZOOM_CRED_KEY. JANGAN pernah dikirim balik ke frontend -- lihat _serialize_zoom_account."
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Hanya akun aktif yang dipakai membuat meeting baru. Akun nonaktif tetap dipakai untuk menarik rekaman meeting lama.",
                    ),
                ),
                (
                    "auto_record",
                    models.BooleanField(
                        default=True,
                        help_text="Nyalakan cloud recording otomatis di tiap meeting yang dibuat akun ini. Butuh akun Zoom berbayar.",
                    ),
                ),
                ("last_check_at", models.DateTimeField(blank=True, null=True)),
                ("last_check_ok", models.BooleanField(blank=True, null=True)),
                ("last_check_note", models.CharField(blank=True, default="", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Zoom Account",
                "verbose_name_plural": "Zoom Accounts",
                "ordering": ["-is_active", "label"],
            },
        ),
        migrations.AddField(
            model_name="mentoringsession",
            name="zoom_account",
            field=models.ForeignKey(
                blank=True,
                help_text="Akun Zoom yang meng-host meeting ini. SET_NULL supaya menghapus akun tidak ikut menghapus riwayat sesi.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="mentoring_sessions",
                to="products.zoomaccount",
            ),
        ),
        migrations.AddField(
            model_name="mentoringsession",
            name="zoom_meeting_id",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="mentoringsession",
            name="zoom_generated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="mentoringsession",
            name="zoom_error",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Alasan pembuatan link otomatis gagal (mis. semua akun sibuk di jam itu). Dikosongkan lagi begitu berhasil.",
                max_length=500,
            ),
        ),
    ]
