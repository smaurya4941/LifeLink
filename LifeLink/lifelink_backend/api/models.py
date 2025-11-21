from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SecurityEvent(models.Model):
    EVENT_TYPES = [
        ('LOGIN_SUCCESS', 'Successful Login'),
        ('LOGIN_FAILED', 'Failed Login'),
        ('PASSWORD_CHANGE', 'Password Changed'),
        ('2FA_ENABLED', '2FA Enabled'),
        ('2FA_DISABLED', '2FA Disabled'),
        ('SUSPICIOUS_ACTIVITY', 'Suspicious Activity'),
        ('RATE_LIMIT_EXCEEDED', 'Rate Limit Exceeded'),
        ('ACCOUNT_LOCKED', 'Account Locked'),
        ('ACCOUNT_UNLOCKED', 'Account Unlocked'),
        ('PASSWORD_CHANGE_FAILED', 'Password Change Failed'),
        ('2FA_BACKUP_USED', '2FA Backup Used'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES, db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class TwoFactorAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='two_factor_auth')
    secret_key = models.CharField(max_length=64)
    is_enabled = models.BooleanField(default=False, db_index=True)
    backup_codes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)



# Create your models here.
