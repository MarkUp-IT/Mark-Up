from django.urls import path

from .views import add_competition, update_competition, get_competitions

urlpatterns = [
    path("", get_competitions, name="api_competition_list"),
    path("add/", add_competition, name="api_competition_add"),
    path("<uuid:competition_id>/", update_competition, name="api_competition_update"),
]