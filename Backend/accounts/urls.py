from django.urls import path

from .views import login_view, register_view, get_user_summary, get_current_user, logout_user

urlpatterns = [
    path("register/", register_view, name="api_register"),
    path("me/", get_current_user, name="api_auth_me"),
    path("login/", login_view, name="api_login"),
    path("logout/", logout_user, name="api_logout"),
    path("summary/", get_user_summary, name="api_users_summary"),
]
