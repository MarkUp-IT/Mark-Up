from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole
from mentors.models import MentorProfile, MentorAvailability
from .models import (
    Product,
    ProductType,
    BootcampProduct,
    MentoringProduct,
    UserLibrary,
    BootcampSession,
    MentoringSession,
    RefundRequest,
)


class ProductsApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="password123",
            fullname="Test User",
            role=UserRole.STUDENT,
        )

        self.mentor_user = User.objects.create_user(
            username="mentor1",
            email="mentor1@example.com",
            password="password123",
            fullname="Mentor One",
            role=UserRole.MENTOR,
        )
        self.mentor_profile = MentorProfile.objects.create(
            user=self.mentor_user,
            bio="Experienced mentor",
            bank_name="Bank ABC",
            bank_account="123456789",
            linkedin_url="https://linkedin.com/in/mentor1",
        )

        self.access_token = str(RefreshToken.for_user(self.user).access_token)
        self.auth_headers = {"HTTP_AUTHORIZATION": f"Bearer {self.access_token}"}

        self.bootcamp_product = Product.objects.create(type=ProductType.BOOTCAMP)
        self.bootcamp_detail = BootcampProduct.objects.create(
            product=self.bootcamp_product,
            title="Bootcamp A",
            description="A bootcamp",
            explanation="Detailed description",
            image_url="https://example.com/image.png",
            original_price=1000,
            discount_percent=10,
            sold_count=1,
            is_active=True,
            registration_link="https://example.com/register",
            stock=20,
        )

        self.user_library = UserLibrary.objects.create(
            user=self.user,
            product=self.bootcamp_product,
        )

        self.bootcamp_session = BootcampSession.objects.create(
            bootcamp=self.bootcamp_detail,
            user_library=self.user_library,
            order=1,
            title="Session 1",
            start_time=timezone.now() + timezone.timedelta(days=1),
            status=BootcampSession.SessionStatus.SCHEDULED,
            meeting_link="https://meet.example.com/1",
            recording_url="",
        )
        self.bootcamp_session.mentors.set([self.mentor_profile])

        self.mentoring_product = Product.objects.create(type=ProductType.MENTORING)
        self.mentoring_detail = MentoringProduct.objects.create(
            product=self.mentoring_product,
            title="Mentoring A",
            description="Mentoring description",
            explanation="Mentoring explanation",
            image_url="https://example.com/mentor.png",
            original_price=500,
            discount_percent=0,
            sold_count=1,
            is_active=True,
            registration_link="https://example.com/mentor",
            mentor=self.mentor_profile,
            session_count=1,
            duration_minutes=60,
        )

        self.mentoring_library = UserLibrary.objects.create(
            user=self.user,
            product=self.mentoring_product,
        )

        self.availability_slot = MentorAvailability.objects.create(
            mentor_profile=self.mentor_profile,
            start_time=timezone.now() + timezone.timedelta(days=2),
            end_time=timezone.now() + timezone.timedelta(days=2, hours=1),
        )

        self.mentoring_session = MentoringSession.objects.create(
            mentoring=self.mentoring_detail,
            user_library=self.mentoring_library,
            order=1,
            mentor=self.mentor_profile,
            status=MentoringSession.SessionStatus.WAITING_SCHEDULE,
        )

    def test_get_my_products_requires_authentication(self):
        url = reverse("api_my_products_list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"detail": "Authentication required."})

    def test_get_my_products_returns_owned_items(self):
        url = reverse("api_my_products_list")
        response = self.client.get(url, **self.auth_headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("bootcamp", data)
        self.assertIn("mentoring", data)
        self.assertIn("modul", data)
        self.assertEqual(len(data["bootcamp"]), 1)
        self.assertEqual(data["bootcamp"][0]["id"], str(self.bootcamp_product.id))

    def test_get_my_product_detail_non_owned_returns_404(self):
        other_user = User.objects.create_user(
            username="otheruser",
            email="otheruser@example.com",
            password="password123",
            fullname="Other User",
            role=UserRole.STUDENT,
        )
        other_product = Product.objects.create(type=ProductType.MODULE)
        other_detail = Product.objects.create(type=ProductType.MODULE)
        url = reverse("api_my_product_detail", args=[other_product.id])

        response = self.client.get(url, **self.auth_headers)
        self.assertEqual(response.status_code, 404)

    def test_schedule_my_product_session(self):
        url = reverse("api_my_product_schedule", args=[self.mentoring_session.id])
        payload = {
            "session_type": "mentoring",
            "availability_slot_id": str(self.availability_slot.id),
        }
        response = self.client.post(url, payload, content_type="application/json", **self.auth_headers)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "scheduled")
        self.assertEqual(data["mentor_id"], self.mentor_user.username)
        self.assertEqual(data["id"], str(self.mentoring_session.id))

    def test_refund_my_product_allows_pending_refund(self):
        url = reverse("api_my_product_refund", args=[self.bootcamp_product.id])
        payload = {"reason": "I need a refund."}
        response = self.client.post(url, payload, content_type="application/json", **self.auth_headers)

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "pending")
        self.assertEqual(data["user_library_id"], str(self.user_library.id))
