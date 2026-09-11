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
            "id", "owner_details", "owner_name", "owner_national_id",
            "acquired_at", "transferred_at", "is_current",
            "block_hash", "prev_hash", "block_index", "created_at",
        ]
        read_only_fields = fields


class LandRecordSerializer(serializers.ModelSerializer):
    current_owner = OwnershipRecordSerializer(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = LandRecord
        fields = [
            "id", "title_number", "location", "region", "district",
            "area_sqm", "status", "registered_at", "qr_code_url",
            "current_owner", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "current_owner", "created_by", "qr_code_url"]

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
    acquired_at = serializers.DateField()


class LandRecordCreateWithOwnerSerializer(serializers.Serializer):
    land = LandRecordCreateSerializer()
    initial_owner = InitialOwnershipSerializer()


class TransferRequestSerializer(serializers.ModelSerializer):
    land_title = serializers.CharField(source="land.title_number", read_only=True)
    requested_by_details = UserPublicSerializer(source="requested_by", read_only=True)
    reviewed_by_details = UserPublicSerializer(source="reviewed_by", read_only=True)

    class Meta:
        model = TransferRequest
        fields = [
            "id", "land", "land_title",
            "new_owner_name", "new_owner_national_id", "new_owner_user",
            "reason", "status",
            "requested_by_details", "reviewed_by_details",
            "requested_at", "reviewed_at", "rejection_reason",
        ]
        read_only_fields = ["id", "status", "requested_by_details", "reviewed_by_details",
                            "requested_at", "reviewed_at", "land_title"]


class TransferRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransferRequest
        fields = ["land", "new_owner_name", "new_owner_national_id", "new_owner_user", "reason"]

    def validate(self, data):
        land = data["land"]
        if land.status == "flagged":
            raise serializers.ValidationError({"land": "This land is flagged. Transfers are blocked."})
        # Check no other pending transfer exists
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
