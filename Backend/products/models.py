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
    commitment_letter_max_words = models.PositiveIntegerField(
        default=500,
        help_text="Batas maksimal kata buat commitment/motivation letter pendaftar, "
                   "ditampilkan sebagai informasi di halaman pendaftaran publik.",
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
    # Dulu dibatasi choices=PackageSlug.choices, jadi satu bootcamp mentok 4
    # paket dan admin gak bisa bikin jenis paket baru sama sekali. Sekarang
    # bebas (di-generate otomatis dari nama), PackageSlug cuma dipakai buat
    # nyeed 4 paket default. Aman diubah karena slug murni buat tampilan --
    # gak ada logic yang ngecek nilainya (dicek langsung ke seluruh kode).
    slug = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commitment_fee = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Biaya komitmen yang dikembalikan di akhir program. Hanya "
                   "paket Mentee yang punya (150k). Total bayar = price + commitment_fee.",
    )
    requires_selection = models.BooleanField(
        default=False,
        help_text="Kalau True: pendaftar wajib lolos seleksi (tes BCC) dulu sebelum "
                   "boleh bayar. Kalau False: cukup di-ACC admin. Dinamis per paket, "
                   "gak terikat ke paket 'Mentee' secara khusus -- admin bisa "
                   "nyalain/matiin dari panel Kelola Pesanan Bootcamp.",
    )
    selection_quota = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Target jumlah pendaftar yang mau diterima lewat seleksi paket ini. "
                   "Kosong = gak ada batas. Ini CUMA indikator progres di panel admin "
                   "('12/30 diterima') -- gak pernah ngunci tombol Terima, sama kayak "
                   "pola 'eligible' di fitur lain (skor tes, refund commitment fee): "
                   "keputusan Terima/Tolak tetap manual sepenuhnya di tangan admin.",
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
    payment_deadline_at = models.DateTimeField(
        blank=True, null=True,
        help_text="Batas waktu bayar buat pendaftar yang sudah Diterima (mis. jendela "
                   "bayar Mentee di timeline). Kosong = gak ada batas waktu otomatis -- "
                   "admin urus manual. Kalau lewat, tombol bayar terkunci sampai admin "
                   "ubah keputusan/tenggat.",
    )
    min_attendance_sessions = models.PositiveIntegerField(
        default=0,
        help_text="Minimal jumlah sesi bootcamp berstatus selesai (per peserta) buat "
                   "berhak dapat pengembalian commitment fee. 0 = gak ada syarat "
                   "kehadiran. Cuma relevan buat paket yang punya commitment_fee > 0.",
    )

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

    # Catatan buat yang baca nanti: 9 field di atas SENGAJA tetap kolom tetap,
    # bukan tabel bebas. Tujuh di antaranya beneran ngunci fitur, bukan cuma
    # tulisan di kartu paket:
    #   record_incubation / framework_template / winning_deck -> hak unduh file
    #     (dicocokin ke BootcampResourceType lewat getattr "benefit_<type>")
    #   mentoring_case / career_coaching / networking -> sesi mana yang kelihatan
    #     (BootcampSessionRequiredBenefit)
    #   team_pairing -> boleh dimasukin tim atau nggak
    # Kalau ini diganti jadi teks bebas, penguncian itu jebol tanpa error --
    # makanya benefit tambahan yang bebas ditaruh di model terpisah di bawah.

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


