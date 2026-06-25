from django.urls import path

from .views import get_transactions

urlpatterns = [
    path("", get_transactions, name="api_transactions_list"),
]
