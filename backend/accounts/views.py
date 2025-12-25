"""
Views for PawWell Care Center authentication system.
Handles user registration, login, email verification, password reset, and user profile.
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta
from django.conf import settings

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserProfileSerializer,
    LoginResponseSerializer
)
from .models import EmailVerification, PasswordReset
from .utils import (
    send_verification_email,
    send_welcome_email,
    send_password_reset_email,
    send_password_changed_email
)

User = get_user_model()


class UserRegistrationView(APIView):
    """
    API endpoint for user registration.
    
    POST /api/accounts/register/
    
    Creates a new user account and sends email verification link.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            # Create user
            user = serializer.save()
            
            # Generate verification token
            verification = EmailVerification.objects.create(user=user)
            
            # Send verification email
            email_sent = send_verification_email(user, verification.token)
            
            return Response({
                'success': True,
                'message': 'Registration successful! Please check your email to verify your account.',
                'email': user.email,
                'email_sent': email_sent,
                'instructions': 'Check your email inbox and click the verification link to activate your account.'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """
    API endpoint for email verification.
    
    GET /api/accounts/verify-email/<token>/
    
    Verifies user email using the token sent to their email.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        try:
            # Get verification record
            verification = EmailVerification.objects.get(token=token)
            
            # Check if already verified
            if verification.is_verified:
                return Response({
                    'success': False,
                    'message': 'Email already verified. You can now login.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if expired
            if verification.is_expired():
                return Response({
                    'success': False,
                    'message': 'Verification link has expired. Please register again or request a new verification link.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify email
            verification.is_verified = True
            verification.user.email_verified = True
            verification.user.is_active = True
            verification.user.save()
            verification.save()
            
            # Send welcome email
            send_welcome_email(verification.user)
            
            return Response({
                'success': True,
                'message': 'Email verified successfully! You can now login to your account.',
                'email': verification.user.email
            }, status=status.HTTP_200_OK)
            
        except EmailVerification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid verification token.'
            }, status=status.HTTP_404_NOT_FOUND)


class UserLoginView(APIView):
    """
    API endpoint for user login.
    
    POST /api/accounts/login/
    
    Authenticates user and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if email is verified
        if not user.email_verified:
            return Response({
                'success': False,
                'message': 'Please verify your email before logging in. Check your inbox for the verification link.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if account is active
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Your account has been deactivated. Please contact support.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verify password
        if not user.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Calculate token expiry times
        access_token_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=60))
        refresh_token_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=1))
        
        access_expiry = timezone.now() + access_token_lifetime
        refresh_expiry = timezone.now() + refresh_token_lifetime
        
        # Prepare user data
        user_serializer = UserProfileSerializer(user)
        
        return Response({
            'success': True,
            'message': 'Login successful!',
            'access': access_token,
            'refresh': refresh_token,
            'user': user_serializer.data,
            'access_token_expiry': access_expiry,
            'refresh_token_expiry': refresh_expiry
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """
    API endpoint for forgot password request.
    
    POST /api/accounts/forgot-password/
    
    Sends password reset link to user's email.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        # Check if user exists (but don't reveal in response for security)
        try:
            user = User.objects.get(email=email)
            
            # Create password reset token
            reset = PasswordReset.objects.create(user=user)
            
            # Send password reset email
            send_password_reset_email(user, reset.token)
            
        except User.DoesNotExist:
            # Don't reveal if email doesn't exist (security best practice)
            pass
        
        # Always return success message
        return Response({
            'success': True,
            'message': 'If an account exists with this email, you will receive a password reset link shortly.',
            'instructions': 'Please check your email inbox and spam folder.'
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    API endpoint for password reset.
    
    POST /api/accounts/reset-password/
    
    Resets user password using the token sent to their email.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Get password reset record
            reset = PasswordReset.objects.get(token=token)
            
            # Check if already used
            if reset.is_used:
                return Response({
                    'success': False,
                    'message': 'This password reset link has already been used.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if expired
            if reset.is_expired():
                return Response({
                    'success': False,
                    'message': 'This password reset link has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update password
            user = reset.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset.is_used = True
            reset.save()
            
            # Send confirmation email
            send_password_changed_email(user)
            
            return Response({
                'success': True,
                'message': 'Password reset successful! You can now login with your new password.'
            }, status=status.HTTP_200_OK)
            
        except PasswordReset.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid password reset token.'
            }, status=status.HTTP_404_NOT_FOUND)


class UserProfileView(APIView):
    """
    API endpoint for user profile.
    
    GET /api/accounts/profile/
    
    Returns current user's profile data.
    Requires authentication (JWT token in header).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        
        return Response({
            'success': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    API endpoint for refreshing access tokens.
    
    POST /api/accounts/token/refresh/
    
    Returns a new access token using a valid refresh token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            # Add expiry time to response
            access_token_lifetime = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=60))
            access_expiry = timezone.now() + access_token_lifetime
            
            response.data['access_token_expiry'] = access_expiry
            response.data['success'] = True
            
            return response
            
        except (TokenError, InvalidToken) as e:
            return Response({
                'success': False,
                'message': 'Invalid or expired refresh token.',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    API endpoint for user logout.
    
    POST /api/accounts/logout/
    
    Blacklists the refresh token (requires token blacklist app).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response({
                    'success': False,
                    'message': 'Refresh token is required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Blacklist the token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'success': True,
                'message': 'Logout successful.'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred during logout.',
                'detail': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationEmailView(APIView):
    """
    API endpoint to resend verification email.
    
    POST /api/accounts/resend-verification/
    
    Sends a new verification email to unverified users.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'message': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email.lower().strip())
            
            if user.email_verified:
                return Response({
                    'success': False,
                    'message': 'Email is already verified. You can login.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Delete old verification tokens
            EmailVerification.objects.filter(user=user).delete()
            
            # Create new verification token
            verification = EmailVerification.objects.create(user=user)
            
            # Send verification email
            email_sent = send_verification_email(user, verification.token)
            
            return Response({
                'success': True,
                'message': 'Verification email sent successfully!',
                'email': user.email,
                'email_sent': email_sent
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Don't reveal if email doesn't exist
            return Response({
                'success': True,
                'message': 'If an account exists with this email, you will receive a verification link shortly.'
            }, status=status.HTTP_200_OK)
