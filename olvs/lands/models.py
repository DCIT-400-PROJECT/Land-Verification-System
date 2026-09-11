"""
lands/models.py
Land records, ownership history, and QR code tracking.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class LandStatus(models.TextChoices):
    VERIFIED = "verified", "Verified"
    DISPUTED = "disputed", "Disputed"
    TRANSFERRED = "transferred", "Transferred"
    PENDING = "pending", "Pending Review"
    FLAGGED = "flagged", "Flagged – Possible Fraud"


class LandRecord(models.Model):
    """
    Core land parcel record.
    One record per land parcel; identified globally by title_number.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title_number = models.CharField(
        max_length=50, unique=True, db_index=True,
        help_text="Official land title number issued by the land registry"
    )
    location = models.TextField(help_text="Physical address or plot description")
    region = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)
    area_sqm = models.DecimalField(max_digits=14, decimal_places=2, help_text="Area in square metres")
    status = models.CharField(max_length=15, choices=LandStatus.choices, default=LandStatus.PENDING, db_index=True)
    registered_at = models.DateField(help_text="Date of official registration at the land registry")
    qr_code_path = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="created_land_records"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "land_records"
        verbose_name = "Land Record"
        verbose_name_plural = "Land Records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.title_number}] {self.region} – {self.status}"

    @property
    def current_owner(self):
        return self.ownership_records.filter(is_current=True).select_related("owner").first()

    @property
    def ownership_chain(self):
        return self.ownership_records.order_by("acquired_at")


class OwnershipRecord(models.Model):
    """
    Ownership history for a land parcel – forms the blockchain chain.
    Each transfer adds a new record; only one may have is_current=True per land parcel.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    land = models.ForeignKey(LandRecord, on_delete=models.PROTECT, related_name="ownership_records")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        null=True, blank=True, related_name="owned_lands",
        help_text="System user who owns this land (if registered)"
    )
    owner_name = models.CharField(max_length=255, help_text="Full legal name of owner")
    owner_national_id = models.CharField(max_length=30, help_text="National ID of owner")
    acquired_at = models.DateField(default=timezone.now, help_text="Date ownership was acquired")
    transferred_at = models.DateField(null=True, blank=True, help_text="Date ownership was transferred away")
    is_current = models.BooleanField(default=True, db_index=True)
    transfer_reason = models.TextField(blank=True, help_text="Reason for ownership transfer")

    # Blockchain fields
    block_hash = models.CharField(max_length=64, help_text="SHA-256 hash of this ownership block")
    prev_hash = models.CharField(max_length=64, blank=True, null=True,
                                 help_text="Hash of previous ownership block (null = genesis)")
    block_index = models.PositiveIntegerField(default=0, help_text="Position in the chain")

    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="recorded_transfers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ownership_records"
        verbose_name = "Ownership Record"
        verbose_name_plural = "Ownership Records"
        ordering = ["land", "block_index"]
        constraints = [
            # Only one current owner per land
            models.UniqueConstraint(
                fields=["land"],
                condition=models.Q(is_current=True),
                name="unique_current_owner_per_land",
            )
        ]

    def __str__(self):
        return f"Block #{self.block_index} – {self.land.title_number} → {self.owner_name}"


class TransferRequest(models.Model):
    """
    A pending transfer request submitted by admin before the blockchain block is written.
    Provides a review/confirmation step.
    """
    class TransferStatus(models.TextChoices):
        PENDING = "pending", "Pending Approval"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    land = models.ForeignKey(LandRecord, on_delete=models.PROTECT, related_name="transfer_requests")
    new_owner_name = models.CharField(max_length=255)
    new_owner_national_id = models.CharField(max_length=30)
    new_owner_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="incoming_transfers"
    )
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=TransferStatus.choices, default=TransferStatus.PENDING)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="transfer_requests_made"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="transfer_requests_reviewed"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "transfer_requests"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Transfer [{self.status}] {self.land.title_number} → {self.new_owner_name}"
