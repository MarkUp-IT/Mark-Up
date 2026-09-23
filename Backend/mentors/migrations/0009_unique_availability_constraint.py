from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mentors', '0008_dedupe_and_unique_availability'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='mentoravailability',
            constraint=models.UniqueConstraint(fields=('mentor_profile', 'start_time'), name='unique_mentor_availability_slot'),
        ),
    ]
