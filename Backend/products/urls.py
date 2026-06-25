from django.urls import path

from .views import add_product, get_products

urlpatterns = [
    path("", get_products, name="api_products_list"),
    path("add/", add_product, name="api_products_add"),
]
