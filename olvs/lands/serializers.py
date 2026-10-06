"""
lands/serializers.py
"""
from rest_framework import serializers
from .models import LandRecord, OwnershipRecord, TransferRequest, LandStatus
from accounts.serializers import UserPublicSerializer


class OwnershipRecordSerializer(serializers.ModelSerializer):
    owner_details = UserPublicSerializer(source="owner", read_only=True)

    class Meta:
        model = OwnershipRecord
        fields = [
            "id", "owner_details", "owner_name", "owner_national_id", "owner_contact",
            "acquired_at", "transferred_at", "is_current",
            "block_hash", "prev_hash", "block_index", "created_at",
        ]
        read_only_fields = fields


class LandRecordSerializer(serializers.ModelSerializer):
    current_owner = OwnershipRecordSerializer(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    status_changed_by = UserPublicSerializer(read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = LandRecord
        fields = [
            "id", "title_number", "location", "region", "district",
            "area_sqm", "status", "registered_at", "qr_code_url",
            "plot_number", "land_type", "land_use", "locality",
            "area_acres", "gps_coordinates", "beacon_numbers",
            "deed_type", "deed_reference", "survey_plan_number",
            "surveyor_name", "surveyor_license", "town_planning_approval",
            "stamp_duty_paid", "stamp_duty_ref", "encumbrances",
            "status_change_reason", "status_changed_at", "status_changed_by",
            "current_owner", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "created_at", "updated_at", "current_owner", "created_by", "qr_code_url",
            "status_changed_at", "status_changed_by",
        ]

    def get_qr_code_url(self, obj):
        if obj.qr_code_path:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(f"/media/{obj.qr_code_path}")
        return None


class LandRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandRecord
        fields = [
            "title_number", "location", "region", "district",
            "area_sqm", "status", "registered_at",
            "plot_number", "land_type", "land_use", "locality",
            "area_acres", "gps_coordinates", "beacon_numbers",
            "deed_type", "deed_reference", "survey_plan_number",
            "surveyor_name", "surveyor_license", "town_planning_approval",
            "stamp_duty_paid", "stamp_duty_ref", "encumbrances",
        ]

    def validate_title_number(self, value):
        if LandRecord.objects.filter(title_number=value).exists():
            raise serializers.ValidationError("A land record with this title number already exists.")
        return value.upper()

    def validate_area_sqm(self, value):
        if value <= 0:
            raise serializers.ValidationError("Area must be greater than zero.")
        return value


class InitialOwnershipSerializer(serializers.Serializer):
    """Used when creating a new land record to set the first (genesis) owner."""
    owner_name = serializers.CharField(max_length=255)
    owner_national_id = serializers.CharField(max_length=30)
    owner_contact = serializers.CharField(max_length=30, required=False, allow_blank=True)
    acquired_at = serializers.DateField()


class LandRecordCreateWithOwnerSerializer(serializers.Serializer):
    land = LandRecordCreateSerializer()
    initial_owner = InitialOwnershipSerializer()


class LandRecordUpdateSerializer(serializers.ModelSerializer):
    """
    Used for PATCH on LandRecordDetailView. Accepts an optional, write-only
    status_change_reason that is only required by the view when status actually changes;
    it is persisted onto the model's own status_change_reason/status_changed_at/by fields.
    """
    status_change_reason = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = LandRecord
        fields = [
            "title_number", "location", "region", "district",
            "area_sqm", "status", "registered_at",
            "plot_number", "land_type", "land_use", "locality",
            "area_acres", "gps_coordinates", "beacon_numbers",
            "deed_type", "deed_reference", "survey_plan_number",
            "surveyor_name", "surveyor_license", "town_planning_approval",
            "stamp_duty_paid", "stamp_duty_ref", "encumbrances",
            "status_change_reason",
        ]


class TransferRequestSerializer(serializers.ModelSerializer):
    land_title = serializers.CharField(source="land.title_number", read_only=True)
    requested_by_details = UserPublicSerializer(source="requested_by", read_only=True)
    reviewed_by_details = UserPublicSerializer(source="reviewed_by", read_only=True)
    previous_owner_name = serializers.SerializerMethodField()
    previous_owner_national_id = serializers.SerializerMethodField()

    class Meta:
        model = TransferRequest
        fields = [
            "id", "land", "land_title",
            "previous_owner_name", "previous_owner_national_id","new_owner_contact"
            "new_owner_name", "new_owner_national_id", "new_owner_user",
            "reason", "status",
            "requested_by_details", "reviewed_by_details",
            "requested_at", "reviewed_at", "rejection_reason",
        ]
        read_only_fields = [
            "id", "status", "requested_by_details", "reviewed_by_details",
            "requested_at", "reviewed_at", "land_title",
        ]

    def _fallback_previous_owner(self, obj):
        """
        For transfers created before previous_owner snapshotting existed,
        derive the pre-transfer owner from the ownership chain instead of
        showing a blank field.
        """
        chain = list(obj.land.ownership_records.order_by("block_index"))
        if not chain:
            return None
        if obj.status == "approved":
            # The block created by THIS transfer is the one matching new_owner;
            # the block right before it (by index) was the previous owner.
            for i, block in enumerate(chain):
                if block.owner_national_id == obj.new_owner_national_id and i > 0:
                    return chain[i - 1]
            return chain[-2] if len(chain) > 1 else None
        # Pending/rejected: nothing has changed yet, so today's current owner
        # IS the previous owner relative to this request.
        current = next((b for b in chain if b.is_current), None)
        return current

    def get_previous_owner_name(self, obj):
        if obj.previous_owner_name:
            return obj.previous_owner_name
        block = self._fallback_previous_owner(obj)
        return block.owner_name if block else None

    def get_previous_owner_national_id(self, obj):
        if obj.previous_owner_national_id:
            return obj.previous_owner_national_id
        block = self._fallback_previous_owner(obj)
        return block.owner_national_id if block else None


class TransferRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRequest
        fields = ["land", "new_owner_name", "new_owner_national_id", "new_owner_user", "reason"]

    def validate(self, data):
        land = data["land"]
        if land.status == "flagged":
            raise serializers.ValidationError({"land": "This land is flagged. Transfers are blocked."})
        existing = TransferRequest.objects.filter(land=land, status="pending").exists()
        if existing:
            raise serializers.ValidationError({"land": "A pending transfer already exists for this land."})
        return data


class TransferReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["action"] == "reject" and not data.get("rejection_reason"):
            raise serializers.ValidationError({"rejection_reason": "Rejection reason is required."})
        return data