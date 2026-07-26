from __future__ import annotations
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from django.db import models
from accounts.models import User
from mentors.models import MentorProfile, Expertise

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
    # image_url = URL eksternal (legacy / kalau admin mau paste link).
    # image = file yang di-upload admin ke storage; URL-nya di-generate fresh
    # tiap request di serializer (storage pakai presigned URL yang expired,
    # jadi gak boleh disimpen mentah kayak image_url).
    image_url = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to="product_images/%Y/%m/", blank=True, null=True)
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

    expertise = models.ManyToManyField(
        Expertise,
        related_name="mentoring_products",
        blank=True,
        help_text="Kategori mentoring (BCC, BPC, Karir, dst) -- nentuin mentor mana aja "
                   "yang boleh dipilih pembeli produk ini (harus overlap sama keahlian mentor).",
    )

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
    session_count = models.PositiveIntegerField(
        default=1,
        help_text="Jumlah sesi kelas dalam batch ini. Pas produk dibuat/di-update "
                   "naik, otomatis nge-generate slot sesi kosong (programs.BootcampSession) "
                   "sejumlah ini, tinggal diisi tanggal/mentor/link-nya di Kelola Pesanan.",
    )

    class Meta:
        verbose_name = "Bootcamp Product"
        verbose_name_plural = "Bootcamp Products"
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class BootcampPackage(models.Model):
    """Satu produk Bootcamp punya beberapa paket (Mentee/Basic/Premium/Elite)
    dengan harga, benefit, dan ketentuan berbeda. Paket Mentee butuh seleksi &
    ada commitment fee; paket lain langsung (tetap perlu ACC admin)."""

    class PackageSlug(models.TextChoices):
        MENTEE = "mentee", "Mentee"
        BASIC = "basic", "Basic/Beginner"
        PREMIUM = "premium", "Premium/Intermediate"
        ELITE = "elite", "Elite/Advanced"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct,
        on_delete=models.CASCADE,
        related_name="packages",
    )
    slug = models.CharField(max_length=20, choices=PackageSlug.choices)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commitment_fee = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Biaya komitmen yang dikembalikan di akhir program. Hanya "
                   "paket Mentee yang punya (150k). Total bayar = price + commitment_fee.",
    )
    requires_selection = models.BooleanField(
        default=False,
        help_text="True untuk Mentee: pendaftar wajib lolos seleksi (BCC test) "
                   "dulu sebelum boleh bayar. Paket lain cukup di-ACC admin.",
    )
    quiz_duration_minutes = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(5), MaxValueValidator(180)],
        help_text="Durasi tes BCC (menit) -- cuma relevan buat paket dengan requires_selection=True.",
    )
    quiz_passing_score_percent = models.PositiveIntegerField(
        default=70,
        validators=[MaxValueValidator(100)],
        help_text="Ambang nilai lulus (%) tes BCC -- dipakai buat auto-flag lulus/tidak, "
                   "keputusan akhir Terima/Tolak tetap manual oleh admin.",
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    registration_opens_at = models.DateTimeField(blank=True, null=True)
    registration_closes_at = models.DateTimeField(blank=True, null=True)

    # Benefit per paket (sesuai tabel "Class Scheme and Benefits" di PDF).
    benefit_session_material = models.BooleanField(default=True)
    benefit_record_incubation = models.BooleanField(default=False)
    benefit_framework_template = models.BooleanField(default=False)
    benefit_winning_deck = models.BooleanField(default=False)
    benefit_mentoring_case = models.BooleanField(default=False)
    benefit_career_coaching = models.BooleanField(default=False)
    benefit_team_pairing = models.BooleanField(default=False)
    benefit_networking = models.BooleanField(default=False)
    benefit_ecertificate = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Bootcamp Package"
        verbose_name_plural = "Bootcamp Packages"
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(
                fields=["bootcamp", "slug"],
                name="unique_bootcamp_package_slug",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.bootcamp_id})"


# Nilai default 4 paket standar -- dipakai saat produk bootcamp dibuat, biar
# admin gak perlu isi satu-satu. (session_material & ecertificate default True.)
DEFAULT_BOOTCAMP_PACKAGES = [
    {
        "slug": "mentee", "name": "Mentee", "price": 210000, "commitment_fee": 150000,
        "requires_selection": True, "order": 1,
        "benefit_record_incubation": True, "benefit_framework_template": True,
        "benefit_winning_deck": True, "benefit_mentoring_case": True,
        "benefit_career_coaching": True, "benefit_team_pairing": True,
        "benefit_networking": True,
    },
    {
        "slug": "basic", "name": "Basic/Beginner", "price": 100000, "order": 2,
    },
    {
        "slug": "premium", "name": "Premium/Intermediate", "price": 220000, "order": 3,
        "benefit_record_incubation": True, "benefit_framework_template": True,
    },
    {
        "slug": "elite", "name": "Elite/Advanced", "price": 240000, "order": 4,
        "benefit_record_incubation": True, "benefit_framework_template": True,
        "benefit_winning_deck": True,
    },
]


