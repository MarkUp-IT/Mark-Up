from django import forms
from django.forms import ModelForm
from .models import MentoringProduct, ModuleProduct, BootcampProduct


class MentoringProductForm(ModelForm):
    class Meta:
        model = MentoringProduct
        fields = ["title", "description", "explanation", "published_at",
                  "image_url", "original_price", "discount_percent", "registration_link",
                  "is_active", "session_count", "duration_minutes", "expertise"]

class ModuleProductForm(ModelForm):
    class Meta:
        model = ModuleProduct
        fields = ["title", "description", "explanation", "published_at",
                  "image_url", "original_price", "discount_percent", "registration_link",
                  "is_active", "file_pdf_url", "stock"]

class BootcampProductForm(ModelForm):
    class Meta:
        model = BootcampProduct
        fields = ["title", "description", "explanation", "published_at",
                  "image_url", "original_price", "discount_percent", "registration_link",
                  "is_active", "stock"]