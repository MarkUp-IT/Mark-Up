from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0023_transaction_refund_deadline"),
    ]

    operations = [
        # Default True: penolakan lama dianggap sudah dilihat, supaya badge
        # yang selama ini nyangkut langsung hilang.
        migrations.AddField(
            model_name="transaction",
            name="buyer_seen",
            field=models.BooleanField(default=True),
        ),
    ]
