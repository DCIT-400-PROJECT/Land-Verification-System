from django.contrib import admin
from .models import TamperLog

@admin.register(TamperLog)
class TamperLogAdmin(admin.ModelAdmin):
    list_display = ["land_title", "tampered_block_index", "detected_by", "detected_at"]
    search_fields = ["land_title"]
    readonly_fields = ["id", "detected_at"]
