from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
# GIS imports commented out for SQLite development
# from django.contrib.gis.db import models as gis_models

# Blood group choices
BLOOD_GROUP_CHOICES = [
    ('A+', 'A+'),
    ('A-', 'A-'),
    ('B+', 'B+'),
    ('B-', 'B-'),
    ('AB+', 'AB+'),
    ('AB-', 'AB-'),
    ('O+', 'O+'),
    ('O-', 'O-'),
]

# Custom user model instead of Built in User model
class User(AbstractUser):
    is_donor = models.BooleanField(default=False)
    is_recipient = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    # Location fields for SQLite development (replace PointField)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Address fields for general location
    address = models.CharField(max_length=300, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    traditional_state = models.CharField(max_length=100, blank=True, null=True)  # Renamed to avoid conflict
    pincode = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, default='India')
    
    def __str__(self):
        return f'{self.username} ({self.email})'

# Donor profile model
class Donor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor_profile')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, default='O+')
    address = models.CharField(max_length=200, default='')
    city = models.CharField(max_length=100, default='')
    state = models.CharField(max_length=100, default='')
    pincode = models.CharField(max_length=10, default='')
    availability = models.BooleanField(default=True)
    last_donation_date = models.DateField(null=True, blank=True)
    weight = models.FloatField(validators=[MinValueValidator(45.0), MaxValueValidator(200.0)], null=True, blank=True)
    height = models.FloatField(validators=[MinValueValidator(120.0), MaxValueValidator(220.0)], null=True, blank=True)
    medical_conditions = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ML features for matching
    matching_score = models.FloatField(default=0.0)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f'{self.user.username} - {self.blood_group}'
    
    @property
    def can_donate(self):
        """Check if donor can donate based on last donation date"""
        if not self.last_donation_date:
            return True
        from datetime import date, timedelta
        return (date.today() - self.last_donation_date).days >= 90
    
#recipient
# core/models.py
class Recipient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recipient_profile')
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, default='O+')
    address = models.CharField(max_length=200, default='')
    city = models.CharField(max_length=100, default='')
    state = models.CharField(max_length=100, default='')
    pincode = models.CharField(max_length=10, default='')
    medical_conditions = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.user.username} ({self.blood_group})'


# Blood request model
class BloodRequest(models.Model):
    URGENCY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('MATCHED', 'Matched'),
        ('CONFIRMED', 'Confirmed'),  # Recipient has confirmed a donor
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blood_requests")
    patient_name = models.CharField(max_length=100)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES)
    units_required = models.PositiveIntegerField(default=1)
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='MEDIUM')
    hospital_name = models.CharField(max_length=200)
    hospital_address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    contact_person = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=15)
    required_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    description = models.TextField(blank=True, null=True)
    
    # Confirmation workflow fields
    confirmed_donor = models.ForeignKey('Donor', on_delete=models.SET_NULL, null=True, blank=True, 
                                        related_name='confirmed_requests', help_text='Donor confirmed by recipient')
    confirmation_date = models.DateTimeField(null=True, blank=True)
    confirmation_notes = models.TextField(blank=True, null=True, help_text='Notes from recipient when confirming')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f'{self.patient_name} - {self.blood_group} ({self.urgency})'

# Donation history model
class DonationHistory(models.Model):
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='donation_history')
    recipient_request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, related_name='donations')
    donation_date = models.DateTimeField(auto_now_add=True)
    units_donated = models.PositiveIntegerField(default=1)
    is_successful = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f'{self.donor.user.username} -> {self.recipient_request.patient_name}'

# Matching model to track donor-recipient matches
class DonorRecipientMatch(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]
    
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='matches')
    blood_request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, related_name='matches')
    matching_score = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['donor', 'blood_request']
    
    def __str__(self):
        return f'{self.donor.user.username} -> {self.blood_request.patient_name} (Score: {self.matching_score})'

# Notification model
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('MATCH_FOUND', 'Match Found'),
        ('REQUEST_ACCEPTED', 'Request Accepted'),
        ('REQUEST_REJECTED', 'Request Rejected'),
        ('DONOR_CONFIRMED', 'Donor Confirmed'),  # New type for recipient confirming a donor
        ('DONATION_REMINDER', 'Donation Reminder'),
        ('SYSTEM_UPDATE', 'System Update'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', db_index=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    related_request = models.ForeignKey(BloodRequest, on_delete=models.CASCADE, null=True, blank=True)
    related_match = models.ForeignKey(DonorRecipientMatch, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.title}'