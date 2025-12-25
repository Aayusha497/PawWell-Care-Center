from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid
from datetime import timedelta


class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    for authentication instead of username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.
        """
        if not email:
            raise ValueError(_('The Email field must be set'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('email_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that uses email instead of username for authentication.
    Supports different user types: Pet Owner, Admin, and Staff.
    """
    
    USER_TYPE_CHOICES = [
        ('pet_owner', 'Pet Owner'),
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    ]
    
    # Primary fields
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True, null=True)
    user_type = models.CharField(
        _('user type'),
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='pet_owner'
    )
    
    # Profile
    profile_picture = models.ImageField(
        _('profile picture'),
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )
    
    # Status fields
    email_verified = models.BooleanField(_('email verified'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    
    # Timestamps
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    last_login = models.DateTimeField(_('last login'), blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-date_joined']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = f'{self.first_name} {self.last_name}'
        return full_name.strip()
    
    def get_short_name(self):
        """
        Return the short name for the user.
        """
        return self.first_name


class EmailVerification(models.Model):
    """
    Model to handle email verification tokens.
    Tokens expire after 24 hours.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verifications'
    )
    token = models.UUIDField(_('verification token'), default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    is_verified = models.BooleanField(_('is verified'), default=False)
    expires_at = models.DateTimeField(_('expires at'))
    
    class Meta:
        verbose_name = _('email verification')
        verbose_name_plural = _('email verifications')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Verification for {self.user.email}'
    
    def save(self, *args, **kwargs):
        """
        Override save to automatically set expiration time to 24 hours from creation.
        """
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """
        Check if the verification token has expired.
        """
        return timezone.now() > self.expires_at
    
    def verify(self):
        """
        Mark the token as verified and update the user's email_verified status.
        """
        if not self.is_expired():
            self.is_verified = True
            self.user.email_verified = True
            self.user.save()
            self.save()
            return True
        return False


class PasswordReset(models.Model):
    """
    Model to handle password reset tokens.
    Tokens expire after 1 hour and can only be used once.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_resets'
    )
    token = models.UUIDField(_('reset token'), default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    is_used = models.BooleanField(_('is used'), default=False)
    expires_at = models.DateTimeField(_('expires at'))
    
    class Meta:
        verbose_name = _('password reset')
        verbose_name_plural = _('password resets')
        ordering = ['-created_at']
    
    def __str__(self):
        return f'Password reset for {self.user.email}'
    
    def save(self, *args, **kwargs):
        """
        Override save to automatically set expiration time to 1 hour from creation.
        """
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """
        Check if the reset token has expired.
        """
        return timezone.now() > self.expires_at
    
    def can_reset(self):
        """
        Check if the token can be used for password reset.
        """
        return not self.is_used and not self.is_expired()
