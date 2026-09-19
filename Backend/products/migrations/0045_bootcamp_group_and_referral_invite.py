import uuid

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0044_question_package_gating"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # --- pengaturan tim & ajak-teman di level paket ---
        migrations.AddField(
            model_name="bootcamppackage",
            name="group_size",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Jumlah orang per tim buat dapat harga kelompok. 0 = fitur tim dimatikan untuk paket ini.",
            ),
        ),
        migrations.AddField(
            model_name="bootcamppackage",
            name="group_price",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=12,
                null=True,
                help_text="Harga per orang kalau timnya sudah lengkap (group_size tercapai). Cuma dipakai kalau group_size > 0.",
            ),
        ),
        migrations.AddField(
            model_name="bootcamppackage",
            name="referral_invite_enabled",
            field=models.BooleanField(
                default=False,
                help_text="Nyalakan diskon 'ajak teman' -- pendaftar menyebut email orang yang diajak, dapat potongan flat kalau minimal 1 email valid (sudah terdaftar di bootcamp ini & belum diklaim orang lain).",
            ),
        ),
        migrations.AddField(
            model_name="bootcamppackage",
            name="referral_invite_discount_percent",
            field=models.PositiveIntegerField(
                default=5,
                validators=[django.core.validators.MaxValueValidator(100)],
                help_text="Persen potongan flat -- tidak menumpuk walau menyebut banyak email, cukup 1 yang valid untuk dapat potongan ini.",
            ),
        ),
        # --- tim pendaftaran berbasis ketua ---
        migrations.CreateModel(
            name="BootcampRegistrationGroup",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "package",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="registration_groups",
                        to="products.bootcamppackage",
                    ),
                ),
                (
                    "leader_registration",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="led_team_group",
                        to="products.bootcampregistration",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bootcamp Registration Group",
                "verbose_name_plural": "Bootcamp Registration Groups",
            },
        ),
        migrations.AddField(
            model_name="bootcampregistration",
            name="registration_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="registrations",
                to="products.bootcampregistrationgroup",
            ),
        ),
        migrations.CreateModel(
            name="BootcampTeamInvite",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "invitee",
                    models.ForeignKey(
                        help_text="Akun yang diundang -- disimpan sebagai FK (bukan teks email) karena sudah tervalidasi ada akunnya pas ketua submit.",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "leader_registration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="team_invites",
                        to="products.bootcampregistration",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bootcamp Team Invite",
                "verbose_name_plural": "Bootcamp Team Invites",
            },
        ),
        migrations.AddConstraint(
            model_name="bootcampteaminvite",
            constraint=models.UniqueConstraint(
                fields=("leader_registration", "invitee"), name="unique_invitee_per_leader_registration"
            ),
        ),
        # --- ajak teman ---
        migrations.CreateModel(
            name="BootcampReferredInvitee",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("invitee_email", models.EmailField(max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "bootcamp",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referred_invitees",
                        to="products.bootcampproduct",
                    ),
                ),
                (
                    "referrer_registration",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="referred_invitees",
                        to="products.bootcampregistration",
                    ),
                ),
                (
                    "invitee_registration",
                    models.ForeignKey(
                        blank=True,
                        help_text="Pendaftaran milik orang yang diajak -- dicatat buat ditelusuri admin, bukan cuma email mentahnya.",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="referred_by",
                        to="products.bootcampregistration",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bootcamp Referred Invitee",
                "verbose_name_plural": "Bootcamp Referred Invitees",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="bootcampreferredinvitee",
            constraint=models.UniqueConstraint(
                fields=("bootcamp", "invitee_email"), name="unique_invitee_per_bootcamp"
            ),
        ),
    ]
