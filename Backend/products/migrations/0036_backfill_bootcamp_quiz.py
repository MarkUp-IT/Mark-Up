from django.db import migrations


def backfill_quizzes(apps, schema_editor):
    """Pindahkan tes lama (yang nempel langsung ke bootcamp) ke model
    BootcampQuiz yang baru.

    Sebelum ini tiap bootcamp cuma bisa punya satu tes, jadi buat tiap
    bootcamp yang punya soal ATAU attempt, kita bikin satu tes bernama
    "Tes Seleksi BCC" lalu arahin semua soal & attempt lamanya ke situ.
    Durasi/skor lulus diambil dari paket yang requires_selection (tempat
    setelan itu dulu disimpan) supaya aturan yang berlaku gak berubah.
    """
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampQuiz = apps.get_model("products", "BootcampQuiz")
    BootcampQuizQuestion = apps.get_model("products", "BootcampQuizQuestion")
    BootcampQuizAttempt = apps.get_model("products", "BootcampQuizAttempt")
    BootcampPackage = apps.get_model("products", "BootcampPackage")

    for bootcamp in BootcampProduct.objects.all():
        questions = BootcampQuizQuestion.objects.filter(bootcamp_id=bootcamp.pk)
        attempts = BootcampQuizAttempt.objects.filter(
            registration__package__bootcamp_id=bootcamp.pk, quiz__isnull=True
        )
        if not questions.exists() and not attempts.exists():
            continue

        # Setelan lama ada di paket yang butuh seleksi; kalau gak ketemu,
        # pakai default model (30 menit / 70%).
        pkg = (
            BootcampPackage.objects.filter(bootcamp_id=bootcamp.pk, requires_selection=True)
            .order_by("order")
            .first()
        )
        quiz = BootcampQuiz.objects.create(
            bootcamp_id=bootcamp.pk,
            title="Tes Seleksi BCC",
            duration_minutes=getattr(pkg, "quiz_duration_minutes", 30) or 30,
            passing_score_percent=getattr(pkg, "quiz_passing_score_percent", 70) or 70,
            order=1,
            is_active=True,
        )
        questions.update(quiz_id=quiz.pk)
        attempts.update(quiz_id=quiz.pk)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0035_alter_bootcampquizattempt_registration_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_quizzes, noop_reverse),
    ]
