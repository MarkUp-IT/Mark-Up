from django.http import JsonResponse, HttpResponseNotAllowed

from .models import MentorProfile


def get_mentors(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	mentors = MentorProfile.objects.select_related("user").prefetch_related("mentor_expertises__expertise").order_by("-created_at")
	data = []

	for mentor in mentors:
		expertise_items = [
			{
				"id": str(me.expertise.id),
				"name": me.expertise.name,
			}
			for me in mentor.mentor_expertises.all()
		]

		data.append(
			{
				"id": str(mentor.id),
				"fullname": mentor.user.fullname,
				"email": mentor.user.email,
				"bio": mentor.bio,
				"bank_name": mentor.bank_name,
				"bank_account": mentor.bank_account,
				"linkedin_url": mentor.linkedin_url,
				"created_at": mentor.created_at.isoformat() if mentor.created_at else None,
				"expertise": expertise_items,
			}
		)

	return JsonResponse({"mentors": data}, status=200)
