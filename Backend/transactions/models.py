from __future__ import annotations
import uuid
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models

from products.models import Product

User = get_user_model()


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PAID = "PAID", "Paid"
    FAILED = "FAILED", "Failed"
    EXPIRED = "EXPIRED", "Expired"
    REFUNDED = "REFUNDED", "Refunded"


class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
    QRIS = "QRIS", "QRIS"
    E_WALLET = "E_WALLET", "E-Wallet"
    CREDIT_CARD = "CREDIT_CARD", "Credit Card"
    MANUAL = "MANUAL", "Manual"


class Transaction(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=30,
        help_text="Human-readable transaction code",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    promo_code = models.CharField(max_length=100, blank=True, null=True)
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    tax = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    @property
    def calculated_grand_total(self):
        return self.sub_total - self.discount_amount + self.tax 
    
    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["payment_status"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.id


class TransactionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="transaction_items",
    )
    price_at_checkout = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    mentor_availability = models.OneToOneField(
        "mentors.MentorAvailability",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="transaction_item",
    )

    class Meta:
        verbose_name = "Transaction Item"
        verbose_name_plural = "Transaction Items"
        constraints = [
            models.UniqueConstraint(
                fields=["transaction", "product", "mentor_availability"],
                name="unique_transaction_product_availability"
            )
        ]
        indexes = [
            models.Index(fields=["transaction"]),
            models.Index(fields=["product"]),
        ]
        ordering = ["transaction", "product"]

    def __str__(self) -> str:
        return f"{self.transaction_id} - {self.product}"


class UserLibrary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="libraries",
    )
    transaction_item = models.OneToOneField(
        TransactionItem,
        on_delete=models.CASCADE,
        related_name="library_access",
    )
    
    active_date = models.DateTimeField(blank=True, null=True)
    expire_date = models.DateTimeField(blank=True, null=True)

    @property
    def product(self):
        return self.transaction_item.product

    class Meta:
        verbose_name = "User Library"
        verbose_name_plural = "User Libraries"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["active_date"]),
            models.Index(fields=["expire_date"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "transaction_item"],
                name="unique_user_product_transaction_item",
            )
        ]
        ordering = ["-active_date"]

    def __str__(self) -> str:
        return f"{self.user} -> {self.product}"