class BootcampPackageExtraBenefit(models.Model):
    """Benefit tambahan bebas per paket, di luar 9 benefit bawaan.

    Dibikin terpisah karena 9 benefit bawaan itu nyangkut ke penguncian fitur
    (hak unduh file, visibilitas sesi, team pairing) -- gak bisa dijadiin teks
    bebas tanpa ngerusak itu. Yang di sini murni buat ditampilin di kartu paket
    (mis. "Akses Grup Alumni", "Sesi Bonus Review CV"), jadi admin bisa nambah
    sebanyak apa pun tanpa perlu migrasi database.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    package = models.ForeignKey(
        BootcampPackage, on_delete=models.CASCADE, related_name="extra_benefits",
    )
    label = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Bootcamp Package Extra Benefit"
        verbose_name_plural = "Bootcamp Package Extra Benefits"
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.label} ({self.package_id})"


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


class BootcampRequirementCategory(models.TextChoices):
    GENERAL = "general", "Syarat Umum"
    COMMITMENT_LETTER = "commitment_letter", "Struktur Commitment Letter"


class BootcampRequirement(models.Model):
    """Satu item checklist (ditampilkan sebagai daftar bernomor di halaman
    pendaftaran bootcamp publik) -- diatur admin per batch, gantiin daftar
    yang dulu hardcoded di frontend. Dipakai buat 2 hal beda (dibedain lewat
    `category`): syarat umum (peserta gabungin buktinya jadi 1 PDF di
    requirement_doc) dan poin struktur commitment letter (file terpisah di
    commitment_letter) -- keduanya di BootcampRegistration. Daftar ini cuma
    checklist informasional, gak ada validasi per-item di backend."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct,
        on_delete=models.CASCADE,
        related_name="requirements",
    )
    category = models.CharField(
        max_length=20, choices=BootcampRequirementCategory.choices,
        default=BootcampRequirementCategory.GENERAL,
    )
    text = models.CharField(max_length=500)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Bootcamp Requirement"
        verbose_name_plural = "Bootcamp Requirements"
        ordering = ["category", "order"]

    def __str__(self) -> str:
        return f"{self.text[:50]} ({self.bootcamp_id})"


DEFAULT_BOOTCAMP_REQUIREMENTS = [
    "Bukti upload Instastory poster",
    "Bukti follow IG MarkUp & tag 5 teman di komentar feeds oprec, serta follow LinkedIn & TikTok MarkUp",
    "Bukti upload twibbon",
    "Bukti share poster ke 3 grup WhatsApp",
    "Bukti kartu tanda pelajar/mahasiswa (student ID card)",
]


DEFAULT_COMMITMENT_LETTER_POINTS = [
    "Personal Introduction & Background",
    "Motivation for Joining the Bootcamp",
    "Relevant Experiences & Achievements",
    "Goals, Expectations & Skills to Develop",
    "Contribution & Future Aspirations",
]


