from django.urls import path

from .views import add_product, get_products, get_product_summary, update_product

urlpatterns = [
    path("", get_products, name="api_products_list"),
    path("summary/", get_product_summary, name="api_products_summary"),
    path("add/", add_product, name="api_products_add"),
    path("<uuid:product_id>/", update_product, name="api_products_update"),
]
