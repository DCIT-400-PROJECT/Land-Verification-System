"""
accounts/models.py
Custom User model with UUID primary key, national ID, and role-based access.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    CITIZEN = "citizen", "Citizen"
    ADMIN = "admin", "Admin"


class UserManager(BaseUserManager):
    def create_user(self, email, national_id, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        if not national_id:
            raise ValueError("National ID is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", UserRole.CITIZEN)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, national_id=national_id, **extra_fields)
        user.set_password(password)  # PBKDF2-SHA256 via Django's hasher
        user.save(using=self._db)
        return user

    def create_superuser(self, email, national_id, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, national_id, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model.
    - UUID primary key
    - national_id: unique citizen identifier (Ghana Card / Student ID)
    - role: citizen | admin
    - password is PBKDF2-SHA256 hashed by Django automatically
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    national_id = models.CharField(max_length=30, unique=True, db_index=True,
                                   help_text="Ghana Card number or institution-issued ID")
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.CITIZEN)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Django admin access

    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["national_id", "full_name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.full_name} <{self.email}> [{self.role}]"

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_citizen(self):
        return self.role == UserRole.CITIZEN
