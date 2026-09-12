from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0018_transaction_expires_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ipaymusetting",
            name="default_expired_hours",
            field=models.PositiveIntegerField(
                default=2,
                help_text="Umur sesi HALAMAN BAYAR iPaymu (jam) -- cuma buffer, biar halamannya "
                          "gak keburu mati pas pembeli masih di sana. BUKAN penentu reservasi slot/stok "
                          "-- itu tetap 15 menit tetap (RESERVATION_MINUTES di transactions/views.py), "
                          "gak ikut berubah walau angka ini diubah.",
            ),
        ),
    ]
