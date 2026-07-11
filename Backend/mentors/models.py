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

    bio = models.TextField(
        blank=True,
        null=True
    )

    bank_name = models.CharField(max_length=255)

    bank_account = models.CharField(max_length=255)

    linkedin_url = models.CharField(max_length=255)

    instagram_url = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.fullname}"


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


class MentoringSession(models.Model):
    class SessionStatus(models.TextChoices):
        BOOKED = "BOOKED", "Booked"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        NO_SHOW = "NO_SHOW", "No Show"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="mentor_mentoring_sessions",
    )
    mentoring_product = models.ForeignKey(
        "products.MentoringProduct",
        on_delete=models.PROTECT,
        related_name="mentoring_sessions",
    )
    mentor_availability = models.OneToOneField(
        MentorAvailability,
        on_delete=models.PROTECT,
        related_name="mentoring_session",
    )
    meeting_link = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=SessionStatus.choices,
        default=SessionStatus.BOOKED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.mentoring_product}"