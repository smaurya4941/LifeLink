from django.shortcuts import redirect
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "service": "LifeLink Backend API",
        "status": "running",
        "message": "Welcome to the backend.",
        "api_base": "/api/"
    })
