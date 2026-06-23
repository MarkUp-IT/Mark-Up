from django import forms
from .models import ProductType


class ProductCreateForm(forms.Form):
    type = forms.ChoiceField(choices=ProductType.choices)
    title = forms.CharField(max_length=255)
    description = forms.CharField()
    image_url = forms.URLField(required=False)
    price = forms.DecimalField(max_digits=12, decimal_places=2)
    is_active = forms.BooleanField(required=False)