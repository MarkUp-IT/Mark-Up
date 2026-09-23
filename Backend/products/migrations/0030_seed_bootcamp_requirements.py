# Seed syarat pendaftaran (5 item) buat produk bootcamp yang udah ada --
# sebelumnya daftar ini hardcoded di frontend, sekarang jadi data yang bisa
# diatur admin lewat panel Kelola Pesanan Bootcamp. Batch baru nanti
# otomatis dapet 5 item default ini juga (lihat create_default_bootcamp_requirements),
# tinggal diedit admin kalau mau beda.

from django.db import migrations

DEFAULT_REQUIREMENTS = [
    "Bukti upload Instastory poster",
    "Bukti follow IG MarkUp & tag 5 teman di komentar feeds oprec, serta follow LinkedIn & TikTok MarkUp",
    "Bukti upload twibbon",
    "Bukti share poster ke 3 grup WhatsApp",
    "Bukti kartu tanda pelajar/mahasiswa (student ID card)",
]


def seed(apps, schema_editor):
    BootcampProduct = apps.get_model("products", "BootcampProduct")
    BootcampRequirement = apps.get_model("products", "BootcampRequirement")

    for bootcamp in BootcampProduct.objects.all():
        if BootcampRequirement.objects.filter(bootcamp=bootcamp).exists():
            continue
        for order, text in enumerate(DEFAULT_REQUIREMENTS, start=1):
            BootcampRequirement.objects.create(bootcamp=bootcamp, text=text, order=order)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0029_bootcamprequirement"),
    ]

    operations = [
        migrations.RunPython(seed, noop_reverse),
    ]
