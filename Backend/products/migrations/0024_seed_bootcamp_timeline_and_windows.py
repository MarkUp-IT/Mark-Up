# Seed timeline utama + jendela pendaftaran nyata (sesuai PDF planning) buat
# produk bootcamp yang udah ada -- Mentee 26 Jul-15 Agu 2026, Basic/Premium/
# Elite 21 Agu-6 Sep 2026. Batch bootcamp berikutnya diisi manual oleh admin
# lewat halaman Kelola Pesanan Bootcamp (tanggalnya beda tiap batch).

from datetime import datetime, date

from django.db import migrations
from django.utils import timezone


def seed(apps, schema_editor):
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampPackage = apps.get_model("products", "BootcampPackage")
    BootcampTimelineItem = apps.get_model("products", "BootcampTimelineItem")

    def aware(y, m, d, hh=0, mm=0):
        return timezone.make_aware(datetime(y, m, d, hh, mm))

    mentee_opens = aware(2026, 7, 26)
    mentee_closes = aware(2026, 8, 15, 23, 59)
    others_opens = aware(2026, 8, 21)
    others_closes = aware(2026, 9, 6, 23, 59)

    timeline = [
        ("Pendaftaran Mentee", date(2026, 7, 26), date(2026, 8, 15), 1),
        ("Seleksi & Pengumuman Mentee", date(2026, 8, 15), date(2026, 8, 20), 2),
        ("Pendaftaran Basic / Premium / Elite", date(2026, 8, 21), date(2026, 9, 6), 3),
        ("Pelaksanaan Bootcamp", date(2026, 9, 19), date(2026, 10, 3), 4),
        ("Internal Case Competition", date(2026, 10, 10), date(2026, 10, 21), 5),
        ("Awarding & Networking Session", date(2026, 11, 14), None, 6),
    ]

    for bootcamp in BootcampProduct.objects.all():
        mentee = BootcampPackage.objects.filter(bootcamp=bootcamp, slug="mentee").first()
        if mentee:
            mentee.registration_opens_at = mentee_opens
            mentee.registration_closes_at = mentee_closes
            mentee.save(update_fields=["registration_opens_at", "registration_closes_at"])

        for slug in ("basic", "premium", "elite"):
            pkg = BootcampPackage.objects.filter(bootcamp=bootcamp, slug=slug).first()
            if pkg:
                pkg.registration_opens_at = others_opens
                pkg.registration_closes_at = others_closes
                pkg.save(update_fields=["registration_opens_at", "registration_closes_at"])

        if not BootcampTimelineItem.objects.filter(bootcamp=bootcamp).exists():
            for title, start, end, order in timeline:
                BootcampTimelineItem.objects.create(
                    bootcamp=bootcamp, title=title, start_date=start, end_date=end, order=order,
                )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0023_bootcamptimelineitem"),
    ]

    operations = [
        migrations.RunPython(seed, noop_reverse),
    ]
