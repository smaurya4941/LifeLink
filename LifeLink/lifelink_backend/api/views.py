from django.shortcuts import render, get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from datetime import date, timedelta
import math
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import (
    UserRegisterSerializer, UserSerializer, MyTokenObtainPairSerializer,
    DonorSerializer, DonorCreateSerializer, BloodRequestSerializer, 
    BloodRequestCreateSerializer, DonationHistorySerializer,
    DonorRecipientMatchSerializer, MatchUpdateSerializer, NotificationSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,RecipientSerializer,RecipientCreateSerializer    
)
from core.models import (
    Donor, BloodRequest, DonationHistory, 
    DonorRecipientMatch, Notification, User,Recipient
)
from .ml_matching import matching_engine

# Authentication Views
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny] 
    serializer_class = MyTokenObtainPairSerializer

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
# Donor Views
class DonorViewSet(viewsets.ModelViewSet):
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = Donor.objects.all()
        if self.request.user.is_donor:
            qs = qs.filter(user=self.request.user)
        # ensure deterministic pagination order
        return qs.order_by('-updated_at', '-created_at')
    
    def _update_user_location(self, request, enforce_role=False, role_flag='is_donor'):
        user = request.user
        updates = []

        def parse_coord(value):
            if value in (None, '', 'null', 'None'):
                return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        if 'latitude' in request.data:
            lat_val = parse_coord(request.data.get('latitude'))
            user.latitude = lat_val
            updates.append('latitude')
        if 'longitude' in request.data:
            lng_val = parse_coord(request.data.get('longitude'))
            user.longitude = lng_val
            updates.append('longitude')

        if enforce_role and not getattr(user, role_flag):
            setattr(user, role_flag, True)
            updates.append(role_flag)

        if updates:
            user.save(update_fields=updates)

    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update':
            return DonorCreateSerializer
        return DonorSerializer
    
    def _clean_payload(self, request):
        data = request.data.copy()
        data.pop('latitude', None)
        data.pop('longitude', None)
        return data

    def create(self, request, *args, **kwargs):
        """Create donor profile if not exists; otherwise update existing for current user.
        This avoids UNIQUE user constraint violations on the OneToOne relation.
        """
        existing = Donor.objects.filter(user=request.user).first()
        if existing:
            payload = self._clean_payload(request)
            serializer = DonorCreateSerializer(existing, data=payload, partial=True)
            serializer.is_valid(raise_exception=True)
            self._update_user_location(request)
            self.perform_update(serializer)
            # return full donor representation
            read = DonorSerializer(existing)
            return Response(read.data, status=status.HTTP_200_OK)
        # normal create path
        payload = self._clean_payload(request)
        write_serializer = DonorCreateSerializer(data=payload)
        write_serializer.is_valid(raise_exception=True)
        self._update_user_location(request, enforce_role=True)
        donor = write_serializer.save(user=request.user)
        read = DonorSerializer(donor)
        headers = self.get_success_headers(read.data)
        return Response(read.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        self._update_user_location(self.request)
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def available_donors(self, request):
        """Get all available donors for matching"""
        blood_group = request.query_params.get('blood_group')
        city = request.query_params.get('city')
        
        queryset = Donor.objects.filter(availability=True, can_donate=True)
        
        if blood_group:
            queryset = queryset.filter(blood_group=blood_group)
        if city:
            queryset = queryset.filter(city__icontains=city)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Blood Request Views
class BloodRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BloodRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_recipient:
            return BloodRequest.objects.filter(user=self.request.user)
        return BloodRequest.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'update':
            return BloodRequestCreateSerializer
        return BloodRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Update user role
        self.request.user.is_recipient = True
        self.request.user.save()
    
    @action(detail=True, methods=['post'])
    def find_matches(self, request, pk=None):
        """Find matching donors for a blood request using advanced ML"""
        blood_request = self.get_object()
        
        # if blood_request.user != request.user:
        #     return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Use advanced ML matching engine
        matches = matching_engine.find_optimal_matches(blood_request, max_matches=15)
        
        created_matches = []
        
        # Create match records with detailed scoring
        for match_data in matches:
            donor = match_data['donor']
            scores = match_data['scores']
            success_probability = match_data['success_probability']
            health_risk = match_data['health_risk']
            
            # Create or update match record
            match, created = DonorRecipientMatch.objects.get_or_create(
                donor=donor,
                blood_request=blood_request,
                defaults={
                    'matching_score': scores['overall_score'],
                    'notes': f"Success Probability: {success_probability:.2f}, Health Risk: {health_risk:.2f}"
                }
            )
            
            if not created:
                match.matching_score = scores['overall_score']
                match.notes = f"Success Probability: {success_probability:.2f}, Health Risk: {health_risk:.2f}"
                match.save()
            
            # Create notification for donor with enhanced details
            Notification.objects.create(
                user=donor.user,
                notification_type='MATCH_FOUND',
                title=f'New Blood Request Match - {scores["overall_score"]:.1%} Match',
                message=f'You have been matched with a blood request for {blood_request.patient_name}. '
                       f'Match Score: {scores["overall_score"]:.1%}, Success Probability: {success_probability:.1%}',
                related_request=blood_request,
                related_match=match
            )
            
            created_matches.append({
                'match_id': match.id,
                'donor_id': donor.id,
                'donor_name': donor.user.username,
                'blood_group': donor.blood_group,
                'overall_score': scores['overall_score'],
                'success_probability': success_probability,
                'health_risk': health_risk,
                'distance_km': match_data['distance_km'],
                'scores_breakdown': scores
            })
        
        return Response({
            'matches_found': len(matches),
            'matches': created_matches,
            'request_id': str(blood_request.id)
        })
    
    @action(detail=True, methods=['post'])
    def confirm_donor(self, request, pk=None):
        """
        Confirm a donor for a blood request (Recipient confirms which donor they want to work with)
        
        Expected POST data:
        {
            "donor_id": <donor_id>,
            "confirmation_notes": "Optional notes about the confirmation"
        }
        """
        from django.utils import timezone
        
        blood_request = self.get_object()
        
        # Only the request owner can confirm a donor
        if blood_request.user != request.user:
            return Response(
                {'error': 'Permission denied. Only the request owner can confirm a donor.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        donor_id = request.data.get('donor_id')
        if not donor_id:
            return Response(
                {'error': 'donor_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            donor = Donor.objects.get(id=donor_id)
        except Donor.DoesNotExist:
            return Response(
                {'error': 'Donor not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if there's a match for this donor and request
        match = DonorRecipientMatch.objects.filter(
            donor=donor, 
            blood_request=blood_request,
            status='ACCEPTED'
        ).first()
        
        if not match:
            return Response(
                {'error': 'This donor has not been matched or has not accepted the request yet'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update blood request with confirmed donor
        blood_request.confirmed_donor = donor
        blood_request.confirmation_date = timezone.now()
        blood_request.confirmation_notes = request.data.get('confirmation_notes', '')
        blood_request.status = 'CONFIRMED'
        blood_request.save()
        
        # Update match status to completed
        match.status = 'COMPLETED'
        match.save()
        
        # Create notification for the donor
        Notification.objects.create(
            user=donor.user,
            notification_type='DONOR_CONFIRMED',
            title='Your Donation Has Been Confirmed',
            message=f'Your donation for {blood_request.patient_name} has been confirmed by the recipient. '
                   f'Please prepare for donation on {blood_request.required_date}.',
            related_request=blood_request,
            related_match=match
        )
        
        # Create notification for recipient
        Notification.objects.create(
            user=blood_request.user,
            notification_type='DONOR_CONFIRMED',
            title='Donor Confirmed Successfully',
            message=f'You have confirmed {donor.user.username} as your donor. '
                   f'Contact details will be shared shortly.',
            related_request=blood_request,
            related_match=match
        )
        
        return Response({
            'status': 'Donor confirmed successfully',
            'blood_request': BloodRequestSerializer(blood_request).data,
            'donor': DonorSerializer(donor).data
        })
   
    def find_donor_matches(self, blood_request):
        """ML-based donor matching algorithm"""
        compatibility = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-']
        }

        compatible_groups = compatibility.get(blood_request.blood_group, [])

        # Correct filter replacing `can_donate`
        eligible_donors = Donor.objects.filter(
            blood_group__in=compatible_groups,
            availability=True
        ).filter(
            Q(last_donation_date__lte=date.today() - timedelta(days=90)) | Q(last_donation_date__isnull=True)
        )

        matches = []
        for donor in eligible_donors:
            score = self.calculate_matching_score(donor, blood_request)
            if score > 0.3:  # Minimum threshold
                matches.append({'donor': donor, 'score': score})

        # Sort by score (highest first)
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:10]


    def calculate_matching_score(self, donor, blood_request):
        """Calculate matching score based on multiple factors"""
        score = 0.0
        
        # Blood group compatibility (40% weight)
        if donor.blood_group == blood_request.blood_group:
            score += 0.4
        elif donor.blood_group in ['O-', 'O+']:  # Universal donors
            score += 0.35
        else:
            score += 0.3
        
        # Location proximity (25% weight)
        if donor.city.lower() == blood_request.city.lower():
            score += 0.25
        elif donor.state.lower() == blood_request.state.lower():
            score += 0.15
        
        # Urgency factor (20% weight)
        urgency_weights = {'CRITICAL': 0.2, 'HIGH': 0.15, 'MEDIUM': 0.1, 'LOW': 0.05}
        score += urgency_weights.get(blood_request.urgency, 0.1)
        
        # Donor verification (10% weight)
        if donor.is_verified:
            score += 0.1
        
        # Recent activity (5% weight)
        if donor.last_donation_date:
            days_since_donation = (date.today() - donor.last_donation_date).days
            if days_since_donation > 90:  # Can donate
                score += 0.05
        
        return min(score, 1.0)  # Cap at 1.0
    
#Recipient

# views.py

class RecipientViewSet(viewsets.ModelViewSet):
    serializer_class = RecipientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_recipient:
            return Recipient.objects.filter(user=self.request.user).order_by('-updated_at', '-created_at')
        return Recipient.objects.all().order_by('-updated_at', '-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipientCreateSerializer
        return RecipientSerializer

    def _clean_payload(self, request):
        data = request.data.copy()
        data.pop('latitude', None)
        data.pop('longitude', None)
        return data

    def _update_user_location(self, request, enforce_role=False, role_flag='is_recipient'):
        user = request.user
        updates = []

        def parse_coord(value):
            if value in (None, '', 'null', 'None'):
                return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        if 'latitude' in request.data:
            lat_val = parse_coord(request.data.get('latitude'))
            user.latitude = lat_val
            updates.append('latitude')
        if 'longitude' in request.data:
            lng_val = parse_coord(request.data.get('longitude'))
            user.longitude = lng_val
            updates.append('longitude')

        if enforce_role and not getattr(user, role_flag):
            setattr(user, role_flag, True)
            updates.append(role_flag)

        if updates:
            user.save(update_fields=updates)

    def create(self, request, *args, **kwargs):
        existing = Recipient.objects.filter(user=request.user).first()
        if existing:
            payload = self._clean_payload(request)
            serializer = RecipientCreateSerializer(existing, data=payload, partial=True)
            serializer.is_valid(raise_exception=True)
            self._update_user_location(request)
            self.perform_update(serializer)
            read = RecipientSerializer(existing)
            return Response(read.data, status=status.HTTP_200_OK)

        payload = self._clean_payload(request)
        serializer = RecipientCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self._update_user_location(request, enforce_role=True)
        recipient = serializer.save(user=request.user)
        read = RecipientSerializer(recipient)
        headers = self.get_success_headers(read.data)
        return Response(read.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        self._update_user_location(self.request)
        serializer.save()

# Matching Views
class DonorRecipientMatchViewSet(viewsets.ModelViewSet):
    serializer_class = DonorRecipientMatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_donor:
            return DonorRecipientMatch.objects.filter(donor__user=user)
        elif user.is_recipient:
            return DonorRecipientMatch.objects.filter(blood_request__user=user)
        return DonorRecipientMatch.objects.none()
    
    @action(detail=True, methods=['post'])
    def accept_match(self, request, pk=None):
        """
        Accept a match (Donor accepts the blood request)
        After donor accepts, the recipient needs to confirm the donor
        """
        match = self.get_object()
        
        # Only the donor can accept
        if request.user != match.donor.user:
            return Response(
                {'error': 'Only the donor can accept this match'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        match.status = 'ACCEPTED'
        match.save()
        
        # Update blood request status to MATCHED (waiting for recipient confirmation)
        match.blood_request.status = 'MATCHED'
        match.blood_request.save()
        
        # Create notification for recipient
        Notification.objects.create(
            user=match.blood_request.user,
            notification_type='REQUEST_ACCEPTED',
            title='Donor Accepted Your Request',
            message=f'{match.donor.user.username} has accepted your blood request. '
                   f'Please review and confirm this donor.',
            related_request=match.blood_request,
            related_match=match
        )
        
        return Response({
            'status': 'Match accepted',
            'message': 'The recipient will be notified and needs to confirm your participation'
        })
    
    @action(detail=True, methods=['post'])
    def reject_match(self, request, pk=None):
        """Reject a match"""
        match = self.get_object()
        match.status = 'REJECTED'
        match.notes = request.data.get('notes', '')
        match.save()
        
        # Create notification
        Notification.objects.create(
            user=match.blood_request.user,
            notification_type='REQUEST_REJECTED',
            title='Match Rejected',
            message=f'Your blood request was rejected by {match.donor.user.username}',
            related_match=match
        )
        
        return Response({'status': 'Match rejected'})

# Donation History Views
class DonationHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = DonationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_donor:
            return DonationHistory.objects.filter(donor__user=user)
        elif user.is_recipient:
            return DonationHistory.objects.filter(recipient_request__user=user)
        return DonationHistory.objects.none()

# Notification Views
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})

# Dashboard Views
class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        data = {
            'user': UserSerializer(user).data,
            'stats': {}
        }
        
        if user.is_donor:
            donor = get_object_or_404(Donor, user=user)
            data['donor_profile'] = DonorSerializer(donor).data
            data['stats'] = {
                'total_donations': DonationHistory.objects.filter(donor=donor).count(),
                'pending_matches': DonorRecipientMatch.objects.filter(donor=donor, status='PENDING').count(),
                'accepted_matches': DonorRecipientMatch.objects.filter(donor=donor, status='ACCEPTED').count(),
            }
        
        if user.is_recipient:
            data['stats'].update({
                'total_requests': BloodRequest.objects.filter(user=user).count(),
                'pending_requests': BloodRequest.objects.filter(user=user, status='PENDING').count(),
                'matched_requests': BloodRequest.objects.filter(user=user, status='MATCHED').count(),
            })
        
        data['unread_notifications'] = Notification.objects.filter(user=user, is_read=False).count()
        
        return Response(data)
    


#Password



class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user_model = get_user_model()
        try:
            user = user_model.objects.get(email__iexact=email)
        except user_model.DoesNotExist:
            # Always respond success — don’t reveal whether user exists
            return Response({"detail": "If that email exists, a reset link has been sent."})

        # Generate UID and token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Create reset URL (adjust front-end URL in settings)
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
        reset_link = f"{frontend_base}/reset-password?uid={uid}&token={token}"

        subject = "LifeLink Password Reset"
        message = (
            f"Hello {user.username},\n\n"
            f"Use the link below to reset your password. This link will expire soon.\n\n"
            f"{reset_link}\n\n"
            "If you did not request a password reset, you can ignore this email.\n\n"
            "Thanks,\nLifeLink Team"
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@lifelink.local")

        try:
            send_mail(subject, message, from_email, [user.email], fail_silently=False)
        except Exception:
            pass

        return Response({"detail": "If that email exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password has been reset successfully."})


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Location-based views
class NearbyDonorsView(APIView):
    """
    Find nearby donors within a specified radius.
    
    Query parameters:
    - lat: latitude (required)
    - lon: longitude (required)
    - radius: radius in kilometers (default: 50)
    - blood_group: filter by blood group (optional)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from core.location_utils import get_nearby_donors
        
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius = request.query_params.get('radius', 50)
        blood_group = request.query_params.get('blood_group')
        
        if not lat or not lon:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lon = float(lon)
            radius = float(radius)
        except ValueError:
            return Response(
                {'error': 'Invalid coordinates or radius'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        nearby_donors = get_nearby_donors(lat, lon, radius_km=radius)
        
        # Filter by blood group if provided
        if blood_group:
            nearby_donors = [d for d in nearby_donors if d.blood_group == blood_group]
        
        serializer = DonorSerializer(nearby_donors, many=True)
        return Response({
            'count': len(nearby_donors),
            'results': serializer.data
        })


class NearbyBloodRequestsView(APIView):
    """
    Find nearby blood requests within a specified radius.
    
    Query parameters:
    - lat: latitude (required)
    - lon: longitude (required)
    - radius: radius in kilometers (default: 50)
    - blood_group: filter by blood group (optional)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from core.location_utils import get_nearby_blood_requests
        
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        radius = request.query_params.get('radius', 50)
        blood_group = request.query_params.get('blood_group')
        
        if not lat or not lon:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lon = float(lon)
            radius = float(radius)
        except ValueError:
            return Response(
                {'error': 'Invalid coordinates or radius'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        nearby_requests = get_nearby_blood_requests(lat, lon, radius_km=radius)
        
        # Filter by blood group if provided
        if blood_group:
            nearby_requests = [r for r in nearby_requests if r.blood_group == blood_group]
        
        serializer = BloodRequestSerializer(nearby_requests, many=True)
        return Response({
            'count': len(nearby_requests),
            'results': serializer.data
        })