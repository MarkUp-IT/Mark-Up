from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0019_alter_ipaymusetting_default_expired_hours"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ipaymusetting",
            name="default_expired_hours",
            field=models.PositiveIntegerField(
                default=2,
                help_text="Umur sesi HALAMAN BAYAR iPaymu (jam) -- cuma buffer, biar halamannya "
                          "gak keburu mati pas pembeli masih di sana. BUKAN penentu reservasi slot/stok "
                          "-- itu tetap 5 menit (RESERVATION_MINUTES di transactions/views.py), "
                          "gak ikut berubah walau angka ini diubah.",
            ),
        ),
    ]
