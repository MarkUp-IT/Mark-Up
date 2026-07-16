from django.urls import path

from .views import login_view, register_view, get_user_summary, get_current_user, logout_user, profile_view, upload_profile_photo, delete_profile_photo

urlpatterns = [
    path("register/", register_view, name="api_register"),
    path("me/", get_current_user, name="api_auth_me"),
    path("login/", login_view, name="api_login"),
    path("logout/", logout_user, name="api_logout"),
    path("summary/", get_user_summary, name="api_users_summary"),
    path("me/profile/", profile_view, name="api_profile"),
    path("me/profile/photo/", upload_profile_photo, name="upload_profile_photo"),
    path("me/profile/photo/delete/", delete_profile_photo, name="delete_profile_photo"),
]
