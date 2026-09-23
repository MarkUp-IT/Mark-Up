from django.db import migrations


def seed_bank_account(apps, schema_editor):
    """Isi rekening awal dengan nilai yang selama ini di-hardcode di
    Frontend/src/lib/bankInfo.js. Tanpa ini, sehabis deploy halaman
    pembayaran bakal nampilin rekening kosong -- regresi yang langsung
    kelihatan user."""
    BankAccountSetting = apps.get_model("transactions", "BankAccountSetting")
    BankAccountSetting.objects.update_or_create(
        pk=1,
        defaults={
            "bank_name": "Mandiri",
            "account_number": "4616 9948 8411 4788",
            "account_holder": "Ahmad Reva Dany Fawwaz",
        },
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("transactions", "0014_bankaccountsetting"),
    ]

    operations = [
        migrations.RunPython(seed_bank_account, noop_reverse),
    ]
