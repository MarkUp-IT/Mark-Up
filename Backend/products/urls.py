from django.urls import path

from .views import (
    add_product,
    get_my_products,
    get_my_product_detail,
    rate_my_product,
    refund_my_product,
    schedule_my_product_session,
    get_products,
    get_product,
    get_product_summary,
    update_product,
)

urlpatterns = [
    path("", get_products, name="api_products_list"),
    path("<uuid:product_id>/", get_product, name="get_product"),
    path("summary/", get_product_summary, name="api_products_summary"),
    path("add/", add_product, name="api_products_add"),
    path("my-products/", get_my_products, name="api_my_products_list"),
    path("my-products/<uuid:product_id>/", get_my_product_detail, name="api_my_product_detail"),
    path("my-products/<uuid:product_id>/rate/", rate_my_product, name="api_my_product_rate"),
    path("my-products/<uuid:product_id>/refund/", refund_my_product, name="api_my_product_refund"),
    path("my-products/sessions/<uuid:session_id>/schedule/", schedule_my_product_session, name="api_my_product_schedule"),
    path("<uuid:product_id>/", update_product, name="api_products_update"),
]