def create_default_bootcamp_packages(bootcamp):
    """Buat 4 paket standar untuk sebuah BootcampProduct kalau belum ada."""
    for cfg in DEFAULT_BOOTCAMP_PACKAGES:
        BootcampPackage.objects.get_or_create(
            bootcamp=bootcamp, slug=cfg["slug"], defaults=cfg,
        )


class BootcampTimelineItem(models.Model):
    """Milestone utama program bootcamp (bukan jadwal sesi kelas) --
    ditampilkan sebagai garis waktu ringkas di halaman produk & pendaftaran.
    Diisi manual oleh admin per batch bootcamp, beda-beda tiap batch."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct,
        on_delete=models.CASCADE,
        related_name="timeline_items",
    )
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField(
        blank=True, null=True,
        help_text="Kosongkan kalau cuma satu hari (mis. hari pengumuman).",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Bootcamp Timeline Item"
        verbose_name_plural = "Bootcamp Timeline Items"
        ordering = ["order", "start_date"]

    def __str__(self) -> str:
        return f"{self.title} ({self.bootcamp_id})"


class BootcampResourceType(models.TextChoices):
    """Cuma benefit berbentuk FILE -- benefit berbentuk sesi (mentoring_case/
    career_coaching/networking) ditegakkan lewat BootcampSession.required_benefit
    di app programs, bukan lewat model ini. team_pairing sengaja belum
    diaktifkan (bukan sekadar file/sesi, butuh fitur matching tim sendiri)."""
    RECORD_INCUBATION = "record_incubation", "Record Incubation"
    FRAMEWORK_TEMPLATE = "framework_template", "Framework Template"
    WINNING_DECK = "winning_deck", "Winning Deck"


class BootcampResource(models.Model):
    """File/materi eksklusif per bootcamp, dikunci per paket lewat
    BootcampPackage.benefit_<resource_type> -- diunggah admin, cuma bisa
    diunduh peserta yang paketnya punya benefit itu (lihat _get_user_library
    di views.py buat logic gate-nya)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct,
        on_delete=models.CASCADE,
        related_name="resources",
    )
    resource_type = models.CharField(max_length=30, choices=BootcampResourceType.choices)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="bootcamp_resources/%Y/%m/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bootcamp Resource"
        verbose_name_plural = "Bootcamp Resources"
        ordering = ["resource_type", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_resource_type_display()})"


class BootcampRegistration(models.Model):
    """Pendaftaran user ke sebuah paket bootcamp. Terpisah dari pembelian
    (Transaction) -- user daftar dulu (upload 1 PDF gabungan syarat), baru
    setelah diterima/di-ACC admin bisa lanjut bayar."""

    class Status(models.TextChoices):
        REGISTERED = "registered", "Menunggu Ditinjau"
        ACCEPTED = "accepted", "Diterima"
        REJECTED = "rejected", "Ditolak"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="bootcamp_registrations",
    )
    package = models.ForeignKey(
        BootcampPackage, on_delete=models.CASCADE, related_name="registrations",
    )
    requirement_doc = models.FileField(
        upload_to="bootcamp_registrations/%Y/%m/",
        help_text="Satu PDF gabungan berisi 5 bukti syarat pendaftaran.",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.REGISTERED,
    )
    admin_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Bootcamp Registration"
        verbose_name_plural = "Bootcamp Registrations"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "package"],
                name="unique_user_bootcamp_package_registration",
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} -> {self.package} ({self.status})"


class QuizChoiceKey(models.TextChoices):
    A = "a", "A"
    B = "b", "B"
    C = "c", "C"
    D = "d", "D"


