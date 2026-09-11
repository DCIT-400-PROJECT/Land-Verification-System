"""
accounts/serializers.py
Serializers for user registration, profile, and JWT customisation.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, UserRole


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "id", "email", "national_id", "full_name",
            "phone_number", "password", "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_national_id(self, value):
        if User.objects.filter(national_id=value).exists():
            raise serializers.ValidationError("This National ID is already registered.")
        return value

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        # Run Django's built-in password validators
        try:
            validate_password(data["password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "national_id", "full_name", "phone_number", "role", "date_joined", "last_login"]
        read_only_fields = ["id", "email", "national_id", "role", "date_joined", "last_login"]


class UserPublicSerializer(serializers.ModelSerializer):
    """Minimal public representation used inside nested serializers."""
    class Meta:
        model = User
        fields = ["id", "full_name", "national_id", "role"]


class AdminUserSerializer(serializers.ModelSerializer):
    """Full user details for admin management endpoints."""
    class Meta:
        model = User
        fields = ["id", "email", "national_id", "full_name", "phone_number",
                  "role", "is_active", "date_joined", "last_login"]
        read_only_fields = ["id", "date_joined", "last_login"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    new_password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, data):
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        try:
            validate_password(data["new_password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user role, full_name and national_id to the JWT payload."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        token["national_id"] = user.national_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "full_name": self.user.full_name,
            "national_id": self.user.national_id,
            "role": self.user.role,
        }
        return data
