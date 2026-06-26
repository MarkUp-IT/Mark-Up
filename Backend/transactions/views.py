from django.db.models import Case, DecimalField, ExpressionWrapper, F, Sum, When
from django.http import JsonResponse, HttpResponseNotAllowed
from .models import PaymentStatus, Transaction, TransactionItem
from products.models import ProductType
from django.utils.dateparse import parse_date

REVENUE_EXPRESSION = ExpressionWrapper(
    F("price_at_checkout") * F("quantity"),
    output_field=DecimalField(max_digits=14, decimal_places=2),
)


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


def get_revenue_summary(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    paid_items = TransactionItem.objects.filter(transaction__payment_status=Transaction.PaymentStatus.PAID)

    totals = paid_items.aggregate(
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

    return JsonResponse(
        {
            "revenue_by_type": {
                ProductType.MENTORING: str(totals["mentoring_revenue"] or 0),
                ProductType.MODULE: str(totals["module_revenue"] or 0),
                ProductType.BOOTCAMP: str(totals["bootcamp_revenue"] or 0),
            },
            "total_revenue": str(totals["total_revenue"] or 0),
        },
        status=200,
    )


def get_total_revenue(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = TransactionItem.objects.filter(
        transaction__payment_status=PaymentStatus.PAID
    )

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if start_date:
        items = items.filter(
            transaction__created_at__date__gte=parse_date(start_date)
        )

    if end_date:
        items = items.filter(
            transaction__created_at__date__lte=parse_date(end_date)
        )

    total = items.aggregate(
        revenue=Sum(REVENUE_EXPRESSION)
    )["revenue"] or 0

    return JsonResponse(
        {
            "start_date": start_date,
            "end_date": end_date,
            "total_revenue": str(total),
        },
        status=200,
    )


def get_product_purchase_counts(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    items = TransactionItem.objects.filter(
        transaction__payment_status=PaymentStatus.PAID
    )

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if start_date:
        items = items.filter(
            transaction__created_at__date__gte=parse_date(start_date)
        )

    if end_date:
        items = items.filter(
            transaction__created_at__date__lte=parse_date(end_date)
        )

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

    total_count = (
        (counts["mentoring_count"] or 0)
        + (counts["module_count"] or 0)
        + (counts["bootcamp_count"] or 0)
    )

    return JsonResponse(
        {
            "start_date": start_date,
            "end_date": end_date,
            "counts_by_type": {
                ProductType.MENTORING: int(counts["mentoring_count"] or 0),
                ProductType.MODULE: int(counts["module_count"] or 0),
                ProductType.BOOTCAMP: int(counts["bootcamp_count"] or 0),
            },
            "total_count": int(total_count),
        },
        status=200,
    )