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

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.fullname}"

    def is_profile_complete(self):
        """Field wajib biar mentor lolos gate dashboard (lihat useAuthGuard
        di FE) & muncul di /mentors publik -- foto, WhatsApp, LinkedIn,
        Instagram, rekening, minimal 1 keahlian. Bio, headline, dan
        pengalaman kerja sengaja dibiarkan opsional."""
        user = self.user
        return bool(
            user.profile_image
            and user.phone
            and self.linkedin_url
            and self.instagram_url
            and self.bank_name
            and self.bank_account
            and self.bank_account_holder
            and self.mentor_expertises.exists()
        )


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


