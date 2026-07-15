from django.urls import path

from .views import (
    add_competition,
    get_categories,
    get_competition_summary,
    get_competitions,
    update_competition,
)

urlpatterns = [
    path("", get_competitions, name="api_competition_list"),
    path("categories/", get_categories, name="api_competition_categories"),
    path("summary/", get_competition_summary, name="api_products_summary"),
    path("add/", add_competition, name="api_competition_add"),
    path("<uuid:competition_id>/", update_competition, name="api_competition_update"),
]