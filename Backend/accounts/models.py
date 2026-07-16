import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    MENTOR = "MENTOR", "Mentor"
    STUDENT = "STUDENT", "Mentee"


class UserStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"


class User(AbstractUser):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    fullname = models.CharField(max_length=255)
    
    username = None
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    email = models.EmailField(
        unique=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT
    )

    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE
    )

    profile_image = models.ImageField(
        upload_to="profile_photos/%Y/%m/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )   

    institution = models.CharField(max_length=255, blank=True, default="")
    current_status = models.CharField(max_length=100, blank=True, default="")
    linkedin_url = models.URLField(blank=True, default="")

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.fullname