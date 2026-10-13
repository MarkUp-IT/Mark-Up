from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("mentors", "0011_mentorprofile_mentoring_fee_percent_override"),
    ]

    operations = [
        migrations.AddField(
            model_name="mentorprofile",
            name="is_mentor_active",
            field=models.BooleanField(default=True),
        ),
    ]
