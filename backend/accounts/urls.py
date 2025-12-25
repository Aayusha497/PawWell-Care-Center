"""
URL configuration for accounts app.
Maps all authentication endpoints.
"""

from django.urls import path
from .views import (
    UserRegistrationView,
    EmailVerificationView,
    UserLoginView,
    ForgotPasswordView,
    ResetPasswordView,
    UserProfileView,
    CustomTokenRefreshView,
    LogoutView,
    ResendVerificationEmailView
)

app_name = 'accounts'

urlpatterns = [
    # Registration
    path('register/', UserRegistrationView.as_view(), name='register'),
    
    # Email verification
    path('verify-email/<uuid:token>/', EmailVerificationView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    
    # Login
    path('login/', UserLoginView.as_view(), name='login'),
    
    # Password reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Token management
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Logout
    path('logout/', LogoutView.as_view(), name='logout'),
]
