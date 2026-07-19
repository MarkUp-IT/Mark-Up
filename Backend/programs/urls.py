from django.urls import path

from .views import (
    add_competition,
    get_categories,
    get_competition_summary,
    get_competitions,
    update_competition,
    get_bootcamp_batches,
    get_bootcamp_batch_detail,
    add_bootcamp_session_template,
    update_bootcamp_session_template,
)

urlpatterns = [
    path("", get_competitions, name="api_competition_list"),
    path("categories/", get_categories, name="api_competition_categories"),
    path("summary/", get_competition_summary, name="api_products_summary"),
    path("add/", add_competition, name="api_competition_add"),
    path("bootcamp-batches/", get_bootcamp_batches, name="api_bootcamp_batches_list"),
    path("bootcamp-batches/<uuid:product_id>/", get_bootcamp_batch_detail, name="api_bootcamp_batch_detail"),
    path("bootcamp-batches/<uuid:product_id>/sessions/add/", add_bootcamp_session_template, name="api_bootcamp_session_add"),
    path("bootcamp-sessions/<uuid:session_id>/", update_bootcamp_session_template, name="api_bootcamp_session_update"),
    path("<uuid:competition_id>/", update_competition, name="api_competition_update"),
]