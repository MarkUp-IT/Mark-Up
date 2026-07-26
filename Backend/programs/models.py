from __future__ import annotations

import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class CompetitionCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "competition_categories"
        verbose_name = "Competition Category"
        verbose_name_plural = "Competition Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Competition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        "CompetitionCategory",
        on_delete=models.CASCADE,
        related_name="competitions",
    )
    title = models.CharField(max_length=255)
    image_url = models.URLField(
        blank=True, null=True,
        help_text="Legacy -- link poster lama. Dipakai fallback kalau `image` "
                   "(file upload) belum diisi.",
    )
    image = models.ImageField(upload_to="competition_posters/%Y/%m/", blank=True, null=True)
    organizer = models.CharField(max_length=255, blank=True, null=True)
    registration_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    prizepool = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    event_date = models.DateTimeField(blank=True, null=True)
    deadline = models.DateTimeField(blank=True, null=True)
    level = models.CharField(max_length=100, blank=True, null=True)
    target_participant = models.CharField(max_length=100, blank=True, null=True)
    registration_link = models.URLField(blank=True, null=True)

    class Meta:
        db_table = "competitions"
        verbose_name = "Competition"
        verbose_name_plural = "Competitions"
        indexes = [models.Index(fields=["deadline"])]
        ordering = ["-deadline"]

    def __str__(self) -> str:
        return self.title


class BootcampSessionRequiredBenefit(models.TextChoices):
    """Subset benefit BootcampPackage yang bentuknya sesi terjadwal (bukan
    file) -- dipetakan ke field benefit_<value> di BootcampPackage. Kosong
    ("") berarti sesi inti/materi utama, kelihatan buat semua paket."""
    MENTORING_CASE = "mentoring_case", "Mentoring Case Competition"
    CAREER_COACHING = "career_coaching", "Career Coaching"
    NETWORKING = "networking", "Networking Session"


class BootcampSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        "products.BootcampProduct",
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    meeting_link = models.URLField(blank=True, null=True)
    # Nullable -- slot sesi kosong yang di-generate otomatis dari
    # BootcampProduct.session_count belum punya tanggal sampai admin
    # ngisinya sendiri di Kelola Pesanan Bootcamp.
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    # Urutan tampil (Sesi 1, 2, 3, ...) -- gak bisa ngandelin start_time
    # doang buat sorting karena slot kosong belum punya tanggal.
    order = models.PositiveIntegerField(default=1)
    # Kosong ("", default) = sesi inti, di-clone ke SEMUA pembeli bootcamp
    # ini (perilaku lama, gak berubah). Keisi = cuma di-clone ke pembeli
    # yang benefit_<value> paketnya True -- lihat _create_bootcamp_sessions
    # di transactions/views.py.
    required_benefit = models.CharField(
        max_length=30, choices=BootcampSessionRequiredBenefit.choices, blank=True, default="",
    )

    class Meta:
        db_table = "bootcamp_sessions"
        verbose_name = "Bootcamp Session"
        verbose_name_plural = "Bootcamp Sessions"
        indexes = [models.Index(fields=["start_time"])]
        ordering = ["order", "start_time"]

    def __str__(self) -> str:
        return self.title


class BootcampSessionMentor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp_session = models.ForeignKey(
        "BootcampSession",
        on_delete=models.CASCADE,
        related_name="session_mentors",
    )
    mentor_profile = models.ForeignKey(
        "mentors.MentorProfile",
        on_delete=models.CASCADE,
        related_name="bootcamp_session_assignments",
    )

    class Meta:
        db_table = "bootcamp_session_mentors"
        verbose_name = "Bootcamp Session Mentor"
        verbose_name_plural = "Bootcamp Session Mentors"
        constraints = [
            models.UniqueConstraint(
                fields=["bootcamp_session", "mentor_profile"],
                name="unique_bootcamp_session_mentor",
            )
        ]
        ordering = ["bootcamp_session", "mentor_profile"]

    def __str__(self) -> str:
        return f"{self.bootcamp_session} -> {self.mentor_profile}"


