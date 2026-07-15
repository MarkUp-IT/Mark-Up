from django import forms
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterForm(forms.ModelForm):

    password = forms.CharField(
        widget=forms.PasswordInput,
        validators=[validate_password]
    )

    confirm_password = forms.CharField(
        widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = ["fullname", "email"]

    def clean_email(self):
        email = self.cleaned_data.get("email")

        if User.objects.filter(email=email).exists():
            raise forms.ValidationError(
                "Email sudah digunakan."
            )

        return email

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password:
            if password != confirm_password:
                raise forms.ValidationError(
                    "Password dan konfirmasi password tidak sama."
                )

        return cleaned_data
    

class UpdateProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ["fullname", "phone", "institution", "current_status", "linkedin_url"]

    def clean_fullname(self):
        fullname = self.cleaned_data.get("fullname", "").strip()
        if not fullname:
            raise forms.ValidationError("Nama lengkap tidak boleh kosong.")
        return fullname

    def clean_phone(self):
        phone = self.cleaned_data.get("phone", "").strip()
        if phone and not all(c.isdigit() or c in "+- " for c in phone):
            raise forms.ValidationError("Format nomor WhatsApp tidak valid.")
        return phone

    def clean_linkedin_url(self):
        value = self.cleaned_data.get("linkedin_url", "").strip()
        if not value:
            return value
        if not value.startswith(("http://", "https://")):
            value = f"https://{value}"
        validator = forms.URLField()
        try:
            validator.clean(value)
        except forms.ValidationError:
            raise forms.ValidationError("URL LinkedIn tidak valid.")
        if "linkedin.com" not in value:
            raise forms.ValidationError("URL harus berupa link LinkedIn.")
        return value