def create_default_bootcamp_requirements(bootcamp):
    """Isi syarat pendaftaran & struktur commitment letter standar buat
    BootcampProduct baru kalau belum ada -- admin bisa ubah/tambah/hapus
    lagi lewat panel Kelola Pesanan Bootcamp, ini cuma starting point biar
    gak kosong."""
    if not BootcampRequirement.objects.filter(
        bootcamp=bootcamp, category=BootcampRequirementCategory.GENERAL
    ).exists():
        for order, text in enumerate(DEFAULT_BOOTCAMP_REQUIREMENTS, start=1):
            BootcampRequirement.objects.create(
                bootcamp=bootcamp, category=BootcampRequirementCategory.GENERAL, text=text, order=order,
            )

    if not BootcampRequirement.objects.filter(
        bootcamp=bootcamp, category=BootcampRequirementCategory.COMMITMENT_LETTER
    ).exists():
        for order, text in enumerate(DEFAULT_COMMITMENT_LETTER_POINTS, start=1):
            BootcampRequirement.objects.create(
                bootcamp=bootcamp, category=BootcampRequirementCategory.COMMITMENT_LETTER, text=text, order=order,
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
        help_text="Satu PDF gabungan berisi bukti syarat pendaftaran (jumlah & isi diatur admin).",
    )
    commitment_letter = models.FileField(
        upload_to="bootcamp_commitment_letters/%Y/%m/",
        blank=True, null=True,
        help_text="Commitment/motivation letter terpisah dari PDF syarat -- strukturnya diatur "
                   "admin. Nullable karena ini requirement baru, pendaftaran lama (kalau ada) "
                   "gak punya file ini; wajib diisi buat pendaftaran BARU (dicek di view, bukan di sini).",
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


class BootcampQuiz(models.Model):
    """Satu tes dalam sebuah batch bootcamp.

    Dulu tiap bootcamp cuma bisa punya SATU tes (soal langsung nempel ke
    BootcampProduct, dan attempt-nya OneToOne ke pendaftaran). Sekarang admin
    bisa bikin beberapa tes -- mis. "Tes Seleksi Awal", "Tes Tengah Program",
    "Tes Akhir" -- dan tiap tes boleh ditautkan ke satu milestone timeline
    biar peserta ngerti tes ini bagian tahap yang mana.

    Durasi & skor kelulusan pindah ke sini (dulu per paket), karena sekarang
    tiap tes bisa beda aturannya. Nilai di BootcampPackage tetap dipakai
    sebagai default waktu bikin tes baru.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct, on_delete=models.CASCADE, related_name="quizzes",
    )
    title = models.CharField(max_length=150, default="Tes Seleksi BCC")
    timeline_item = models.ForeignKey(
        "BootcampTimelineItem",
        on_delete=models.SET_NULL, blank=True, null=True, related_name="quizzes",
        help_text="Opsional -- tes ini bagian dari milestone timeline yang mana. "
                   "SET_NULL biar hapus milestone gak ikut ngapus tes & jawabannya.",
    )
    duration_minutes = models.PositiveIntegerField(
        default=30, validators=[MinValueValidator(5), MaxValueValidator(180)],
    )
    passing_score_percent = models.PositiveIntegerField(
        default=70, validators=[MaxValueValidator(100)],
        help_text="Ambang lulus (%) buat auto-flag. Keputusan akhir Terima/Tolak "
                   "tetap manual di tangan admin.",
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(
        default=True,
        help_text="Kalau dimatiin, tes gak muncul ke peserta. Attempt yang sudah "
                   "terlanjur dikerjakan tetap tersimpan.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bootcamp Quiz"
        verbose_name_plural = "Bootcamp Quizzes"
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.bootcamp_id})"


class BootcampQuizQuestion(models.Model):
    """Satu soal dalam sebuah tes -- sama persis buat semua pendaftar. Yang
    diacak per attempt cuma URUTAN TAMPIL (lihat BootcampQuizAttempt.
    question_order), bukan subset soalnya -- semua orang tetap dapet soal
    yang sama."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(
        BootcampQuiz, on_delete=models.CASCADE, related_name="questions",
        null=True, blank=True,
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
        return f"{self.question_text[:50]} ({self.quiz_id})"


class BootcampQuizAttempt(models.Model):
    """Satu attempt per (pendaftaran, tes).

    Dulu ini OneToOneField ke registration -- artinya satu pendaftaran cuma
    boleh punya SATU attempt selamanya, jadi mustahil ada lebih dari satu tes.
    Sekarang jadi ForeignKey + UniqueConstraint (registration, quiz): jaminan
    "cuma 1 kali percobaan" TETAP ditegakkan database, tapi per tes, bukan per
    pendaftaran. Jadi race condition dua klik nyaris bersamaan tetap aman.
    started_at/deadline disimpan di DB (bukan Django cache) supaya jadi
    sumber kebenaran timing yang server-authoritative -- cache LocMemCache
    default (non-produksi) gak shared antar worker Gunicorn, jadi gak aman
    dipakai buat hal krusial kayak ini."""

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "Sedang Dikerjakan"
        SUBMITTED = "submitted", "Selesai Dikumpulkan"
        EXPIRED = "expired", "Waktu Habis (Auto-submit)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    registration = models.ForeignKey(
        BootcampRegistration, on_delete=models.CASCADE, related_name="quiz_attempts",
    )
    quiz = models.ForeignKey(
        BootcampQuiz, on_delete=models.CASCADE, related_name="attempts",
        null=True, blank=True,
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
        constraints = [
            # Pengganti jaminan OneToOne yang lama: tetap dijaga database,
            # tapi sekarang per tes.
            models.UniqueConstraint(
                fields=["registration", "quiz"],
                name="unique_attempt_per_registration_quiz",
            )
        ]

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


class BootcampTeam(models.Model):
    """Tim buat benefit Team Pairing -- dibuat & diisi manual oleh admin
    (atau lewat tombol acak), per batch bootcamp."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bootcamp = models.ForeignKey(
        BootcampProduct, on_delete=models.CASCADE, related_name="teams",
    )
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bootcamp Team"
        verbose_name_plural = "Bootcamp Teams"
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.bootcamp_id})"


class BootcampTeamMember(models.Model):
    """Satu peserta di dalam satu tim -- OneToOneField ke UserLibrary
    (bukan ke User langsung) supaya otomatis kegate: cuma peserta yang udah
    beneran beli/lunas bootcamp ini yang bisa dimasukkin tim, dan satu
    peserta cuma bisa ada di SATU tim per bootcamp (constraint di level DB,
    bukan cuma dicek di kode)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(
        BootcampTeam, on_delete=models.CASCADE, related_name="members",
    )
    user_library = models.OneToOneField(
        "UserLibrary", on_delete=models.CASCADE, related_name="team_membership",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bootcamp Team Member"
        verbose_name_plural = "Bootcamp Team Members"
        ordering = ["joined_at"]

    def __str__(self) -> str:
        return f"{self.user_library} -> {self.team}"


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
