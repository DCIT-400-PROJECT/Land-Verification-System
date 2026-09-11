"""
audit/models.py
Audit log – every significant system action is recorded here.
"""
import uuid
from django.db import models
from django.conf import settings


class AuditAction(models.TextChoices):
    REGISTER = "register", "User Registration"
    LOGIN = "login", "User Login"
    LOGOUT = "logout", "User Logout"
    VERIFY = "verify", "Land Verification"
    CREATE_RECORD = "create_record", "Land Record Created"
    UPDATE_RECORD = "update_record", "Land Record Updated"
    TRANSFER_REQUEST = "transfer_request", "Transfer Request Submitted"
    TRANSFER = "transfer", "Ownership Transfer"
    TAMPER_DETECT = "tamper_detect", "Tamper Detection"
    QR_GENERATE = "qr_generate", "QR Code Generated"
    ADMIN_ACTION = "admin_action", "Admin Action"


class AuditResult(models.TextChoices):
    SUCCESS = "success", "Success"
    FAILED = "failed", "Failed"
    FLAGGED = "flagged", "Flagged"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=25, choices=AuditAction.choices, db_index=True)
    land_title = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    result = models.CharField(max_length=10, choices=AuditResult.choices, db_index=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-timestamp"]

    def __str__(self):
        user_str = str(self.user) if self.user else "anonymous"
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.action} by {user_str} – {self.result}"

    @classmethod
    def log(cls, user, action: str, result: str, notes: str = "",
            land_title: str = None, request=None):
        """Convenience factory for creating log entries."""
        ip = None
        ua = ""
        if request:
            ip = cls._get_ip(request)
            ua = request.META.get("HTTP_USER_AGENT", "")[:512]
        cls.objects.create(
            user=user,
            action=action,
            land_title=land_title,
            ip_address=ip,
            user_agent=ua,
            result=result,
            notes=notes,
        )

    @staticmethod
    def _get_ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
