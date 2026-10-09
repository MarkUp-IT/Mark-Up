# Mentor sesi mentoring boleh kosong -- pembeli milih mentor + jadwal
# sendiri dari dashboard (mis. pembayaran iPaymu yang dipulihkan setelah
# kedaluwarsa, saat slot & mentor pilihannya sudah dilepas).

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mentors', '0011_mentorprofile_mentoring_fee_percent_override'),
        ('products', '0048_bootcampproduct_community_message'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mentoringsession',
            name='mentor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='product_mentoring_sessions',
                to='mentors.mentorprofile',
            ),
        ),
    ]
