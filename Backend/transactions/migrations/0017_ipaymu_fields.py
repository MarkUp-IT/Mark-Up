from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0016_remove_dead_bootcamp_checkout_docs"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="gateway",
            field=models.CharField(
                choices=[("MANUAL", "Manual (Transfer Bank)"), ("IPAYMU", "iPaymu")],
                default="MANUAL",
                help_text="Jalur yang membuat transaksi ini -- manual (upload bukti + ACC admin) atau otomatis lewat iPaymu.",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="ipaymu_session_id",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Data.SessionID dari iPaymu, buat penelusuran/dukungan. Pencocokan transaksi dari webhook TETAP pakai Transaction.id sendiri sebagai referenceId, bukan field ini.",
                max_length=64,
            ),
        ),
        migrations.AddField(
            model_name="transaction",
            name="ipaymu_last_webhook",
            field=models.JSONField(
                blank=True,
                help_text="Payload webhook terakhir dari iPaymu apa adanya -- buat audit kalau ada sengketa pembayaran.",
                null=True,
            ),
        ),
        migrations.CreateModel(
            name="IpaymuSetting",
            fields=[
                (
                    "id",
                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "va_number",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Nomor VA/akun iPaymu -- BUKAN rahasia, dipakai juga sebagai secret verifikasi signature webhook masuk.",
                        max_length=32,
                    ),
                ),
                (
                    "api_key_encrypted",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="API Key iPaymu, terenkripsi Fernet pakai IPAYMU_CRED_KEY. JANGAN pernah dikirim balik ke frontend -- lihat _serialize_ipaymu_setting.",
                    ),
                ),
                (
                    "is_sandbox",
                    models.BooleanField(
                        default=True,
                        help_text="True = sandbox.ipaymu.com (uji, uang gak sungguhan). False = my.ipaymu.com (PRODUCTION, uang sungguhan).",
                    ),
                ),
                (
                    "is_enabled",
                    models.BooleanField(
                        default=False,
                        help_text="Saklar utama -- mati = pembeli cuma lihat transfer manual, walau kredensial di atas sudah diisi.",
                    ),
                ),
                (
                    "default_expired_hours",
                    models.PositiveIntegerField(
                        default=2,
                        help_text="Umur sesi pembayaran yang dikirim ke iPaymu (jam) -- ini juga jadi jendela reservasi stok/slot yang sesungguhnya buat transaksi lewat iPaymu.",
                    ),
                ),
                ("last_check_at", models.DateTimeField(blank=True, null=True)),
                ("last_check_ok", models.BooleanField(blank=True, null=True)),
                ("last_check_note", models.CharField(blank=True, default="", max_length=500)),
                (
                    "last_check_url",
                    models.URLField(
                        blank=True,
                        default="",
                        help_text="URL sesi uji terakhir dari tombol Uji Koneksi -- buat admin cek responsnya tanpa pernah diarahkan ke sana.",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "iPaymu Setting",
                "verbose_name_plural": "iPaymu Settings",
            },
        ),
    ]
