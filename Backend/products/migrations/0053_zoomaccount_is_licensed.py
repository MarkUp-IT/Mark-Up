from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0052_refundrequest_bukti_transfer"),
    ]

    operations = [
        migrations.AddField(
            model_name="zoomaccount",
            name="is_licensed",
            field=models.BooleanField(blank=True, null=True),
        ),
    ]
