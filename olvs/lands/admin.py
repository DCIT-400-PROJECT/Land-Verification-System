from django.contrib import admin
from .models import LandRecord, OwnershipRecord, TransferRequest


class OwnershipInline(admin.TabularInline):
    model = OwnershipRecord
    extra = 0
    readonly_fields = ["block_hash", "prev_hash", "block_index", "created_at"]
    fields = ["owner_name", "owner_national_id", "acquired_at", "transferred_at",
              "is_current", "block_index", "block_hash", "prev_hash"]


@admin.register(LandRecord)
class LandRecordAdmin(admin.ModelAdmin):
    list_display = ["title_number", "region", "district", "area_sqm", "status", "registered_at"]
    list_filter = ["status", "region"]
    search_fields = ["title_number", "location", "region"]
    readonly_fields = ["id", "created_at", "updated_at", "qr_code_path"]
    inlines = [OwnershipInline]


@admin.register(OwnershipRecord)
class OwnershipRecordAdmin(admin.ModelAdmin):
    list_display = ["land", "owner_name", "owner_national_id", "block_index", "is_current", "acquired_at"]
    list_filter = ["is_current"]
    search_fields = ["owner_name", "owner_national_id", "land__title_number"]
    readonly_fields = ["id", "block_hash", "prev_hash", "created_at"]


@admin.register(TransferRequest)
class TransferRequestAdmin(admin.ModelAdmin):
    list_display = ["land", "new_owner_name", "status", "requested_by", "requested_at"]
    list_filter = ["status"]
    search_fields = ["land__title_number", "new_owner_name", "new_owner_national_id"]
    readonly_fields = ["id", "requested_at", "reviewed_at"]
