"""Pembuat data tes yang dipakai ulang semua file tes.

Jalankan semua tes (di server, butuh izin CREATEDB):
    python manage.py test --settings=mark_up.test_settings

Semua data dibuat di database tes terpisah yang otomatis dibuang -- gak
pernah menyentuh data produksi. Lihat mark_up/test_settings.py.
"""
import json
import uuid
from datetime import timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole, UserStatus
from mentors.models import Expertise, MentorAvailability, MentorExpertise, MentorProfile
from products.models import (
    BootcampPackage, BootcampProduct, MentoringProduct, ModuleProduct, Product, ProductType,
)
from transactions.models import IpaymuSetting, ReferralCode


def _unik():
    return uuid.uuid4().hex[:8]


def buat_user(role=UserRole.STUDENT, lengkap=True, **extra):
    data = {
        "email": f"tes_{_unik()}@contoh.test",
        "fullname": f"Pengguna Tes {_unik()}",
        "role": role,
        "status": UserStatus.ACTIVE,
        "is_email_verified": True,
    }
    if lengkap:
        data.update(phone="081234567890", institution="Universitas Tes", current_status="Mahasiswa")
    data.update(extra)
    password = data.pop("password", "Rahasia123!")
    return User.objects.create_user(password=password, **data)


def buat_admin(**extra):
    return buat_user(role=UserRole.ADMIN, **extra)


def buat_expertise(nama="BCC"):
    return Expertise.objects.create(name=nama)


def buat_mentor(expertise=None, lengkap=True, **extra_user):
    """Default-nya mentor LENGKAP (lolos MentorProfile.mentor_status ==
    ACTIVE, jadi bisa dipesan). lengkap=False -> data wajibnya bolong."""
    if lengkap:
        extra_user.setdefault("profile_image", "profile_images/tes.jpg")
    user = buat_user(role=UserRole.MENTOR, lengkap=lengkap, **extra_user)
    profil = MentorProfile.objects.create(
        user=user, headline="Mentor Tes", bio="Bio mentor tes yang cukup panjang.",
        bank_name="BCA", bank_account="1234567890", linkedin_url="https://linkedin.com/in/tes",
        instagram_url="https://instagram.com/tes" if lengkap else None,
        bank_account_holder="Mentor Tes" if lengkap else "",
    )
    if lengkap and not expertise:
        expertise = [Expertise.objects.get_or_create(name="Umum")[0]]
    for e in (expertise or []):
        MentorExpertise.objects.create(mentor_profile=profil, expertise=e)
    return profil


def buat_slot(mentor, jam_lagi=48, durasi_menit=60, booked=False):
    mulai = timezone.now() + timedelta(hours=jam_lagi)
    return MentorAvailability.objects.create(
        mentor_profile=mentor, start_time=mulai, end_time=mulai + timedelta(minutes=durasi_menit),
        is_booked=booked,
    )


def buat_mentoring(harga=100000, sesi=2, expertise=None, aktif=True, diskon=None):
    product = Product.objects.create(type=ProductType.MENTORING)
    detail = MentoringProduct.objects.create(
        product=product, title=f"Mentoring Tes {_unik()}", description="Deskripsi tes",
        original_price=Decimal(harga), discount_percent=diskon, session_count=sesi, is_active=aktif,
    )
    for e in (expertise or []):
        detail.expertise.add(e)
    return product


def buat_modul(harga=50000, stok=10, aktif=True):
    product = Product.objects.create(type=ProductType.MODULE)
    ModuleProduct.objects.create(
        product=product, title=f"Modul Tes {_unik()}", description="Deskripsi tes",
        original_price=Decimal(harga), stock=stok, is_active=aktif,
        file_pdf_url="https://contoh.test/modul.pdf",
    )
    return product


def buat_bootcamp(stok=50, aktif=True, **paket_extra):
    product = Product.objects.create(type=ProductType.BOOTCAMP)
    detail = BootcampProduct.objects.create(
        product=product, title=f"Bootcamp Tes {_unik()}", description="Deskripsi tes",
        original_price=Decimal(200000), stock=stok, is_active=aktif,
    )
    paket = BootcampPackage.objects.create(
        bootcamp=detail, slug=f"mentee-{_unik()}", name="Mentee", price=Decimal(paket_extra.pop("price", 200000)),
        **paket_extra,
    )
    return product, paket


def buat_referral(kode=None, persen=10, kuota=5, **extra):
    return ReferralCode.objects.create(
        code=kode or f"KODE{_unik().upper()}", discount_type="percentage",
        discount_value=Decimal(persen), quota=kuota, **extra,
    )


def nyalakan_ipaymu():
    setting = IpaymuSetting.get_solo()
    setting.is_enabled = True
    setting.va_number = "0000000000"
    setting.save()
    return setting


def bukti_pdf(nama="bukti.pdf"):
    return SimpleUploadedFile(nama, b"%PDF-1.4 bukti transfer tes", content_type="application/pdf")


def beli_lunas(test, user, product, slot=None):
    """Beli lewat jalur ASLI (checkout transfer manual -> admin ACC) dan
    balikin Transaction-nya. `test` wajib punya atribut `admin`."""
    from transactions.models import Transaction

    data = {"product_id": str(product.id), "proof_of_payment": bukti_pdf()}
    if slot is not None:
        data["availability_slot_id"] = str(slot.id)
    r = test.post_form("/api/transactions/checkout/", data, user=user)
    test.assertEqual(r.status_code, 201, r.content)
    txn_id = r.json()["transaction_id"]
    r = test.patch_json(f"/api/transactions/{txn_id}/verify/", {"decision": "paid"}, user=test.admin)
    test.assertEqual(r.status_code, 200, r.content)
    return Transaction.objects.get(id=txn_id)


class ApiTestCase(TestCase):
    """TestCase dengan helper request ber-JWT."""

    def auth(self, user):
        if user is None:
            return {}
        return {"HTTP_AUTHORIZATION": f"Bearer {RefreshToken.for_user(user).access_token}"}

    def get(self, url, user=None, **extra):
        return self.client.get(url, **self.auth(user), **extra)

    def post_json(self, url, data=None, user=None):
        return self.client.post(url, json.dumps(data or {}), content_type="application/json", **self.auth(user))

    def patch_json(self, url, data=None, user=None):
        return self.client.patch(url, json.dumps(data or {}), content_type="application/json", **self.auth(user))

    def post_form(self, url, data=None, user=None):
        return self.client.post(url, data or {}, **self.auth(user))

    def delete(self, url, user=None):
        return self.client.delete(url, **self.auth(user))
