"""
accounts/views.py
Authentication views: register, login, logout, profile, password change, admin user management.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiResponse
from django.contrib.auth import get_user_model

from .serializers import (
    UserRegistrationSerializer, UserProfileSerializer,
    AdminUserSerializer, ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdminUser, IsCitizenUser
from .throttles import AuthRateThrottle

User = get_user_model()


def success_response(data=None, message="", status_code=status.HTTP_200_OK):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=status_code)


# ─── Registration ─────────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Register a new citizen account")
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Auto-issue tokens on registration
        refresh = RefreshToken.for_user(user)
        return success_response(
            data={
                "user": UserProfileSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            message="Account created successfully.",
            status_code=status.HTTP_201_CREATED,
        )


# ─── Login ────────────────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Login and receive JWT tokens")
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        return success_response(
            data={
                "tokens": {"access": data["access"], "refresh": data["refresh"]},
                "user": data["user"],
            },
            message="Login successful.",
        )


# ─── Token Refresh ────────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Refresh access token")
class TokenRefreshExtendedView(TokenRefreshView):
    pass


# ─── Logout ───────────────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Logout – blacklist refresh token")
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": "Refresh token is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_TOKEN", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return success_response(message="Logged out successfully.")


# ─── Profile ──────────────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Get or update own profile")
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


# ─── Change Password ──────────────────────────────────────────────────────────

@extend_schema(tags=["auth"], summary="Change own password")
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": "Old password is incorrect."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return success_response(message="Password changed successfully.")


# ─── Admin: User Management ───────────────────────────────────────────────────

@extend_schema(tags=["admin"], summary="List all users (Admin only)")
class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")


@extend_schema(tags=["admin"], summary="Get, update, or deactivate a user (Admin only)")
class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=["admin"], summary="Deactivate a user account (Admin only)")
class AdminDeactivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": "User not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        user.is_active = False
        user.save()
        return success_response(message=f"User {user.email} has been deactivated.")
