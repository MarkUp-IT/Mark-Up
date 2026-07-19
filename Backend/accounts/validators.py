import re
from django.core.exceptions import ValidationError


class SimplePasswordValidator:
    """Kebijakan password yang disederhanakan: minimal 8 karakter, ada 1
    huruf kapital, dan ada 1 simbol. Menggantikan validator bawaan Django
    (similarity/common-password/numeric) yang dianggap terlalu ribet."""

    SYMBOL_PATTERN = re.compile(r"[^A-Za-z0-9]")
    UPPER_PATTERN = re.compile(r"[A-Z]")

    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError(
                "Password harus minimal 8 karakter.",
                code="password_too_short",
            )
        if not self.UPPER_PATTERN.search(password):
            raise ValidationError(
                "Password harus mengandung minimal 1 huruf kapital.",
                code="password_no_upper",
            )
        if not self.SYMBOL_PATTERN.search(password):
            raise ValidationError(
                "Password harus mengandung minimal 1 simbol (contoh: !@#$%).",
                code="password_no_symbol",
            )

    def get_help_text(self):
        return "Password minimal 8 karakter, mengandung 1 huruf kapital, dan 1 simbol."
