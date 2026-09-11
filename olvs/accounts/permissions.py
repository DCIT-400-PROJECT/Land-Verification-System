"""
accounts/permissions.py
Custom DRF permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission
from .models import UserRole


class IsAdminUser(BasePermission):
    """Allows access only to users with role=admin."""
    message = "You must be an administrator to perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsCitizenUser(BasePermission):
    """Allows access to both citizens and admins (any authenticated user)."""
    message = "Authentication required."

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwnerOrAdmin(BasePermission):
    """Object-level: the user owns the object, or is admin."""
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        # obj must have a user/owner field
        return getattr(obj, "owner_id", None) == request.user.id or obj == request.user
