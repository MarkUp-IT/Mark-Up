from __future__ import annotations
from datetime import datetime

from django import forms
from django.utils import timezone
from .models import MentorAvailability, MentorProfile, MentorExperience


class MentorProfileForm(forms.ModelForm):
    class Meta:
        model = MentorProfile
        fields = [
            "headline",
            "bio",
            "bank_name",
            "bank_account",
            "bank_account_holder",
            "linkedin_url",
            "instagram_url",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # bank_name/bank_account/linkedin_url di model wajib (gak ada blank=True),
        # tapi UI Settings nyimpen per-section (Info Pribadi vs Rekening Bank
        # kirim field yang beda-beda). Kalau field-nya tetep wajib di form,
        # mentor BARU gak akan pernah bisa nyimpen section manapun -- section
        # yang lagi disimpen bakal ketolak gara-gara field section LAIN masih
        # kosong. Jadi semua field di-longgarin jadi opsional di sini;
        # kelengkapan profil beneran tetep dijaga terpisah lewat
        # MentorProfile.is_profile_complete() + gate useAuthGuard di FE.
        for field in self.fields.values():
            field.required = False


class MentorExperienceForm(forms.ModelForm):
    class Meta:
        model = MentorExperience
        fields = ["title", "description", "start_date", "end_date"]
        widgets = {
            "start_date": forms.DateInput(attrs={"type": "date"}),
            "end_date": forms.DateInput(attrs={"type": "date"}),
        }


class MentorAvailabilityForm(forms.ModelForm):
    start_date = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={"type": "date"}),
        label="Tanggal Mulai",
    )
    end_date = forms.DateField(
        required=True,
        widget=forms.DateInput(attrs={"type": "date"}),
        label="Tanggal Selesai",
    )
    start_time = forms.TimeField(
        required=True,
        widget=forms.TimeInput(attrs={"type": "time"}),
        label="Jam Mulai",
    )
    end_time = forms.TimeField(
        required=True,
        widget=forms.TimeInput(attrs={"type": "time"}),
        label="Jam Selesai",
    )

    class Meta:
        model = MentorAvailability
        fields = []

    def __init__(self, *args, **kwargs):
        instance = kwargs.get("instance")
        if instance and isinstance(instance, MentorAvailability):
            initial = kwargs.setdefault("initial", {})
            initial.setdefault("start_date", instance.start_time.date())
            initial.setdefault("start_time", instance.start_time.time())
            initial.setdefault("end_date", instance.end_time.date())
            initial.setdefault("end_time", instance.end_time.time())
        super().__init__(*args, **kwargs)

    def _post_clean(self):
        # Sengaja di-skip: base ModelForm._post_clean() manggil
        # instance.full_clean(), dan karena field form "start_time"/"end_time"
        # (jam doang) namanya sama persis kayak field model "start_time"/
        # "end_time" (DateTimeField), Django nganggep itu field model yang
        # belum keisi -> selalu keluar error "cannot be null" padahal
        # nilainya baru digabung jadi datetime lengkap di save() di bawah.
        pass

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")
        start_time = cleaned_data.get("start_time")
        end_time = cleaned_data.get("end_time")

        if not all([start_date, end_date, start_time, end_time]):
            return cleaned_data

        start_datetime = timezone.make_aware(datetime.combine(start_date, start_time))
        end_datetime = timezone.make_aware(datetime.combine(end_date, end_time))

        if end_datetime <= start_datetime:
            raise forms.ValidationError(
                "Waktu selesai harus lebih besar dari waktu mulai."
            )

        cleaned_data["start_datetime"] = start_datetime
        cleaned_data["end_datetime"] = end_datetime
        return cleaned_data

    def save(self, commit=True):
        availability = super().save(commit=False)
        cleaned_data = self.cleaned_data
        availability.start_time = cleaned_data["start_datetime"]
        availability.end_time = cleaned_data["end_datetime"]
        if commit:
            availability.save()
        return availability
