from django.urls import path

from .views import get_product_purchase_counts, get_revenue_summary, get_transactions

urlpatterns = [
    path("", get_transactions, name="api_transactions_list"),
    path("summary/revenue/", get_revenue_summary, name="api_transactions_revenue_summary"),
    path("summary/purchases/", get_product_purchase_counts, name="api_transactions_purchase_counts"),
]
