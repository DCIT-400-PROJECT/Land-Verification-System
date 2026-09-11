"""
blockchain/models.py
TamperLog – records every tamper-detection event for the security audit.
"""
import uuid
from django.db import models
from django.conf import settings


class TamperLog(models.Model):
    """
    Written whenever blockchain verification detects a hash mismatch or broken chain link.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    land_title = models.CharField(max_length=50, db_index=True)
    detected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="tamper_detections"
    )
    tampered_block_index = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField()
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tamper_logs"
        ordering = ["-detected_at"]

    def __str__(self):
        return f"TamperLog [{self.land_title}] Block #{self.tampered_block_index} – {self.detected_at}"
