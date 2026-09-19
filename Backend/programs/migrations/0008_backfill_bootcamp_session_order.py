# Backfill BootcampSession.order buat data lama (dari sebelum field ini ada)
# berdasarkan urutan start_time yang udah ada, per batch bootcamp -- biar
# jadwal yang udah bener urutannya gak keacak gara-gara semua defaultnya 1.

from django.db import migrations


def backfill_order(apps, schema_editor):
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampSession = apps.get_model("programs", "BootcampSession")

    for bootcamp in BootcampProduct.objects.all():
        sessions = list(
            BootcampSession.objects.filter(bootcamp=bootcamp).order_by(
                "start_time", "id"
            )
        )
        for index, session in enumerate(sessions, start=1):
            if session.order != index:
                session.order = index
                session.save(update_fields=["order"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("programs", "0007_alter_bootcampsession_options_bootcampsession_order"),
    ]

    operations = [
        migrations.RunPython(backfill_order, noop_reverse),
    ]
