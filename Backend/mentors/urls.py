from django.urls import path

from .views import (
    add_availability,
    get_mentors,
    get_my_availability,
    delete_my_availability,
    get_mentor_availability,
    my_profile_view,
    get_expertise_catalog,
    update_my_expertise,
    my_experiences_view,
    my_experience_detail_view,
    get_my_sessions,
    get_my_reviews,
    create_expertise,
    delete_expertise,
)

urlpatterns = [
    path("", get_mentors, name="api_mentors_list"),
    path("expertise/", get_expertise_catalog, name="api_mentors_expertise_catalog"),
    path("expertise/create/", create_expertise, name="api_mentors_expertise_create"),
    path("expertise/<uuid:expertise_id>/delete/", delete_expertise, name="api_mentors_expertise_delete"),
    path("availability/add/", add_availability, name="api_mentors_add_availability"),
    path("<uuid:mentor_id>/availability/", get_mentor_availability, name="api_mentor_availability"),
    path("me/availability/", get_my_availability, name="api_mentors_my_availability"),
    path("me/availability/<uuid:availability_id>/", delete_my_availability, name="api_mentors_delete_availability"),
    path("me/profile/", my_profile_view, name="api_mentors_my_profile"),
    path("me/expertise/", update_my_expertise, name="api_mentors_update_expertise"),
    path("me/experiences/", my_experiences_view, name="api_mentors_my_experiences"),
    path("me/experiences/<uuid:experience_id>/", my_experience_detail_view, name="api_mentors_my_experience_detail"),
    path("me/sessions/", get_my_sessions, name="api_mentors_my_sessions"),
    path("me/reviews/", get_my_reviews, name="api_mentors_my_reviews"),
]
