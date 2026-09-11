from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "national_id", "role", "is_active", "date_joined"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["email", "national_id", "full_name"]
    ordering = ["-date_joined"]
    readonly_fields = ["id", "date_joined", "last_login"]

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        ("Personal Info", {"fields": ("full_name", "national_id", "phone_number")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "national_id", "full_name", "role", "password1", "password2"),
        }),
    )
