from django.core.paginator import Paginator, EmptyPage
from django.http import JsonResponse, HttpResponseNotAllowed
from .utils import get_request_data
from .forms import MentoringProductForm, ModuleProductForm, BootcampProductForm
from .models import Product, ProductType
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole
from django.db.models import Q

DETAIL_FORM_MAP = {
    ProductType.MENTORING: (MentoringProductForm, "mentoring_detail"),
    ProductType.MODULE: (ModuleProductForm, "module_detail"),
    ProductType.BOOTCAMP: (BootcampProductForm, "bootcamp_detail"),
}


def _get_detail_form_class(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[0]


def _get_detail_attr(product_type):
    return DETAIL_FORM_MAP.get(product_type, (None, None))[1]


def _format_product_response(product, detail):
    response = {
        "id": str(product.id),
		"type": product.type,
		"title": detail.title,
		"description": detail.description,
		"original_price": str(detail.original_price) if detail.original_price else None,
		"discount_percent": detail.discount_percent,
		"sold_count": detail.sold_count,
		"image_url": detail.image_url,
		"registration_link": detail.registration_link,
		"is_active": detail.is_active,
    }

    if getattr(detail, "file_pdf_url", None) is not None:
        response["file_pdf_url"] = detail.file_pdf_url

    if getattr(detail, "stock", None) is not None:
        response["stock"] = detail.stock

    return response

@jwt_required
@role_required(UserRole.ADMIN)
def add_product(request):
	if request.method != "POST":
		return HttpResponseNotAllowed(["POST"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	product_type = request_data.get("type")
	if product_type not in DETAIL_FORM_MAP:
		return JsonResponse({"errors": {"type": ["Tipe produk tidak valid."]}}, status=400)

	form_class = _get_detail_form_class(product_type)
	detail_form = form_class(request_data)

	if not detail_form.is_valid():
		errors = {k: list(v) for k, v in detail_form.errors.items()}
		non_field = detail_form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		product.delete()
		return JsonResponse({"errors": errors}, status=400)

	product = Product.objects.create(type=product_type)
	detail = detail_form.save(commit=False)
	detail.product = product
	detail.save()

	return JsonResponse(
		{
			"detail": "Penambahan produk berhasil.",
			"product": _format_product_response(product, detail),
		},
		status=201,
	)


def get_products(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    fetch_all = request.GET.get("all") == "true"

    products = Product.objects.filter(
        Q(mentoring_detail__is_active=True) |
        Q(module_detail__is_active=True) |
        Q(bootcamp_detail__is_active=True)
    ).order_by("-created_at")

    if fetch_all:
        page_obj = None
        object_list = products
        pagination = None
    else:
        page_number = request.GET.get("page", 1)
        page_size = request.GET.get("page_size", 10)
        try:
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_number = 1
        try:
            page_size = int(page_size)
        except (TypeError, ValueError):
            page_size = 10
        page_size = max(1, min(page_size, 100))

        paginator = Paginator(products, page_size)
        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages or 1)
        object_list = page_obj.object_list
        pagination = {
            "page": page_obj.number,
            "page_size": page_obj.paginator.per_page,
            "total_items": paginator.count,
            "total_pages": paginator.num_pages,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous(),
        }

    data = []
    for p in object_list:
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
				"full_description": detail.explanation,
				"image_url": detail.image_url,
				"original_price": str(detail.original_price) if detail.original_price else None,
				"new_price": str(detail.new_price) if detail.new_price else None,
				"discount_percent": detail.discount_percent,
				"sold_count": detail.sold_count,
				"registration_link": detail.registration_link,
				"is_active": detail.is_active,
						})
            if hasattr(detail, "file_pdf_url"):
                item["file_pdf_url"] = detail.file_pdf_url

        data.append(item)

    response = {"products": data}
    if pagination:
        response["pagination"] = pagination
    return JsonResponse(response, status=200)

@jwt_required
@role_required(UserRole.ADMIN)
def get_product_summary(request):
	if request.method != "GET":
		return HttpResponseNotAllowed(["GET"])  

	active_by_type = {
		ProductType.MENTORING: Product.objects.filter(
			type=ProductType.MENTORING,
			mentoring_detail__is_active=True,
		).count(),
		ProductType.MODULE: Product.objects.filter(
			type=ProductType.MODULE,
			module_detail__is_active=True,
		).count(),
		ProductType.BOOTCAMP: Product.objects.filter(
			type=ProductType.BOOTCAMP,
			bootcamp_detail__is_active=True,
		).count(),
	}

	total_active = sum(active_by_type.values())
	total_products = Product.objects.count()

	return JsonResponse(
		{
			"active_by_type": {
				ProductType.MENTORING: active_by_type[ProductType.MENTORING],
				ProductType.MODULE: active_by_type[ProductType.MODULE],
				ProductType.BOOTCAMP: active_by_type[ProductType.BOOTCAMP],
			},
			"total_active": total_active,
			"total": total_products,
		},
		status=200,
	)

@jwt_required
@role_required(UserRole.ADMIN)
def update_product(request, product_id):
	if request.method not in ["PUT", "PATCH"]:
		return HttpResponseNotAllowed(["PUT", "PATCH"])

	request_data = get_request_data(request)
	if request_data is None:
		return JsonResponse({"detail": "Invalid JSON payload."}, status=400)

	try:
		product = Product.objects.get(id=product_id)
	except Product.DoesNotExist:
		return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

	requested_type = request_data.get("type")
	if requested_type and requested_type != product.type:
		return JsonResponse({"errors": {"type": ["Tidak dapat mengubah tipe produk."]}}, status=400)

	product_type = product.type
	detail_attr = _get_detail_attr(product_type)
	detail = getattr(product, detail_attr, None)
	if detail is None:
		return JsonResponse({"detail": "Detail produk tidak ditemukan."}, status=404)

	form_class = _get_detail_form_class(product_type)
	detail_form = form_class(request_data, instance=detail)

	if not detail_form.is_valid():
		errors = {k: list(v) for k, v in detail_form.errors.items()}
		non_field = detail_form.non_field_errors()
		if non_field:
			errors["non_field_errors"] = list(non_field)
		return JsonResponse({"errors": errors}, status=400)

	detail = detail_form.save()

	return JsonResponse(
		{
			"detail": "Produk berhasil diperbarui.",
			"product": _format_product_response(product, detail),
		},
		status=200,
	)