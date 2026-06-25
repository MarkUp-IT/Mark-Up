from django.urls import path

from .views import get_mentors

urlpatterns = [
    path("", get_mentors, name="api_mentors_list"),
]
