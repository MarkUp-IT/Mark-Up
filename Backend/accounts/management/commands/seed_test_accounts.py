from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User, UserRole
from mentors.models import (
    Expertise,
    MentorAvailability,
    MentorExperience,
    MentorExpertise,
    MentorProfile,
)

ADMIN_ACCOUNTS = [
    {
        "email": "admin@markup.test",
        "password": "Admin12345!",
        "fullname": "Admin MarkUp",
    },
]

STUDENT_ACCOUNTS = [
    {
        "email": "user@markup.test",
        "password": "User12345!",
        "fullname": "User Testing",
    },
]

MENTOR_ACCOUNTS = [
    {
        "email": "alya.hamidah@markup-mentor.test",
        "fullname": "Alya Hamidah",
        "headline": "Business Case Strategist & Ex-Consultant",
        "bio": (
            "5+ tahun mendampingi tim BCC nasional, spesialis framework "
            "problem-solving (MECE, Porter's Five Forces) dan penyusunan "
            "rekomendasi strategis yang tajam dan realistis."
        ),
        "linkedin_url": "https://linkedin.com/in/alya-hamidah",
        "instagram_url": "https://instagram.com/alyahamidah",
        "expertise": ["Business Case", "Strategy Consulting", "Market Analysis"],
        "experiences": [
            ("Senior Associate, Strategy Consulting Firm", "2021-01-01", None),
            ("Juara 1 National Business Case Competition", "2019-06-01", "2019-06-01"),
        ],
    },
    {
        "email": "adena.laksita@markup-mentor.test",
        "fullname": "Adena Laksita",
        "headline": "Pitching Coach & Public Speaking Trainer",
        "bio": (
            "Fokus di persiapan pitching dan presentasi final round -- dari "
            "storytelling, struktur slide, sampai simulasi QnA juri yang bikin "
            "mentee lebih percaya diri di panggung."
        ),
        "linkedin_url": "https://linkedin.com/in/adena-laksita",
        "instagram_url": "https://instagram.com/adenalaksita",
        "expertise": ["Pitching", "Public Speaking", "Business Plan"],
        "experiences": [
            ("Pitching Coach, Startup Incubator", "2022-03-01", None),
            ("Finalis Business Plan Competition Nasional", "2018-08-01", "2018-08-01"),
        ],
    },
    {
        "email": "fathir.ramadhan@markup-mentor.test",
        "fullname": "Fathir Ramadhan",
        "headline": "Financial Modeling & Business Plan Specialist",
        "bio": (
            "Membantu tim menyusun proyeksi keuangan dan business plan yang "
            "logis dan meyakinkan, dari revenue model sampai unit economics."
        ),
        "linkedin_url": "https://linkedin.com/in/fathir-ramadhan",
        "instagram_url": "https://instagram.com/fathirramadhan",
        "expertise": ["Financial Modeling", "Business Plan", "Market Analysis"],
        "experiences": [
            ("Financial Analyst, Venture Capital", "2020-05-01", None),
        ],
    },
    {
        "email": "sarah.jenkins@markup-mentor.test",
        "fullname": "Sarah Jenkins",
        "headline": "Marketing & Personal Branding Mentor",
        "bio": (
            "Membantu mentee membangun personal branding yang kuat, dari "
            "optimasi LinkedIn/CV sampai strategi marketing untuk studi kasus "
            "berbasis consumer goods."
        ),
        "linkedin_url": "https://linkedin.com/in/sarah-jenkins",
        "instagram_url": "https://instagram.com/sarahjenkins",
        "expertise": ["Marketing", "Personal Branding", "Business Case"],
        "experiences": [
            ("Brand Manager, FMCG Company", "2021-09-01", None),
        ],
    },
    {
        "email": "muhammad.arfan@markup-mentor.test",
        "fullname": "Muhammad Arfan",
        "headline": "UI/UX & Product Case Mentor",
        "bio": (
            "Spesialis studi kasus produk digital -- user research, wireframing "
            "cepat, sampai menyusun narasi produk yang menjawab masalah nyata."
        ),
        "linkedin_url": "https://linkedin.com/in/muhammad-arfan",
        "instagram_url": "https://instagram.com/muhammadarfan",
        "expertise": ["Product Case", "UI/UX", "Business Case"],
        "experiences": [
            ("Product Designer, Tech Startup", "2022-01-01", None),
        ],
    },
]

MENTOR_PASSWORD = "Mentor12345!"


class Command(BaseCommand):
    help = (
        "Seed akun testing (admin, mentor, student) beserta profil mentor "
        "lengkap (expertise, pengalaman, slot ketersediaan). Aman dijalankan "
        "berulang kali -- akun/email yang sudah ada bakal dilewati."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        for acc in ADMIN_ACCOUNTS:
            self._create_user(acc, role=UserRole.ADMIN)

        for acc in STUDENT_ACCOUNTS:
            self._create_user(acc, role=UserRole.STUDENT)

        for acc in MENTOR_ACCOUNTS:
            self._create_mentor(acc)

        self.stdout.write(self.style.SUCCESS("\nSelesai. Kredensial akun testing:"))
        for acc in ADMIN_ACCOUNTS:
            self.stdout.write(f"  ADMIN   -> {acc['email']} / {acc['password']}")
        for acc in STUDENT_ACCOUNTS:
            self.stdout.write(f"  STUDENT -> {acc['email']} / {acc['password']}")
        for acc in MENTOR_ACCOUNTS:
            self.stdout.write(f"  MENTOR  -> {acc['email']} / {MENTOR_PASSWORD}")

    def _create_user(self, acc, role):
        if User.objects.filter(email=acc["email"]).exists():
            self.stdout.write(f"Dilewati (sudah ada): {acc['email']}")
            return

        User.objects.create_user(
            email=acc["email"],
            password=acc["password"],
            fullname=acc["fullname"],
            role=role,
        )
        self.stdout.write(self.style.SUCCESS(f"Dibuat [{role}]: {acc['email']}"))

    def _create_mentor(self, m):
        if User.objects.filter(email=m["email"]).exists():
            self.stdout.write(f"Dilewati (sudah ada): {m['email']}")
            return

        user = User.objects.create_user(
            email=m["email"],
            password=MENTOR_PASSWORD,
            fullname=m["fullname"],
            role=UserRole.MENTOR,
        )

        profile = MentorProfile.objects.create(
            user=user,
            headline=m["headline"],
            bio=m["bio"],
            bank_name="BCA",
            bank_account="1234567890",
            bank_account_holder=m["fullname"],
            linkedin_url=m["linkedin_url"],
            instagram_url=m["instagram_url"],
        )

        for name in m["expertise"]:
            expertise_obj, _ = Expertise.objects.get_or_create(name=name)
            MentorExpertise.objects.create(mentor_profile=profile, expertise=expertise_obj)

        for title, start, end in m["experiences"]:
            MentorExperience.objects.create(
                mentor_profile=profile,
                title=title,
                description="",
                start_date=date.fromisoformat(start),
                end_date=date.fromisoformat(end) if end else None,
            )

        now = timezone.now()
        for days_ahead, hour in [(2, 9), (4, 14), (6, 19)]:
            start_time = (now + timedelta(days=days_ahead)).replace(
                hour=hour, minute=0, second=0, microsecond=0
            )
            MentorAvailability.objects.create(
                mentor_profile=profile,
                start_time=start_time,
                end_time=start_time + timedelta(hours=1),
                is_booked=False,
            )

        self.stdout.write(self.style.SUCCESS(f"Dibuat [MENTOR]: {m['email']}"))
