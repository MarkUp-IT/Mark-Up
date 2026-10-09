from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0022_transaction_team_discount_amount"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="refund_deadline",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
