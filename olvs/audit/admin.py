from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "action", "result", "user", "land_title", "ip_address"]
    list_filter = ["action", "result"]
    search_fields = ["land_title", "user__email", "user__national_id"]
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
