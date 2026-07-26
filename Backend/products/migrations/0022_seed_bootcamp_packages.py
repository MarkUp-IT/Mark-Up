# Seed 4 paket standar (Mentee/Basic/Premium/Elite) untuk tiap BootcampProduct
# yang sudah ada. Aman diulang (get_or_create).

from django.db import migrations


DEFAULTS = [
    {
        "slug": "mentee", "name": "Mentee", "price": 210000, "commitment_fee": 150000,
        "requires_selection": True, "order": 1,
        "benefit_record_incubation": True, "benefit_framework_template": True,
        "benefit_winning_deck": True, "benefit_mentoring_case": True,
        "benefit_career_coaching": True, "benefit_team_pairing": True,
        "benefit_networking": True,
    },
    {"slug": "basic", "name": "Basic/Beginner", "price": 100000, "order": 2},
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


def seed_packages(apps, schema_editor):
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampPackage = apps.get_model("products", "BootcampPackage")
    for bootcamp in BootcampProduct.objects.all():
        for cfg in DEFAULTS:
            BootcampPackage.objects.get_or_create(
                bootcamp=bootcamp, slug=cfg["slug"], defaults=cfg,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0021_bootcamppackage_bootcampregistration_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_packages, noop_reverse),
    ]
