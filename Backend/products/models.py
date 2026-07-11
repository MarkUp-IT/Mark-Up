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
    explanation = models.TextField(default='')
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

    class Meta:
        verbose_name = "Mentoring Product"
        verbose_name_plural = "Mentoring Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


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
        related_name="reviews"
        
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
        null=True
    )
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_product_review"
            )
        ]

    