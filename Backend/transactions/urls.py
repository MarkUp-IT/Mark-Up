from django.urls import path

from .views import (
    get_product_purchase_counts,
    get_revenue_summary,
    get_transactions,
    get_user_purchased_product_detail,
    get_user_purchased_products,
    checkout_product,
    verify_transaction,
    get_my_transactions,
    get_referral_codes,
    add_referral_code,
    update_referral_code,
    get_payouts,
    mark_payout_paid,
    update_payout_fee,
    commission_setting,
    get_my_payouts,
)

urlpatterns = [
    path("", get_transactions, name="api_transactions_list"),
    path("checkout/", checkout_product, name="checkout_product"),
    path("summary/revenue/", get_revenue_summary, name="api_transactions_revenue_summary"),
    path("summary/purchases/", get_product_purchase_counts, name="api_transactions_purchase_counts"),
    path("me/transactions/", get_my_transactions, name="api_my_transactions"),
    path("me/products/", get_user_purchased_products, name="api_user_purchased_products"),
    path("me/products/<uuid:product_id>/", get_user_purchased_product_detail, name="api_user_purchased_product_detail"),
    path("me/payouts/", get_my_payouts, name="api_my_payouts"),
    path("referral-codes/", get_referral_codes, name="api_referral_codes_list"),
    path("referral-codes/add/", add_referral_code, name="api_referral_codes_add"),
    path("referral-codes/<uuid:referral_code_id>/", update_referral_code, name="api_referral_codes_update"),
    path("payouts/", get_payouts, name="api_payouts_list"),
    path("payouts/commission-setting/", commission_setting, name="api_commission_setting"),
    path("payouts/<uuid:payout_id>/mark-paid/", mark_payout_paid, name="api_payouts_mark_paid"),
    path("payouts/<uuid:payout_id>/fee/", update_payout_fee, name="api_payouts_update_fee"),
    path("<str:transaction_id>/verify/", verify_transaction, name="api_transaction_verify"),
]
