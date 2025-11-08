# Creating serializers for all the models
from rest_framework import serializers
from core.models import (
    Donor, BloodRequest, DonationHistory, 
    DonorRecipientMatch, Notification, User,Recipient
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model


# User serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                'phone_number', 'date_of_birth', 'is_donor', 'is_recipient', 
                'latitude', 'longitude', 'address', 'city', 'traditional_state', 
                'pincode', 'country', 'created_at']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 
                 'first_name', 'last_name', 'phone_number', 'date_of_birth', 
                 'is_donor', 'is_recipient', 'latitude', 'longitude', 'address', 
                 'city', 'traditional_state', 'pincode', 'country']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

# Donor serializers
class DonorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    can_donate = serializers.ReadOnlyField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    
    class Meta:
        model = Donor
        fields = ['id', 'user', 'blood_group', 'address', 'city', 'state', 
                 'pincode', 'availability', 'last_donation_date', 'weight', 
                 'height', 'medical_conditions', 'emergency_contact', 
                 'matching_score', 'is_verified', 'can_donate', 'created_at', 'updated_at',
                 'latitude', 'longitude']
    
    def get_latitude(self, obj):
        return obj.user.latitude if obj.user else None
    
    def get_longitude(self, obj):
        return obj.user.longitude if obj.user else None

class DonorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = ['blood_group', 'address', 'city', 'state', 'pincode', 
                 'weight', 'height', 'medical_conditions', 'emergency_contact']
        extra_kwargs = {
            'address': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'state': {'required': False, 'allow_blank': True},
            'pincode': {'required': False, 'allow_blank': True},
            'weight': {'required': False, 'allow_null': True},
            'height': {'required': False, 'allow_null': True},
            'medical_conditions': {'required': False, 'allow_blank': True},
            'emergency_contact': {'required': False, 'allow_blank': True},
        }

# Blood request serializers
class BloodRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    
    class Meta:
        model = BloodRequest
        fields = ['id', 'user', 'patient_name', 'blood_group', 'units_required', 
                 'urgency', 'hospital_name', 'hospital_address', 'city', 'state', 
                 'pincode', 'contact_person', 'contact_phone', 'required_date', 
                 'status', 'description', 'confirmed_donor', 'confirmation_date', 
                 'confirmation_notes', 'created_at', 'updated_at', 'latitude', 'longitude']
    
    def get_latitude(self, obj):
        return obj.user.latitude if obj.user else None
    
    def get_longitude(self, obj):
        return obj.user.longitude if obj.user else None

class BloodRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodRequest
        fields = ['patient_name', 'blood_group', 'units_required', 'urgency', 
                 'hospital_name', 'hospital_address', 'city', 'state', 'pincode', 
                 'contact_person', 'contact_phone', 'required_date', 'description']

#Recipint
# serializers.py

class RecipientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)  # nest user details

    class Meta:
        model = Recipient
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class RecipientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipient
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

# Donation history serializers
class DonationHistorySerializer(serializers.ModelSerializer):
    donor = DonorSerializer(read_only=True)
    recipient_request = BloodRequestSerializer(read_only=True)
    
    class Meta:
        model = DonationHistory
        fields = ['id', 'donor', 'recipient_request', 'donation_date', 
                 'units_donated', 'is_successful', 'notes']

# Matching serializers
class DonorRecipientMatchSerializer(serializers.ModelSerializer):
    donor = DonorSerializer(read_only=True)
    blood_request = BloodRequestSerializer(read_only=True)
    
    class Meta:
        model = DonorRecipientMatch
        fields = ['id', 'donor', 'blood_request', 'matching_score', 'status', 
                 'created_at', 'updated_at', 'notes']

class MatchUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorRecipientMatch
        fields = ['status', 'notes']

# Notification serializers
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 
                 'created_at', 'related_request', 'related_match']

# Custom login serializer (adding extra info to token)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['is_donor'] = user.is_donor
        token['is_recipient'] = user.is_recipient
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
    
#passwords reset


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        """
        Always return success regardless of whether email exists.
        Prevents user enumeration attacks.
        """
        user_model = get_user_model()
        if not user_model.objects.filter(email__iexact=value).exists():
            # Do not raise error — just silently ignore.
            return value
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        uid = attrs.get("uid")
        token = attrs.get("token")

        try:
            uid_int = force_str(urlsafe_base64_decode(uid))
            user = get_user_model().objects.get(pk=uid_int)
        except Exception:
            raise serializers.ValidationError({"uid": "Invalid UID."})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({"token": "Invalid or expired token."})

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save()
        return user
