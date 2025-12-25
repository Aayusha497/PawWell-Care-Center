"""
Serializers for PawWell Care Center authentication system.
Handles validation and serialization for user registration, login, password reset, etc.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import re

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Validates email, password, and user details.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'phone_number',
            'user_type'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': False},
        }
    
    def validate_email(self, value):
        """
        Validate email format and check if already exists.
        """
        value = value.lower().strip()
        
        # Check if email already exists
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        
        # Basic email format validation (Django already does this, but adding extra check)
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError(
                "Enter a valid email address."
            )
        
        return value
    
    def validate_password(self, value):
        """
        Validate password strength:
        - Minimum 8 characters
        - Contains at least one letter
        - Contains at least one number
        """
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one letter."
            )
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )
        
        return value
    
    def validate_phone_number(self, value):
        """
        Validate phone number format (optional field).
        """
        if value:
            # Remove common separators
            cleaned = re.sub(r'[\s\-\(\)]', '', value)
            
            # Check if it contains only digits and + (for international)
            if not re.match(r'^\+?[\d]{10,15}$', cleaned):
                raise serializers.ValidationError(
                    "Enter a valid phone number (10-15 digits)."
                )
        
        return value
    
    def validate(self, attrs):
        """
        Validate that passwords match.
        """
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create user with hashed password.
        """
        # Remove confirm_password as it's not a model field
        validated_data.pop('confirm_password')
        
        # Create user with inactive status until email is verified
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            user_type=validated_data.get('user_type', 'pet_owner'),
            is_active=False,  # Inactive until email verified
            email_verified=False
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_email(self, value):
        """
        Normalize email to lowercase.
        """
        return value.lower().strip()
    
    def validate_password(self, value):
        """
        Ensure password is not empty.
        """
        if not value or value.strip() == '':
            raise serializers.ValidationError("Password cannot be empty.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for forgot password request.
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """
        Normalize email to lowercase.
        """
        return value.lower().strip()


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for password reset.
    """
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_new_password(self, value):
        """
        Validate password strength:
        - Minimum 8 characters
        - Contains at least one letter
        - Contains at least one number
        """
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long."
            )
        
        if not re.search(r'[A-Za-z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one letter."
            )
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )
        
        return value
    
    def validate(self, attrs):
        """
        Validate that passwords match.
        """
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile.
    Returns user data (excluding password).
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone_number',
            'user_type',
            'profile_picture',
            'email_verified',
            'is_active',
            'date_joined',
            'last_login'
        ]
        read_only_fields = [
            'id',
            'email',
            'email_verified',
            'is_active',
            'date_joined',
            'last_login'
        ]
    
    def get_full_name(self, obj):
        """
        Get user's full name.
        """
        return obj.get_full_name()


class TokenRefreshResponseSerializer(serializers.Serializer):
    """
    Serializer for token refresh response.
    """
    access = serializers.CharField()
    access_token_expiry = serializers.DateTimeField()


class LoginResponseSerializer(serializers.Serializer):
    """
    Serializer for login response with tokens and user data.
    """
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserProfileSerializer()
    access_token_expiry = serializers.DateTimeField()
    refresh_token_expiry = serializers.DateTimeField()
