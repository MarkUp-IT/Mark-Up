from django.urls import path

from .views import (
    get_product_purchase_counts,
    get_revenue_summary,
    get_transactions,
    get_user_purchased_product_detail,
    get_user_purchased_products,
    get_product_revenue_summary,
    checkout_product
)

urlpatterns = [
    path("", get_transactions, name="api_transactions_list"),
    path("checkout/", checkout_product, name="checkout_product"),
    path("summary/revenue/", get_revenue_summary, name="api_transactions_revenue_summary"),
    path("summary/purchases/", get_product_purchase_counts, name="api_transactions_purchase_counts"),
    path("summary/revenue/", get_product_revenue_summary, name="api_product_revenue_summary"),
    path("me/products/", get_user_purchased_products, name="api_user_purchased_products"),
    path("me/products/<uuid:product_id>/", get_user_purchased_product_detail, name="api_user_purchased_product_detail"),
]
