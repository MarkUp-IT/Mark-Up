from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0012_alter_broadcastemail_filter_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="PesanTerkirim",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("jenis", models.CharField(max_length=60)),
                ("objek_id", models.CharField(max_length=64)),
                ("penerima", models.CharField(blank=True, default="", max_length=254)),
                ("dikirim_pada", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "indexes": [models.Index(fields=["objek_id"], name="pesan_terkirim_objek_idx")],
                "constraints": [
                    models.UniqueConstraint(fields=("jenis", "objek_id", "penerima"), name="pesan_terkirim_unik"),
                ],
            },
        ),
    ]
