from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0043_bootcamp_registration_questions_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="bootcampregistrationquestion",
            name="for_all_packages",
            field=models.BooleanField(
                default=True,
                help_text="True = ditanyakan ke semua pendaftar bootcamp ini. False = cuma paket yang terdaftar di `packages`.",
            ),
        ),
        migrations.AddField(
            model_name="bootcampregistrationquestion",
            name="packages",
            field=models.ManyToManyField(
                blank=True,
                help_text="Dipakai cuma kalau for_all_packages=False.",
                related_name="registration_questions",
                to="products.bootcamppackage",
            ),
        ),
    ]
