
from django.contrib import admin
from django.urls import path,include
from api import urls as api_urls
from core import urls as core_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/',include(api_urls)),
    path('',include(core_urls)),

]
