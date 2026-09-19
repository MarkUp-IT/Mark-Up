# Keahlian mentor dikunci ke 3 kategori resmi (BPC/BCC/Konsultasi Karir) --
# jenis mentoring yang ditawarkan MarkUp cuma 3, bukan daftar skill bebas.
# Rename "Karir" -> "Konsultasi Karir" (pakai PK yang sama biar FK ke
# MentorExpertise/MentoringProduct.expertise yang udah ada gak putus),
# hapus kategori skill nyasar yang sempat ke-generate lewat CRUD admin.

from django.db import migrations

CANONICAL_NAMES = ["BPC", "BCC", "Konsultasi Karir"]


def lock_to_3_categories(apps, schema_editor):
    Expertise = apps.get_model("mentors", "Expertise")

    karir = Expertise.objects.filter(name="Karir").first()
    if karir:
        karir.name = "Konsultasi Karir"
        karir.save(update_fields=["name"])

    for name in CANONICAL_NAMES:
        Expertise.objects.get_or_create(name=name)

    Expertise.objects.exclude(name__in=CANONICAL_NAMES).delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("mentors", "0009_unique_availability_constraint"),
    ]

    operations = [
        migrations.RunPython(lock_to_3_categories, noop_reverse),
    ]
