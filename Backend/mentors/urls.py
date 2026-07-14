from django.urls import path

from .views import (
    add_availability,
    get_mentors,
    get_user_mentoring_sessions,
    get_mentor_availability,
)

urlpatterns = [
    path("", get_mentors, name="api_mentors_list"),
    path("availability/add/", add_availability, name="api_mentors_add_availability"),
    path("<str:mentor_id>/availability/", get_mentor_availability, name="api_mentor_availability"),
    path("sessions/me/", get_user_mentoring_sessions, name="api_user_mentoring_sessions"),
]
