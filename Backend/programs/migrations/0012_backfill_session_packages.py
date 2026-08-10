from django.db import migrations


def backfill(apps, schema_editor):
    """Pindahkan pembatasan dari `required_benefit` ke daftar paket eksplisit.

    Aturan lama: sesi dengan required_benefit=X cuma dikloning ke pembeli yang
    paketnya punya benefit_X=True. Di sini dijabarkan jadi daftar paket yang
    memenuhi syarat itu, supaya SIAPA DAPAT APA tidak berubah -- cuma cara
    menyimpannya yang pindah.

    Sesi tanpa required_benefit dibiarkan for_all_packages=True (default),
    sama seperti perilaku sebelumnya.
    """
    BootcampSession = apps.get_model("programs", "BootcampSession")
    BootcampPackage = apps.get_model("products", "BootcampPackage")

    for sesi in BootcampSession.objects.exclude(required_benefit=""):
        kolom = f"benefit_{sesi.required_benefit}"
        cocok = [
            p.pk for p in BootcampPackage.objects.filter(bootcamp_id=sesi.bootcamp_id)
            if getattr(p, kolom, False)
        ]
        # Dibatasi, apa pun hasilnya. Kalau tidak ada paket yang cocok, daftarnya
        # kosong -- artinya tetap tidak ada yang dapat, persis aturan lama.
        # Inilah kenapa penandanya eksplisit, bukan "kosong = semua".
        sesi.for_all_packages = False
        sesi.save(update_fields=["for_all_packages"])
        sesi.packages.set(cocok)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("programs", "0011_bootcampsession_for_all_packages_and_more"),
        ("products", "0041_bootcampresource_for_all_packages_and_more"),
    ]

    operations = [migrations.RunPython(backfill, noop)]
