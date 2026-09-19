import json


def get_request_data(request):
    try:
        if request.content_type.startswith("application/json"):
            return json.loads(request.body.decode() or "{}")

        return request.POST

    except json.JSONDecodeError:
        return None


def get_mentors_for_product(product_id):
    """MentorProfile manapun yang pernah ngajar sesi (mentoring/bootcamp)
    dari produk ini -- dipakai buat nentuin siapa yang perlu di-recompute
    rating-nya pas ada review baru/disembunyikan buat produk itu."""
    from .models import MentorProfile
    from products.models import MentoringSession, BootcampSession

    mentor_ids = set(
        MentoringSession.objects.filter(mentoring__product_id=product_id).values_list(
            "mentor_id", flat=True
        )
    ) | set(
        BootcampSession.objects.filter(
            bootcamp__product_id=product_id
        ).values_list("mentors__id", flat=True)
    )
    mentor_ids.discard(None)
    return MentorProfile.objects.filter(id__in=mentor_ids)


def recompute_mentor_rating(mentor_profile):
    """Hitung ulang rating & review_count mentor dari review produk yang
    dia ajar (yang nggak disembunyikan admin). Dipanggil tiap ada review
    baru atau visibility review diubah."""
    from django.db.models import Avg, Count
    from products.models import Review, MentoringSession, BootcampSession

    product_ids = set(
        MentoringSession.objects.filter(mentor=mentor_profile).values_list(
            "mentoring__product_id", flat=True
        )
    ) | set(
        BootcampSession.objects.filter(mentors=mentor_profile).values_list(
            "bootcamp__product_id", flat=True
        )
    )

    stats = Review.objects.filter(product_id__in=product_ids, is_hidden=False).aggregate(
        avg_rating=Avg("rating"), count=Count("id")
    )

    mentor_profile.rating = stats["avg_rating"] or 0
    mentor_profile.review_count = stats["count"] or 0
    mentor_profile.save(update_fields=["rating", "review_count"])