class BootcampQuizQuestion(models.Model):
    """Satu soal bank BCC General Knowledge Test, per batch bootcamp -- sama
    persis buat semua pendaftar Mentee batch itu. Yang diacak per attempt
    cuma URUTAN TAMPIL (lihat BootcampQuizAttempt.question_order), bukan
    subset soalnya -- semua orang tetap dapet soal yang sama."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct, on_delete=models.CASCADE, related_name="quiz_questions",
    )
    question_text = models.TextField()
    choice_a = models.CharField(max_length=255)
    choice_b = models.CharField(max_length=255)
    choice_c = models.CharField(max_length=255)
    choice_d = models.CharField(max_length=255)
    correct_choice = models.CharField(max_length=1, choices=QuizChoiceKey.choices)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Bootcamp Quiz Question"
        verbose_name_plural = "Bootcamp Quiz Questions"
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.question_text[:50]} ({self.bootcamp_id})"


class BootcampQuizAttempt(models.Model):
    """Satu attempt tes BCC per BootcampRegistration -- OneToOneField di sini
    yang jadi jaminan "cuma 1 kali percobaan" di level database, bukan cuma
    dicek di kode (jadi race condition dua klik nyaris bersamaan tetap aman).
    started_at/deadline disimpan di DB (bukan Django cache) supaya jadi
    sumber kebenaran timing yang server-authoritative -- cache LocMemCache
    default (non-produksi) gak shared antar worker Gunicorn, jadi gak aman
    dipakai buat hal krusial kayak ini."""

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "Sedang Dikerjakan"
        SUBMITTED = "submitted", "Selesai Dikumpulkan"
        EXPIRED = "expired", "Waktu Habis (Auto-submit)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    registration = models.OneToOneField(
        BootcampRegistration, on_delete=models.CASCADE, related_name="quiz_attempt",
    )
    # Snapshot urutan tampil soal & pilihan per attempt ini, di-generate SEKALI
    # saat mulai, dipakai lagi persis sama saat resume (biar konsisten &
    # susah di-share antar pendaftar karena nomor soalnya beda-beda per orang):
    # [{"question_id": "<uuid str>", "choice_display_order": ["c","a","d","b"]}, ...]
    question_order = models.JSONField(default=list)
    started_at = models.DateTimeField(auto_now_add=True)
    deadline = models.DateTimeField(
        help_text="started_at + package.quiz_duration_minutes, dihitung sekali "
                   "saat attempt dibuat. Ini yang dipakai server buat cek expired, "
                   "BUKAN countdown di client -- countdown di browser cuma tampilan.",
    )
    submitted_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.IN_PROGRESS,
    )
    score_percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    passed = models.BooleanField(blank=True, null=True)

    class Meta:
        verbose_name = "Bootcamp Quiz Attempt"
        verbose_name_plural = "Bootcamp Quiz Attempts"
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"Quiz attempt {self.registration_id} ({self.status})"


class BootcampQuizAnswer(models.Model):
    """Jawaban per soal, disimpan incremental tiap kali user milih (bukan
    cuma pas submit akhir) -- biar refresh/koneksi putus gak ngilangin
    progress. selected_choice disimpan pakai KEY ASLI soal (a/b/c/d), BUKAN
    posisi tampil yang diacak, jadi scoring tinggal dibandingin langsung ke
    correct_choice tanpa perlu reverse-mapping urutan acak."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(
        BootcampQuizAttempt, on_delete=models.CASCADE, related_name="answers",
    )
    question = models.ForeignKey(
        BootcampQuizQuestion, on_delete=models.CASCADE, related_name="answers",
    )
    selected_choice = models.CharField(max_length=1, choices=QuizChoiceKey.choices)
    # auto_now: ke-update tiap kali user ganti jawaban soal ini -- dipakai
    # admin buat lihat pola waktu pengerjaan (mis. semua soal dijawab dalam
    # hitungan detik = indikasi mencurigakan), informational only, bukan blocker.
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bootcamp Quiz Answer"
        verbose_name_plural = "Bootcamp Quiz Answers"
        ordering = ["answered_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="unique_attempt_question_answer",
            )
        ]

    def __str__(self) -> str:
        return f"{self.attempt_id} -> {self.question_id} = {self.selected_choice}"


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
    # Cuma keisi buat produk BOOTCAMP yang dibeli lewat alur
    # daftar->seleksi/ACC->bayar (BootcampRegistration) -- diisi otomatis di
    # verify_transaction dari Transaction.bootcamp_registration.package.
    # Null buat produk non-bootcamp atau pembelian bootcamp lewat checkout
    # lama yang gak lewat alur paket. Dipakai buat nge-gate benefit per
    # paket (resource/sesi eksklusif) -- lihat BootcampResource &
    # BootcampSession.required_benefit.
    package = models.ForeignKey(
        BootcampPackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
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
