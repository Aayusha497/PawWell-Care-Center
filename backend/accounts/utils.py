"""
Email utility functions for PawWell Care Center authentication system.
Handles sending verification emails, welcome emails, and password reset emails.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import uuid


def generate_verification_token():
    """
    Generate a unique UUID4 token for email verification.
    
    Returns:
        UUID: A unique UUID4 token
    """
    return uuid.uuid4()


def send_verification_email(user, token, frontend_url=None):
    """
    Send email verification link to user's email address.
    
    Args:
        user: User instance
        token: UUID token for verification
        frontend_url: Optional frontend URL (defaults to settings.FRONTEND_URL)
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not frontend_url:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    
    verification_link = f"{frontend_url}/verify-email/{token}"
    
    subject = 'Verify Your Email - PawWell Care Center'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Welcome {user.first_name}!</h2>
            <p>Thank you for registering with PawWell Care Center. We're excited to have you join our community!</p>
            <p>To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{verification_link}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4A90E2;">{verification_link}</p>
            <p><strong>Note:</strong> This link will expire in 24 hours.</p>
            <p>If you didn't create an account with PawWell Care Center, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Welcome {user.first_name}!
    
    Thank you for registering with PawWell Care Center.
    
    To complete your registration, please verify your email address by clicking this link:
    {verification_link}
    
    Note: This link will expire in 24 hours.
    
    If you didn't create an account with PawWell Care Center, please ignore this email.
    
    © 2025 PawWell Care Center. All rights reserved.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_welcome_email(user):
    """
    Send welcome email after successful email verification.
    
    Args:
        user: User instance
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = 'Welcome to PawWell Care Center!'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Email Verified Successfully!</h2>
            <p>Hi {user.first_name},</p>
            <p>Your email has been successfully verified! Welcome to the PawWell Care Center family.</p>
            <p>You can now:</p>
            <ul>
                <li>Book appointments for your pets</li>
                <li>Access veterinary services</li>
                <li>Manage your pet profiles</li>
                <li>Track medical records</li>
                <li>And much more!</li>
            </ul>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Thank you for choosing PawWell Care Center!</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Email Verified Successfully!
    
    Hi {user.first_name},
    
    Your email has been successfully verified! Welcome to the PawWell Care Center family.
    
    You can now:
    - Book appointments for your pets
    - Access veterinary services
    - Manage your pet profiles
    - Track medical records
    - And much more!
    
    If you have any questions or need assistance, feel free to reach out to our support team.
    
    Thank you for choosing PawWell Care Center!
    
    © 2025 PawWell Care Center. All rights reserved.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending welcome email: {e}")
        return False


def send_password_reset_email(user, token, frontend_url=None):
    """
    Send password reset link to user's email address.
    
    Args:
        user: User instance
        token: UUID token for password reset
        frontend_url: Optional frontend URL (defaults to settings.FRONTEND_URL)
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not frontend_url:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    
    reset_link = f"{frontend_url}/reset-password/{token}"
    
    subject = 'Password Reset Request - PawWell Care Center'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 10px;
                border-radius: 5px;
                margin: 15px 0;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi {user.first_name},</p>
            <p>We received a request to reset your password for your PawWell Care Center account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4A90E2;">{reset_link}</p>
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>This link can only be used once</li>
                    <li>If you didn't request a password reset, please ignore this email</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Password Reset Request
    
    Hi {user.first_name},
    
    We received a request to reset your password for your PawWell Care Center account.
    
    Click this link to reset your password:
    {reset_link}
    
    Important:
    - This link will expire in 1 hour
    - This link can only be used once
    - If you didn't request a password reset, please ignore this email
    
    © 2025 PawWell Care Center. All rights reserved.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def send_password_changed_email(user):
    """
    Send confirmation email after successful password change.
    
    Args:
        user: User instance
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = 'Password Changed Successfully - PawWell Care Center'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }}
            .success {{
                background-color: #d4edda;
                border: 1px solid #28a745;
                padding: 10px;
                border-radius: 5px;
                margin: 15px 0;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hi {user.first_name},</p>
            <div class="success">
                <p><strong>✓ Your password has been changed successfully!</strong></p>
            </div>
            <p>Your PawWell Care Center account password was recently updated.</p>
            <p>If you made this change, no further action is needed.</p>
            <p><strong>If you didn't change your password:</strong></p>
            <ul>
                <li>Please contact our support team immediately</li>
                <li>Consider changing your password again as a precaution</li>
            </ul>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Password Changed Successfully
    
    Hi {user.first_name},
    
    Your password has been changed successfully!
    
    Your PawWell Care Center account password was recently updated.
    
    If you made this change, no further action is needed.
    
    If you didn't change your password:
    - Please contact our support team immediately
    - Consider changing your password again as a precaution
    
    © 2025 PawWell Care Center. All rights reserved.
    """
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password changed email: {e}")
        return False
