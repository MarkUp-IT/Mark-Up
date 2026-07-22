from __future__ import annotations
import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models

from products.models import Product
from django.utils import timezone

User = get_user_model()

def generate_transaction_id():
    return f"TRX-{timezone.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"



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
        default=generate_transaction_id,
        editable=False,
        help_text="Human-readable transaction code",
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    buyer_phone = models.CharField(max_length=20, blank=True, null=True) 
    sub_total = models.DecimalField(max_digits=12, decimal_places=2)
    promo_code = models.CharField(max_length=100, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.BANK_TRANSFER)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    proof_of_payment = models.FileField(
            upload_to="payment_proofs/%Y/%m/",
            blank=True,
            null=True,
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


class DiscountType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FIXED = "fixed", "Fixed"


class ReferralCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(
        max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    max_discount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    quota = models.PositiveIntegerField()
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    applies_to_all = models.BooleanField(default=True)
    products = models.ManyToManyField(
        Product, blank=True, related_name="referral_codes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid_for_product(self, product, user=None):
        if not self.is_active:
            return False
        if self.used_count >= self.quota:
            return False
        if user is not None and self.usages.filter(user=user).exists():
            return False
        if self.applies_to_all:
            return True
        return self.products.filter(id=product.id).exists()

    def compute_discount(self, price):
        price = Decimal(str(price))
        if self.discount_type == DiscountType.PERCENTAGE:
            amount = (price * self.discount_value) / Decimal("100")
            if self.max_discount is not None:
                amount = min(amount, self.max_discount)
        else:
            amount = self.discount_value
        return min(amount, price).quantize(Decimal("0.01"))

    class Meta:
        verbose_name = "Referral Code"
        verbose_name_plural = "Referral Codes"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.code


class ReferralCodeUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referral_code = models.ForeignKey(
        ReferralCode, on_delete=models.CASCADE, related_name="usages"
    )
    transaction = models.OneToOneField(
        Transaction, on_delete=models.CASCADE, related_name="referral_usage"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="referral_code_usages"
    )
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Referral Code Usage"
        verbose_name_plural = "Referral Code Usages"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.referral_code} -> {self.transaction_id}"


class PayoutSourceType(models.TextChoices):
    MENTORING = "mentoring", "Mentoring"
    BOOTCAMP = "bootcamp", "Bootcamp"


class PayoutStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"


class MentorPayout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor_profile = models.ForeignKey(
        "mentors.MentorProfile", on_delete=models.CASCADE, related_name="payouts"
    )
    source_type = models.CharField(max_length=20, choices=PayoutSourceType.choices)
    mentoring_session = models.OneToOneField(
        "products.MentoringSession",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payout",
    )
    bootcamp_session = models.ForeignKey(
        "products.BootcampSession",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payouts",
        help_text="ForeignKey (bukan OneToOne) karena satu sesi bootcamp bisa "
                  "diajar >1 mentor -- tiap mentor yang ditugaskan dapat baris "
                  "payout sendiri-sendiri untuk sesi yang sama.",
    )
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    fee_percent = models.PositiveIntegerField(default=20)
    status = models.CharField(
        max_length=20, choices=PayoutStatus.choices, default=PayoutStatus.PENDING
    )
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def net_amount(self):
        fee = (self.gross_amount * self.fee_percent) / Decimal("100")
        return self.gross_amount - fee

    class Meta:
        verbose_name = "Mentor Payout"
        verbose_name_plural = "Mentor Payouts"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["bootcamp_session", "mentor_profile"],
                condition=models.Q(bootcamp_session__isnull=False),
                name="unique_bootcamp_session_mentor_payout",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.mentor_profile} - {self.gross_amount}"
