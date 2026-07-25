import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    MENTOR = "MENTOR", "Mentor"
    STUDENT = "STUDENT", "Mentee"


class UserStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"


class CustomUserManager(UserManager):
    """User model pakai email sebagai USERNAME_FIELD dan sudah nggak punya
    field username sama sekali, jadi create_user/create_superuser bawaan
    Django (yang masih minta username) perlu di-override."""

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email harus diisi.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("fullname", extra_fields.get("fullname") or email)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser harus punya is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser harus punya is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


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

    objects = CustomUserManager()

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

    # Default True biar akun yang dibuat lewat createsuperuser/admin panel
    # nggak ketutup login. register_view yang secara eksplisit set ini ke
    # False lalu kirim email verifikasi, karena cuma alur publik itu yang
    # butuh verifikasi email.
    is_email_verified = models.BooleanField(default=True)

    profile_image = models.ImageField(
        upload_to="profile_photos/%Y/%m/",
        blank=True,
        null=True,
    )

    cv_file = models.FileField(
        upload_to="user_cv/%Y/%m/",
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

    def is_profile_complete(self):
        """Field wajib biar student bisa checkout -- nama, WhatsApp,
        institusi, status/semester, LinkedIn, foto profil. CV/portofolio
        sengaja dibiarkan opsional (pelengkap konteks mentoring doang,
        bukan data inti)."""
        return bool(
            self.fullname
            and (self.phone or "").strip()
            and (self.institution or "").strip()
            and (self.current_status or "").strip()
            and (self.linkedin_url or "").strip()
            and self.profile_image
        )


class ContactMessageStatus(models.TextChoices):
    NEW = "new", "New"
    READ = "read", "Read"


class ContactMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(
        max_length=20, choices=ContactMessageStatus.choices, default=ContactMessageStatus.NEW
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.subject}"


class AuditAction(models.TextChoices):
    CREATE = "CREATE", "Create"
    UPDATE = "UPDATE", "Update"
    DELETE = "DELETE", "Delete"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=20, choices=AuditAction.choices)
    table_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True, default="")
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} {self.table_name} by {self.admin}"