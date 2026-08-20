import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0042_zoomaccount_mentoringsession_zoom_account_and_more"),
    ]

    operations = [
        # --- saklar isian pendaftaran ---
        migrations.AddField(
            model_name="bootcampproduct",
            name="require_commitment_letter",
            field=models.BooleanField(
                default=True,
                help_text="Wajibkan unggah commitment/motivation letter (PDF). Matikan kalau sudah diganti pertanyaan isian.",
            ),
        ),
        migrations.AddField(
            model_name="bootcampproduct",
            name="enable_registration_questions",
            field=models.BooleanField(
                default=False,
                help_text="Tampilkan pertanyaan isian di formulir pendaftaran. Pertanyaannya diatur di BootcampRegistrationQuestion.",
            ),
        ),
        # --- template email hasil seleksi ---
        migrations.AddField(
            model_name="bootcampproduct",
            name="email_accepted_subject",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bootcampproduct",
            name="email_accepted_body",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Placeholder yang tersedia: {nama} {bootcamp} {paket} {total} {commitment_fee} {link_bayar} {catatan_admin}",
            ),
        ),
        migrations.AddField(
            model_name="bootcampproduct",
            name="email_rejected_subject",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="bootcampproduct",
            name="email_rejected_body",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Placeholder yang tersedia: {nama} {bootcamp} {paket} {catatan_admin}",
            ),
        ),
        # --- pertanyaan ---
        migrations.CreateModel(
            name="BootcampRegistrationQuestion",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("text", models.TextField(max_length=1000)),
                (
                    "helper_text",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Keterangan kecil di bawah pertanyaan, mis. contoh jawaban.",
                        max_length=300,
                    ),
                ),
                ("is_required", models.BooleanField(default=True)),
                (
                    "max_words",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Batas kata jawaban. 0 = tanpa batas. Ditegakkan di server, bukan cuma ditampilkan di formulir.",
                    ),
                ),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Dimatikan = tidak muncul di formulir baru. Jawaban lama TETAP tersimpan dan tetap terbaca admin.",
                    ),
                ),
                (
                    "bootcamp",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="registration_questions",
                        to="products.bootcampproduct",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bootcamp Registration Question",
                "verbose_name_plural": "Bootcamp Registration Questions",
                "ordering": ["order", "id"],
            },
        ),
        # --- jawaban ---
        migrations.CreateModel(
            name="BootcampRegistrationAnswer",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("question_text", models.TextField(max_length=1000)),
                ("answer_text", models.TextField(blank=True, default="")),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "registration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="answers",
                        to="products.bootcampregistration",
                    ),
                ),
                (
                    "question",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="answers",
                        to="products.bootcampregistrationquestion",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bootcamp Registration Answer",
                "verbose_name_plural": "Bootcamp Registration Answers",
                "ordering": ["order", "id"],
            },
        ),
    ]
