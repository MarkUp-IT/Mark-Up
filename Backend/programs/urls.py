from django.urls import path

from .views import add_competition, update_competition

urlpatterns = [
    path("add/", add_competition, name="api_competition_add"),
    path("<uuid:competition_id>/", update_competition, name="api_competition_update"),
]