from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0017_ipaymu_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
