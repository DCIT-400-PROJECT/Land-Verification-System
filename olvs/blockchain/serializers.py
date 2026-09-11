from rest_framework import serializers
from .models import TamperLog
from accounts.serializers import UserPublicSerializer


class TamperLogSerializer(serializers.ModelSerializer):
    detected_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = TamperLog
        fields = ["id", "land_title", "detected_by", "tampered_block_index", "description", "detected_at"]
        read_only_fields = fields


class BlockSummarySerializer(serializers.Serializer):
    block_index = serializers.IntegerField()
    owner_name = serializers.CharField()
    owner_national_id = serializers.CharField()
    acquired_at = serializers.CharField()
    block_hash = serializers.CharField()
    prev_hash = serializers.CharField(allow_null=True)
    hash_valid = serializers.BooleanField()
    link_valid = serializers.BooleanField()
    tampered = serializers.BooleanField()
