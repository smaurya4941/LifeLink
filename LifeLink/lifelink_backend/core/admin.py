from django.contrib import admin
from .models import (
    User, Donor, BloodRequest, DonationHistory, 
    DonorRecipientMatch, Notification
)

# Register your models here.

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_donor', 'is_recipient', 'created_at']
    list_filter = ['is_donor', 'is_recipient', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ['user', 'blood_group', 'city', 'availability', 'is_verified', 'created_at']
    list_filter = ['blood_group', 'availability', 'is_verified', 'city', 'state']
    search_fields = ['user__username', 'user__email', 'city', 'state']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    list_display = ['patient_name', 'blood_group', 'urgency', 'status', 'city', 'created_at']
    list_filter = ['blood_group', 'urgency', 'status', 'city', 'state', 'created_at']
    search_fields = ['patient_name', 'hospital_name', 'city', 'contact_person']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(DonationHistory)
class DonationHistoryAdmin(admin.ModelAdmin):
    list_display = ['donor', 'recipient_request', 'donation_date', 'units_donated', 'is_successful']
    list_filter = ['is_successful', 'donation_date']
    search_fields = ['donor__user__username', 'recipient_request__patient_name']

@admin.register(DonorRecipientMatch)
class DonorRecipientMatchAdmin(admin.ModelAdmin):
    list_display = ['donor', 'blood_request', 'matching_score', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['donor__user__username', 'blood_request__patient_name']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']