from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt
from . import views
from .analytics_views import AnalyticsView, PredictiveAnalyticsView
from .security_views import (
    TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView,
    SecurityDashboardView, PasswordSecurityView
)

# Custom router that exempts views from CSRF
class CsrfExemptRouter(DefaultRouter):
    def get_api_root_view(self, api_urls=None):
        api_root_view = super().get_api_root_view(api_urls)
        return csrf_exempt(api_root_view.cls.as_view())

router = CsrfExemptRouter()
router.register(r'donors', views.DonorViewSet, basename='donor')
router.register(r'recipients', views.RecipientViewSet, basename='recipient')
router.register(r'blood-requests', views.BloodRequestViewSet, basename='blood-request')
router.register(r'matches', views.DonorRecipientMatchViewSet, basename='match')
router.register(r'donation-history', views.DonationHistoryViewSet, basename='donation-history')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Password reset
    path("password-reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),

    # Profile & Dashboard
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    # Location-based
    path('nearby/donors/', views.NearbyDonorsView.as_view(), name='nearby-donors'),
    path('nearby/requests/', views.NearbyBloodRequestsView.as_view(), name='nearby-requests'),

    # Analytics
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('analytics/predictive/', PredictiveAnalyticsView.as_view(), name='predictive-analytics'),

    # Security
    path('security/2fa/setup/', TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('security/2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa-verify'),
    path('security/2fa/disable/', TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('security/dashboard/', SecurityDashboardView.as_view(), name='security-dashboard'),
    path('security/password/', PasswordSecurityView.as_view(), name='password-security'),

    # JWT
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),

    # Include router URLs
    path('', include(router.urls)),
]
