"""
Enhanced security features for LifeLink including 2FA, rate limiting, and security monitoring
"""

# optional imports — handle missing packages gracefully
try:
    import qrcode
except Exception:
    qrcode = None

try:
    import pyotp
except Exception:
    pyotp = None

import io
import base64
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
import logging
import hashlib
import secrets

logger = logging.getLogger(__name__)
User = get_user_model()
from .models import SecurityEvent, TwoFactorAuth

# Helper functions replacing model methods for 2FA operations
def two_fa_generate_secret_key(two_fa: TwoFactorAuth):
    two_fa.secret_key = pyotp.random_base32()
    return two_fa.secret_key

def two_fa_generate_qr_code(two_fa: TwoFactorAuth):
    totp = pyotp.TOTP(two_fa.secret_key)
    qr_string = totp.provisioning_uri(name=two_fa.user.email, issuer_name="LifeLink")
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def two_fa_verify_token(two_fa: TwoFactorAuth, token: str) -> bool:
    totp = pyotp.TOTP(two_fa.secret_key)
    return totp.verify(token, valid_window=1)

def two_fa_generate_backup_codes(two_fa: TwoFactorAuth):
    codes = [secrets.token_hex(4).upper() for _ in range(10)]
    two_fa.backup_codes = codes
    return codes

class RateLimitThrottle(UserRateThrottle):
    """Custom rate limiting for different endpoints"""
    scope = 'user'
    
    def get_cache_key(self, request, view):
        """Generate cache key for rate limiting"""
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        
        return f"throttle_{self.scope}_{ident}"

class StrictRateLimitThrottle(RateLimitThrottle):
    """Stricter rate limiting for sensitive operations"""
    scope = 'strict'

