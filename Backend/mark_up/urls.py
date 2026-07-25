"""
URL configuration for mark_up project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Sengaja bukan path 'admin/' -- itu udah dipakai dashboard admin custom
    # (Next.js) di frontend, dan nginx nge-proxy /admin/ ke Gunicorn, jadi
    # bentrok kalau namanya sama (yang muncul admin bawaan Django ini terus,
    # dashboard custom-nya nggak pernah ke-render).
    path('django-admin/', admin.site.urls),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/mentors/', include('mentors.urls')),
    path('api/programs/', include('programs.urls')),
    path('api/transactions/', include('transactions.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# KHUSUS DEVELOPMENT
# Kalau nanti production,
#  ini biasanya di-serve lewat nginx/cloud storage, bukan Django langsung — tapi itu urusan deployment, nggak perlu dipikir sekarang.