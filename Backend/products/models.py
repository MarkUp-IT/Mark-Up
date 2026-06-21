from __future__ import annotations

import uuid

from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class ProductType(models.TextChoices):
    MENTORING = "MENTORING", "Mentoring"
    MODULE = "MODULE", "Module"
    BOOTCAMP = "BOOTCAMP", "Bootcamp"
    EVENT_SPACE = "EVENT_SPACE", "Event Space"


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
    description = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

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

    class Meta:
        verbose_name = "Bootcamp Product"
        verbose_name_plural = "Bootcamp Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class EventSpaceProduct(BaseModel):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="event_space_detail",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    image_url = models.URLField(blank=True, null=True)
    price_online = models.DecimalField(max_digits=12, decimal_places=2)
    price_offline = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Event Space Product"
        verbose_name_plural = "Event Space Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title
