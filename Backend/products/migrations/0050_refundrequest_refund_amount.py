# Nominal refund final yang dicatat saat admin menyetujui pengajuan refund
# (persentase potongan sekarang bisa diatur per pengajuan).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0049_mentoringsession_mentor_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='refundrequest',
            name='refund_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
    ]
