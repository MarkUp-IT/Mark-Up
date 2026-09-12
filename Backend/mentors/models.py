import uuid
from django.db import models
from accounts.models import User

class Expertise(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class MentorProfile(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="mentor_profile"
    )

    headline = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    bio = models.TextField(
        blank=True,
        null=True
    )

    bank_name = models.CharField(max_length=255)

    bank_account = models.CharField(max_length=255)

    bank_account_holder = models.CharField(max_length=255, blank=True, default="")

    linkedin_url = models.CharField(max_length=255)

    instagram_url = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    review_count = models.PositiveIntegerField(default=0)

    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
    )

    mentoring_fee_percent_override = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Persentase komisi mentoring khusus mentor ini (0-100). "
                   "Kosong = pakai persentase global dari CommissionSetting.",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.fullname}"

    def missing_profile_fields(self):
        """[{key, label}] untuk syarat profil mentor yang belum terpenuhi.

        Ini yang menentukan mentor lolos gate dashboard (lihat useAuthGuard di
        frontend) sekaligus muncul di /mentors publik. Bio, headline, dan
        pengalaman kerja sengaja dibiarkan opsional.

        Daftarnya dipakai bersama oleh badge "profil belum lengkap" DAN sorotan
        di halaman Settings, supaya angka merah selalu punya penjelasan yang
        cocok -- bukan angka tanpa petunjuk apa yang kurang.
        """
        user = self.user
        syarat = [
            ("profile_image", "Foto Profil", bool(user.profile_image)),
            ("phone", "Nomor WhatsApp", bool((user.phone or "").strip())),
            ("linkedin_url", "LinkedIn", bool((self.linkedin_url or "").strip())),
            ("instagram_url", "Instagram", bool((self.instagram_url or "").strip())),
            ("bank_name", "Nama Bank", bool((self.bank_name or "").strip())),
            ("bank_account", "Nomor Rekening", bool((self.bank_account or "").strip())),
            ("bank_account_holder", "Nama Pemilik Rekening", bool((self.bank_account_holder or "").strip())),
            ("expertises", "Minimal 1 Keahlian", self.mentor_expertises.exists()),
        ]
        return [{"key": k, "label": l} for k, l, terisi in syarat if not terisi]

    def is_profile_complete(self):
        return not self.missing_profile_fields()


class MentorExperience(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    mentor_profile = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="mentor_experiences",
        null=False
    )

    title = models.CharField(
        max_length=255,
        null=False
        )

    description = models.TextField(
        blank=True
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

class MentorAvailability(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    mentor_profile = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="mentor_availabilities",
        null=False
    )

    start_time = models.DateTimeField()

    end_time = models.DateTimeField()

    is_booked = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["mentor_profile", "start_time"],
                name="unique_mentor_availability_slot",
            )
        ]


class MentorExpertise(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    mentor_profile = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="mentor_expertises",
        null=False
    )

    expertise = models.ForeignKey(
        Expertise,
        on_delete=models.CASCADE,
        related_name="mentor_expertises",
        null=False
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["mentor_profile", "expertise"],
                name="unique_mentor_expertise"
            )
        ]


