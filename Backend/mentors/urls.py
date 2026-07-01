from django.urls import path

from .views import add_availability, get_mentors, get_user_mentoring_sessions

urlpatterns = [
    path("", get_mentors, name="api_mentors_list"),
    path("availability/add/", add_availability, name="api_mentors_add_availability"),
    path("sessions/me/", get_user_mentoring_sessions, name="api_user_mentoring_sessions"),
]
