from django import forms
from .models import Competition

class CompetitionForm(forms.ModelForm):

    class Meta:
        model = Competition
        fields = ["category", "title", "image_url", "organizer", "event_date", "registration_fee", "level", "registration_link","prizepool","deadline", "target_participant"]
    
    def clean(self):
        cleaned_data = super().clean()

        return cleaned_data