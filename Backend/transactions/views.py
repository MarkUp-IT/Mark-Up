from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, When
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from .models import PaymentStatus, Transaction, TransactionItem
from products.models import Product, ProductType
from django.utils.dateparse import parse_date
from accounts.decorators import jwt_required, role_required
from accounts.models import UserRole
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Case, When, F, DecimalField
from django.db.models.functions import TruncDate

def _resolve_period_range(period: str):
    """
    Translate period key (all/day/week/month) jadi (start_date, end_date, prev_start, prev_end).
    prev_* dipakai untuk hitung trend dibanding periode sebelumnya.
    """
    today = timezone.localdate()

    if period == "day":
        start_date = end_date = today
        prev_start = prev_end = today - timedelta(days=1)
    elif period == "week":
        start_date = today - timedelta(days=today.weekday())  # Senin
        end_date = today
        length = (end_date - start_date).days + 1
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=length - 1)
    elif period == "month":
        start_date = today.replace(day=1)
        end_date = today
        length = (end_date - start_date).days + 1
        prev_end = start_date - timedelta(days=1)
        prev_start = prev_end - timedelta(days=length - 1)
    else:  # "all"
        start_date = end_date = prev_start = prev_end = None

    return start_date, end_date, prev_start, prev_end

def _apply_date_filter(queryset, start_date, end_date):
    if start_date:
        queryset = queryset.filter(transaction__created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(transaction__created_at__date__lte=end_date)
    return queryset

def _sum_revenue(queryset):
    return queryset.aggregate(revenue=Sum(REVENUE_EXPRESSION))["revenue"] or 0


REVENUE_EXPRESSION = ExpressionWrapper(
    F("price_at_checkout") * F("quantity"),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)


def _serialize_product_detail(product):
    detail = None
    if product.type == ProductType.MENTORING:
        detail = getattr(product, "mentoring_detail", None)
    elif product.type == ProductType.MODULE:
        detail = getattr(product, "module_detail", None)
    elif product.type == ProductType.BOOTCAMP:
        detail = getattr(product, "bootcamp_detail", None)

    if detail is None:
        return None

    payload = {
        "title": detail.title,
        "description": detail.description,
        "image_url": detail.image_url,
        "price": str(detail.price),
        "is_active": detail.is_active,
    }

    if hasattr(detail, "file_pdf_url"):
        payload["file_pdf_url"] = detail.file_pdf_url

    if hasattr(detail, "stock"):
        payload["stock"] = detail.stock

    return payload

@jwt_required
@role_required(UserRole.ADMIN)
def get_transactions(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = (
        TransactionItem.objects
        .select_related(
            "transaction",
            "transaction__user",
            "product",
        )
        .order_by("-transaction__created_at")
    )

    data = []

    for item in items:
        data.append({
            "transaction_id": item.transaction.id,
            "user_id": str(item.transaction.user.id),
            "user_name": item.transaction.user.fullname,
            "product_id": str(item.product.id),
            "date_time": item.transaction.created_at.isoformat(),
            "amount": str(item.transaction.grand_total),
            "method": item.transaction.payment_method,
            "status": item.transaction.payment_status,
        })

    return JsonResponse(
        {"transactions": data},
        status=200
    )

@jwt_required
@role_required(UserRole.ADMIN)
def get_revenue_summary(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    period = request.GET.get("period", "all")
    if period not in ("all", "day", "week", "month"):
        return HttpResponseBadRequest("period harus salah satu dari: all, day, week, month")

    start_date, end_date, prev_start, prev_end = _resolve_period_range(period)

    base_items = TransactionItem.objects.filter(
        transaction__payment_status=PaymentStatus.PAID
    )
    items = _apply_date_filter(base_items, start_date, end_date)

    totals = items.aggregate(
        mentoring_revenue=Sum(
            Case(
                When(product__type=ProductType.MENTORING, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        module_revenue=Sum(
            Case(
                When(product__type=ProductType.MODULE, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        bootcamp_revenue=Sum(
            Case(
                When(product__type=ProductType.BOOTCAMP, then=REVENUE_EXPRESSION),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        ),
        total_revenue=Sum(REVENUE_EXPRESSION),
    )
    total_revenue = totals["total_revenue"] or 0

    # Trend dibanding periode sebelumnya (untuk "all" nggak ada pembanding yang jelas)
    trend_percentage = None
    if period != "all":
        prev_revenue = _sum_revenue(_apply_date_filter(base_items, prev_start, prev_end))
        if prev_revenue:
            trend_percentage = round(float((total_revenue - prev_revenue) / prev_revenue) * 100, 2)
        else:
            trend_percentage = 100.0 if total_revenue else 0.0

    # Data harian untuk bar chart. period == "all" -> batasi 30 hari terakhir.
    chart_start = start_date or (timezone.localdate() - timedelta(days=29))
    chart_end = end_date or timezone.localdate()

    daily_qs = (
        _apply_date_filter(base_items, chart_start, chart_end)
        .annotate(date=TruncDate("transaction__created_at"))
        .values("date")
        .annotate(revenue=Sum(REVENUE_EXPRESSION))
        .order_by("date")
    )
    daily_map = {row["date"]: row["revenue"] or 0 for row in daily_qs}

    daily_chart = []
    cursor = chart_start
    while cursor <= chart_end:
        daily_chart.append({"day": cursor.strftime("%d/%m"), "revenue": float(daily_map.get(cursor, 0))})
        cursor += timedelta(days=1)

    return JsonResponse(
        {
            "period": period,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "revenue_by_type": {
                ProductType.MENTORING: str(totals["mentoring_revenue"] or 0),
                ProductType.MODULE: str(totals["module_revenue"] or 0),
                ProductType.BOOTCAMP: str(totals["bootcamp_revenue"] or 0),
            },
            "total_revenue": str(total_revenue),
            "trend_percentage": trend_percentage,
            "daily_chart": daily_chart,
        },
        status=200,
    )

@jwt_required
@role_required(UserRole.ADMIN)
def get_product_purchase_counts(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    period = request.GET.get("period", "all")
    if period not in ("all", "day", "week", "month"):
        return HttpResponseBadRequest("period harus salah satu dari: all, day, week, month")

    start_date, end_date, _, _ = _resolve_period_range(period)

    base_items = TransactionItem.objects.filter(transaction__payment_status=PaymentStatus.PAID)
    items = _apply_date_filter(base_items, start_date, end_date)

    counts = items.aggregate(
        mentoring_count=Sum(
            Case(
                When(product__type=ProductType.MENTORING, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
        module_count=Sum(
            Case(
                When(product__type=ProductType.MODULE, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
        bootcamp_count=Sum(
            Case(
                When(product__type=ProductType.BOOTCAMP, then=F("quantity")),
                default=0,
                output_field=DecimalField(max_digits=14, decimal_places=0),
            )
        ),
    )
    total_count = (counts["mentoring_count"] or 0) + (counts["module_count"] or 0) + (counts["bootcamp_count"] or 0)

    # "Penjualan Hari Ini" -- independen dari period yang dipilih FE,
    # jadi card ini selalu nunjukin angka hari ini apa pun filter aktif.
    today = timezone.localdate()
    today_count = base_items.filter(transaction__created_at__date=today).aggregate(
        qty=Sum("quantity")
    )["qty"] or 0

    return JsonResponse(
        {
            "period": period,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "counts_by_type": {
                ProductType.MENTORING: int(counts["mentoring_count"] or 0),
                ProductType.MODULE: int(counts["module_count"] or 0),
                ProductType.BOOTCAMP: int(counts["bootcamp_count"] or 0),
            },
            "total_count": int(total_count),
            "today_count": int(today_count),
        },
        status=200,
    )

@jwt_required
def get_user_purchased_products(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    items = (
        TransactionItem.objects.filter(
            transaction__user=request.user,
            transaction__payment_status=PaymentStatus.PAID,
        )
        .select_related("transaction", "product")
        .order_by("-transaction__created_at")
    )

    data = []
    for item in items:
        product_detail = _serialize_product_detail(item.product)
        data.append(
            {
                "transaction_item_id": str(item.id),
                "transaction_id": item.transaction.id,
                "product_id": str(item.product.id),
                "product_type": item.product.type,
                "quantity": item.quantity,
                "price_at_checkout": str(item.price_at_checkout),
                "purchased_at": item.transaction.created_at.isoformat(),
                "product": product_detail,
            }
        )

    return JsonResponse({"products": data}, status=200)

@jwt_required
def get_user_purchased_product_detail(request, product_id):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Produk tidak ditemukan."}, status=404)

    item = (
        TransactionItem.objects.filter(
            transaction__user=request.user,
            transaction__payment_status=PaymentStatus.PAID,
            product=product,
        )
        .select_related("transaction", "product")
        .order_by("-transaction__created_at")
        .first()
    )

    if item is None:
        return JsonResponse({"detail": "Produk ini belum pernah dibeli oleh pengguna ini."}, status=404)

    product_detail = _serialize_product_detail(product)
    return JsonResponse(
        {
            "transaction_item_id": str(item.id),
            "transaction_id": item.transaction.id,
            "product_id": str(product.id),
            "product_type": product.type,
            "quantity": item.quantity,
            "price_at_checkout": str(item.price_at_checkout),
            "purchased_at": item.transaction.created_at.isoformat(),
            "product": product_detail,
        },
        status=200,
    )