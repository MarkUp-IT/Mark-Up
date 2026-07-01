from __future__ import annotations
from datetime import datetime

from django import forms
from .models import MentorAvailability


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

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")
        start_time = cleaned_data.get("start_time")
        end_time = cleaned_data.get("end_time")

        if not all([start_date, end_date, start_time, end_time]):
            return cleaned_data

        start_datetime = datetime.combine(start_date, start_time)
        end_datetime = datetime.combine(end_date, end_time)

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
