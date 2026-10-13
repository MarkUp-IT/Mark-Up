# Seed struktur commitment/motivation letter (5 poin) buat produk bootcamp
# yang udah ada -- fitur upload commitment letter baru ditambahin belakangan,
# jadi batch yang udah eksis belum punya poin struktur ini sama sekali.
# Batch baru otomatis dapet ini juga lewat create_default_bootcamp_requirements.

from django.db import migrations

DEFAULT_POINTS = [
    "Personal Introduction & Background",
    "Motivation for Joining the Bootcamp",
    "Relevant Experiences & Achievements",
    "Goals, Expectations & Skills to Develop",
    "Contribution & Future Aspirations",
]


def seed(apps, schema_editor):
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampRequirement = apps.get_model("products", "BootcampRequirement")

    for bootcamp in BootcampProduct.objects.all():
        if BootcampRequirement.objects.filter(bootcamp=bootcamp, category="commitment_letter").exists():
            continue
        for order, text in enumerate(DEFAULT_POINTS, start=1):
            BootcampRequirement.objects.create(
                bootcamp=bootcamp, category="commitment_letter", text=text, order=order,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0031_alter_bootcamprequirement_options_and_more"),
    ]

    operations = [
        migrations.RunPython(seed, noop_reverse),
    ]
