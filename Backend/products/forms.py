from django import forms
from django.forms import ModelForm
from .models import MentoringProduct, ModuleProduct, BootcampProduct


class MentoringProductForm(ModelForm):
    class Meta:
        model = MentoringProduct
        fields = ["title", "description", "explanation", "published_at", 
                  "image_url", "price", "is_active"]

class ModuleProductForm(ModelForm):
    class Meta:
        model = ModuleProduct
        fields = ["title", "description", "explanation", "published_at",
                  "image_url", "price", "is_active", "file_pdf_url", "stock"]

class BootcampProductForm(ModelForm):
    class Meta:
        model = BootcampProduct
        fields = ["title", "description", "explanation", "published_at",
                  "image_url", "price", "is_active", "stock"]