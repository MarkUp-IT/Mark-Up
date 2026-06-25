from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import ProductCreateForm
from .models import Product, ProductType, MentoringProduct, ModuleProduct, BootcampProduct


def add_product(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	form = ProductCreateForm(request_data)

	if not form.is_valid():
		errors = {k: list(v) for k, v in form.errors.items()}
		non_field = form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	cleaned_data = form.cleaned_data
	product_type = cleaned_data["type"]

	
	product = Product.objects.create(type=product_type)

	try:
		
		if product_type == ProductType.MENTORING:
			detail = MentoringProduct.objects.create(
				product=product,
				title=cleaned_data["title"],
				description=cleaned_data["description"],
				image_url=cleaned_data.get("image_url") or None,
				price=cleaned_data["price"],
				is_active=cleaned_data.get("is_active", True),
			)
		elif product_type == ProductType.MODULE:
			file_pdf_url = request_data.get("file_pdf_url")
			if not file_pdf_url:
				product.delete()
				return JsonResponse(
					{"errors": {"file_pdf_url": ["PDF URL diperlukan untuk Module."]}},
					status=400,
				)
			detail = ModuleProduct.objects.create(
				product=product,
				title=cleaned_data["title"],
				description=cleaned_data["description"],
				image_url=cleaned_data.get("image_url") or None,
				price=cleaned_data["price"],
				is_active=cleaned_data.get("is_active", True),
				file_pdf_url=file_pdf_url,
			)
		elif product_type == ProductType.BOOTCAMP:
			detail = BootcampProduct.objects.create(
				product=product,
				title=cleaned_data["title"],
				description=cleaned_data["description"],
				image_url=cleaned_data.get("image_url") or None,
				price=cleaned_data["price"],
				is_active=cleaned_data.get("is_active", True),
			)
		else:
			product.delete()
			return JsonResponse(
				{"errors": {"type": ["Tipe produk tidak valid."]}},
				status=400,
			)

		return JsonResponse(
			{
				"detail": "Penambahan produk berhasil.",
				"product": {
					"id": str(product.id),
					"type": product.type,
					"title": detail.title,
					"price": str(detail.price),
				},
			},
			status=201,
		)

	except Exception as e:
		product.delete()
		return JsonResponse(
			{"detail": f"Gagal membuat detail produk: {str(e)}"},
			status=500,
		)


def get_products(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])

	products = Product.objects.all().order_by("-created_at")
	data = []
	for p in products:
		item = {
			"id": str(p.id),
			"type": p.type,
			"created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
		}
		detail = None
		if p.type == ProductType.MENTORING:
			detail = getattr(p, "mentoring_detail", None)
		elif p.type == ProductType.MODULE:
			detail = getattr(p, "module_detail", None)
		elif p.type == ProductType.BOOTCAMP:
			detail = getattr(p, "bootcamp_detail", None)

		if detail:
			item.update({
				"title": detail.title,
				"description": detail.description,
				"image_url": detail.image_url,
				"price": str(detail.price),
				"is_active": detail.is_active,
			})
			# module-specific
			if hasattr(detail, "file_pdf_url"):
				item["file_pdf_url"] = detail.file_pdf_url

		data.append(item)

	return JsonResponse({"products": data}, status=200)