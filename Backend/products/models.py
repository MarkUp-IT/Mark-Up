from __future__ import annotations
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from django.db import models
from accounts.models import User
from mentors.models import MentorProfile

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class ProductType(models.TextChoices):
    MENTORING = "MENTORING", "Mentoring"
    MODULE = "MODULE", "Module"
    BOOTCAMP = "BOOTCAMP", "Bootcamp"


class Product(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.MENTORING,
    )

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.get_type_display()} ({self.id})"


class BaseProductDetail(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=500)
    explanation = models.TextField(
        blank=True,
        default=""
    )
    published_at = models.DateTimeField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percent = models.PositiveIntegerField(null=True, blank=True)
    sold_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    registration_link = models.URLField(blank=True)

    @property
    def new_price(self):
        if self.original_price is None:
            return None

        if self.discount_percent in (None, 0):
            return self.original_price

        discount_rate = Decimal(self.discount_percent) / Decimal("100")
        discounted_price = self.original_price * (Decimal("1") - discount_rate)
        return discounted_price.quantize(Decimal("0.01"))

    class Meta:
        abstract = True


class MentoringProduct(BaseProductDetail):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="mentoring_detail",
        
    )

    session_count = models.PositiveIntegerField(default=1)
    duration_minutes = models.PositiveIntegerField(default=60)

    class Meta:
        verbose_name = "Mentoring Product"
        verbose_name_plural = "Mentoring Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class MentoringHighlight(models.Model):
    mentoring = models.ForeignKey(
        MentoringProduct,
        on_delete=models.CASCADE,
        related_name="highlights",
    )
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return self.text


class ModuleProduct(BaseProductDetail):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="module_detail",
    )
    file_pdf_url = models.URLField()
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Module Product"
        verbose_name_plural = "Module Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class BootcampProduct(BaseProductDetail):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="bootcamp_detail",
    )
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Bootcamp Product"
        verbose_name_plural = "Bootcamp Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class Review(BaseModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )
    review_text = models.TextField(
        blank=True,
        null=True,
    )
    is_hidden = models.BooleanField(default=False)
    is_seen_by_admin = models.BooleanField(
        default=False,
        help_text="Ke-set True begitu admin buka halaman daftar ulasan -- dipakai buat badge notifikasi 'ulasan baru' di sidebar.",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_product_review"
            )
        ]


class UserLibrary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="product_libraries",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="user_libraries",
    )
    purchased_at = models.DateTimeField(auto_now_add=True)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        verbose_name = "User Library"
        verbose_name_plural = "User Libraries"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_product_library"
            )
        ]
        ordering = ["-purchased_at"]

    def __str__(self) -> str:
        return f"{self.user} -> {self.product}"


class BootcampSession(models.Model):
    class SessionStatus(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        WAITING_SCHEDULE = "waiting_schedule", "Waiting Schedule"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct,
        on_delete=models.CASCADE,
        related_name="user_sessions",
    )
    user_library = models.ForeignKey(
        UserLibrary,
        on_delete=models.CASCADE,
        related_name="bootcamp_sessions",
    )
    template = models.ForeignKey(
        "programs.BootcampSession",
        on_delete=models.SET_NULL,
        related_name="buyer_sessions",
        null=True,
        blank=True,
        help_text="Sesi jadwal/template asal (dikelola admin) -- dipakai supaya "
                  "update judul/mentor/link di template ikut ke-sync ke semua "
                  "peserta yang sudah beli, karena satu sesi bootcamp itu kelas "
                  "bareng dengan satu link yang sama untuk semua peserta.",
    )
    order = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=255)
    mentors = models.ManyToManyField(
        MentorProfile,
        related_name="bootcamp_sessions",
        blank=True,
    )
    start_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=SessionStatus.choices,
        default=SessionStatus.WAITING_SCHEDULE,
    )
    meeting_link = models.URLField(blank=True)
    recording_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Bootcamp Session"
        verbose_name_plural = "Bootcamp Sessions"
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.bootcamp} - {self.title}"


class MentoringSession(models.Model):
    class SessionStatus(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        WAITING_SCHEDULE = "waiting_schedule", "Waiting Schedule"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentoring = models.ForeignKey(
        MentoringProduct,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    user_library = models.ForeignKey(
        UserLibrary,
        on_delete=models.CASCADE,
        related_name="mentoring_sessions",
    )
    order = models.PositiveIntegerField(default=1)
    mentor = models.ForeignKey(
        MentorProfile,
        on_delete=models.CASCADE,
        related_name="product_mentoring_sessions",
    )
    start_time = models.DateTimeField(blank=True, null=True)
    availability_slot = models.ForeignKey(
        "mentors.MentorAvailability",
        on_delete=models.SET_NULL,
        related_name="product_mentoring_sessions",
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=SessionStatus.choices,
        default=SessionStatus.WAITING_SCHEDULE,
    )
    zoom_link = models.URLField(blank=True)
    recording_url = models.URLField(blank=True)

    class Meta:
        verbose_name = "Mentoring Session"
        verbose_name_plural = "Mentoring Sessions"
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.mentoring} - session {self.order}"


class RefundRequest(models.Model):
    class RefundStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_library = models.ForeignKey(
        UserLibrary,
        on_delete=models.CASCADE,
        related_name="refund_requests",
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=RefundStatus.choices,
        default=RefundStatus.PENDING,
    )
    admin_fee_percent = models.PositiveIntegerField(default=10)
    admin_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Refund Request"
        verbose_name_plural = "Refund Requests"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"RefundRequest {self.id} ({self.status})"


class CertificateType(models.TextChoices):
    PARTICIPANT = "participant", "Participant"
    INSTRUCTOR = "instructor", "Instructor"


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=CertificateType.choices)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certificates",
    )
    file = models.FileField(upload_to="certificates/%Y/%m/")
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"
        ordering = ["-issued_at"]

    def __str__(self) -> str:
        return self.number