class TwoFactorSetupView(APIView):
    """Setup 2FA for user"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [RateLimitThrottle]
    
    def get(self, request):
        """Get 2FA setup information"""
        two_fa, created = TwoFactorAuth.objects.get_or_create(user=request.user)
        
        if not two_fa.secret_key:
            two_fa_generate_secret_key(two_fa)
            two_fa.save()
        
        qr_code = two_fa_generate_qr_code(two_fa)
        
        return Response({
            'secret_key': two_fa.secret_key,
            'qr_code': qr_code,
            'is_enabled': two_fa.is_enabled
        })
    
    def post(self, request):
        """Enable 2FA after verification"""
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user)
            
            if two_fa_verify_token(two_fa, token):
                two_fa.is_enabled = True
                two_fa_generate_backup_codes(two_fa)
                two_fa.save()
                
                # Log security event
                SecurityEvent.objects.create(
                    user=request.user,
                    event_type='2FA_ENABLED',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={'method': 'TOTP'}
                )
                
                return Response({
                    'message': '2FA enabled successfully',
                    'backup_codes': two_fa.backup_codes
                })
            else:
                return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
                
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA not set up'}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorVerifyView(APIView):
    """Verify 2FA token"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [StrictRateLimitThrottle]
    
    def post(self, request):
        """Verify 2FA token"""
        token = request.data.get('token')
        backup_code = request.data.get('backup_code')
        
        if not token and not backup_code:
            return Response({'error': 'Token or backup code is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user, is_enabled=True)
            
            if token:
                if two_fa_verify_token(two_fa, token):
                    two_fa.last_used = timezone.now()
                    two_fa.save()
                    return Response({'message': 'Token verified successfully'})
                else:
                    return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
            
            elif backup_code:
                if backup_code in two_fa.backup_codes:
                    # Remove used backup code
                    two_fa.backup_codes.remove(backup_code)
                    two_fa.save()
                    
                    # Log security event
                    SecurityEvent.objects.create(
                        user=request.user,
                        event_type='2FA_BACKUP_USED',
                        ip_address=get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        details={'backup_code': backup_code[:4] + '****'}
                    )
                    
                    return Response({'message': 'Backup code verified successfully'})
                else:
                    return Response({'error': 'Invalid backup code'}, status=status.HTTP_400_BAD_REQUEST)
                    
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA not enabled'}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(APIView):
    """Disable 2FA"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [StrictRateLimitThrottle]
    
    def post(self, request):
        """Disable 2FA"""
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not check_password(password, request.user.password):
            return Response({'error': 'Invalid password'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user)
            two_fa.is_enabled = False
            two_fa.save()
            
            # Log security event
            SecurityEvent.objects.create(
                user=request.user,
                event_type='2FA_DISABLED',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={'method': 'password_verification'}
            )
            
            return Response({'message': '2FA disabled successfully'})
            
        except TwoFactorAuth.DoesNotExist:
            return Response({'error': '2FA not enabled'}, status=status.HTTP_400_BAD_REQUEST)

class SecurityDashboardView(APIView):
    """Security dashboard for users"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get security information for user"""
        # Get 2FA status
        try:
            two_fa = TwoFactorAuth.objects.get(user=request.user)
            two_fa_enabled = two_fa.is_enabled
            backup_codes_count = len(two_fa.backup_codes)
        except TwoFactorAuth.DoesNotExist:
            two_fa_enabled = False
            backup_codes_count = 0
        
        # Get recent security events
        recent_events = SecurityEvent.objects.filter(
            user=request.user
        ).order_by('-created_at')[:10]
        
        # Get login history
        login_events = SecurityEvent.objects.filter(
            user=request.user,
            event_type__in=['LOGIN_SUCCESS', 'LOGIN_FAILED']
        ).order_by('-created_at')[:20]
        
        # Check for suspicious activity
        suspicious_activity = self.check_suspicious_activity(request.user)
        
        return Response({
            'two_fa_enabled': two_fa_enabled,
            'backup_codes_count': backup_codes_count,
            'recent_events': [
                {
                    'event_type': event.event_type,
                    'ip_address': event.ip_address,
                    'created_at': event.created_at.isoformat(),
                    'details': event.details
                } for event in recent_events
            ],
            'login_history': [
                {
                    'event_type': event.event_type,
                    'ip_address': event.ip_address,
                    'created_at': event.created_at.isoformat(),
                    'user_agent': event.user_agent
                } for event in login_events
            ],
            'suspicious_activity': suspicious_activity
        })
    
    def check_suspicious_activity(self, user):
        """Check for suspicious activity patterns"""
        from datetime import timedelta
        
        # Check for multiple failed logins
        recent_failed_logins = SecurityEvent.objects.filter(
            user=user,
            event_type='LOGIN_FAILED',
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        # Check for logins from different IPs
        recent_logins = SecurityEvent.objects.filter(
            user=user,
            event_type='LOGIN_SUCCESS',
            created_at__gte=timezone.now() - timedelta(days=7)
        )
        
        unique_ips = set(event.ip_address for event in recent_logins)
        
        suspicious = {
            'multiple_failed_logins': recent_failed_logins > 5,
            'multiple_ip_addresses': len(unique_ips) > 3,
            'failed_login_count': recent_failed_logins,
            'unique_ip_count': len(unique_ips)
        }
        
        return suspicious

class PasswordSecurityView(APIView):
    """Enhanced password security"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [StrictRateLimitThrottle]
    
    def post(self, request):
        """Change password with enhanced security"""
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({'error': 'Current and new passwords are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Verify current password
        if not check_password(current_password, request.user.password):
            # Log failed password change attempt
            SecurityEvent.objects.create(
                user=request.user,
                event_type='PASSWORD_CHANGE_FAILED',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={'reason': 'invalid_current_password'}
            )
            return Response({'error': 'Invalid current password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check password strength
        password_strength = self.check_password_strength(new_password)
        if password_strength['score'] < 3:
            return Response({
                'error': 'Password is too weak',
                'requirements': password_strength['requirements']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if password was recently used
        if self.is_password_recently_used(request.user, new_password):
            return Response({'error': 'Password was recently used'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Change password
        request.user.set_password(new_password)
        request.user.save()
        
        # Log successful password change
        SecurityEvent.objects.create(
            user=request.user,
            event_type='PASSWORD_CHANGE',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'password_strength': password_strength['score']}
        )
        
        return Response({'message': 'Password changed successfully'})
    
    def check_password_strength(self, password):
        """Check password strength"""
        requirements = {
            'length': len(password) >= 8,
            'uppercase': any(c.isupper() for c in password),
            'lowercase': any(c.islower() for c in password),
            'digits': any(c.isdigit() for c in password),
            'special': any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
        }
        
        score = sum(requirements.values())
        
        return {
            'score': score,
            'requirements': requirements
        }
    
    def is_password_recently_used(self, user, password):
        """Check if password was recently used (simplified)"""
        # In a real implementation, you would store password hashes
        # and check against recent ones
        return False

class SecurityMiddleware:
    """Custom security middleware"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log security events
        self.log_request(request)
        
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
    
    def log_request(self, request):
        """Log security-relevant requests"""
        if request.path.startswith('/api/'):
            # Log API requests for security monitoring
            pass

def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
