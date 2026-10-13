from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0050_refundrequest_refund_amount"),
    ]

    operations = [
        migrations.AddField(
            model_name="refundrequest",
            name="bank_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="refundrequest",
            name="bank_account",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
        migrations.AddField(
            model_name="refundrequest",
            name="bank_account_holder",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
    ]
