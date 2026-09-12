from django import forms
from .models import Competition

class CompetitionForm(forms.ModelForm):

    class Meta:
        model = Competition
        # image_url (legacy link) sengaja gak dimasukin -- poster sekarang
        # diupload sebagai file lewat field `image` (di-assign manual via
        # image_key di views.py), biar gak ke-null-in tiap kali form ini
        # di-submit tanpa nyertain image_url.
        fields = ["category", "title", "organizer", "event_date", "registration_fee", "level", "registration_link","prizepool","deadline", "target_participant"]
    
    def clean(self):
        cleaned_data = super().clean()

        return cleaned_data