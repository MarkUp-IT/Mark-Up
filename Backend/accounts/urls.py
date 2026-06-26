from django.urls import path

from .views import login_view, register_view, get_user_summary

urlpatterns = [
    path("register/", register_view, name="api_register"),
    path("login/", login_view, name="api_login"),
    path("summary/", get_user_summary, name="api_users_summary"),
]
