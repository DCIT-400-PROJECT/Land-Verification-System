"""
accounts/urls.py
"""
from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, TokenRefreshExtendedView,
    ProfileView, ChangePasswordView,
    AdminUserListView, AdminUserDetailView, AdminDeactivateUserView,
)

urlpatterns = [
    # Public auth
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("token/refresh/", TokenRefreshExtendedView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),

    # Authenticated user
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    # Admin
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:id>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/<uuid:id>/deactivate/", AdminDeactivateUserView.as_view(), name="admin-user-deactivate"),
]
