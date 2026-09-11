from rest_framework import serializers
from .models import AuditLog
from accounts.serializers import UserPublicSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "user", "action", "land_title", "ip_address",
                  "user_agent", "result", "notes", "timestamp"]
        read_only_fields = fields
