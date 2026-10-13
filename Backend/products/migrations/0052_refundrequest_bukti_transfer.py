from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0051_refundrequest_rekening"),
    ]

    operations = [
        migrations.AddField(
            model_name="refundrequest",
            name="transfer_proof",
            field=models.FileField(blank=True, null=True, upload_to="refund_proofs/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="refundrequest",
            name="transferred_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
