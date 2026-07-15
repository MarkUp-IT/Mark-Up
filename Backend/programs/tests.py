from django.test import TestCase

from .models import CompetitionCategory


class CompetitionCategoryApiTests(TestCase):
    def test_get_categories_returns_all_categories(self):
        business = CompetitionCategory.objects.create(name="Business Case")
        hackathon = CompetitionCategory.objects.create(name="Hackathon")

        response = self.client.get("/api/programs/categories/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "categories": [
                    {"id": str(business.id), "name": "Business Case"},
                    {"id": str(hackathon.id), "name": "Hackathon"},
                ]
            },
        )
