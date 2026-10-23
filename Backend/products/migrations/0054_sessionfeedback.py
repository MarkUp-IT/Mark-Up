import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0053_zoomaccount_is_licensed"),
    ]

    operations = [
        migrations.CreateModel(
            name="SessionFeedback",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("rating", models.PositiveSmallIntegerField(validators=[
                    django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("comment", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("session", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE,
                                                 related_name="feedback", to="products.mentoringsession")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
