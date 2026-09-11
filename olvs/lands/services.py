"""
lands/services.py
Business logic layer – verification, duplicate detection, QR code generation.
All database writes go through here to keep views thin.
"""
import os
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import LandRecord, OwnershipRecord, LandStatus, TransferRequest
from blockchain.service import BlockchainService
from audit.models import AuditLog, AuditAction, AuditResult


class LandVerificationService:

    @staticmethod
    def verify_land(title_number: str, requesting_user) -> dict:
        """
        Main verification flow:
        1. Look up land record by title number.
        2. Fetch current ownership.
        3. Verify blockchain integrity.
        4. Return verification result dict.
        """
        try:
            land = LandRecord.objects.select_related("created_by").get(title_number=title_number)
        except LandRecord.DoesNotExist:
            AuditLog.log(
                user=requesting_user,
                action=AuditAction.VERIFY,
                land_title=title_number,
                result=AuditResult.FAILED,
                notes="Land title not found.",
                request=None,
            )
            return {"found": False, "title_number": title_number, "message": "No land record found for this title number."}

        current_ownership = land.current_owner
        chain = list(land.ownership_chain)

        # Blockchain integrity check
        integrity = BlockchainService.verify_chain(chain)

        result = {
            "found": True,
            "land": {
                "id": str(land.id),
                "title_number": land.title_number,
                "location": land.location,
                "region": land.region,
                "district": land.district,
                "area_sqm": str(land.area_sqm),
                "status": land.status,
                "registered_at": str(land.registered_at),
            },
            "current_owner": {
                "owner_name": current_ownership.owner_name if current_ownership else "Unknown",
                "owner_national_id": current_ownership.owner_national_id if current_ownership else "N/A",
                "acquired_at": str(current_ownership.acquired_at) if current_ownership else None,
            } if current_ownership else None,
            "blockchain": {
                "chain_length": len(chain),
                "integrity_valid": integrity["valid"],
                "integrity_message": integrity["message"],
                "tampered_block_index": integrity.get("tampered_index"),
            },
            "qr_code_url": LandVerificationService._ensure_qr_code(land),
        }

        audit_result = AuditResult.SUCCESS if integrity["valid"] else AuditResult.FLAGGED
        AuditLog.log(
            user=requesting_user,
            action=AuditAction.VERIFY,
            land_title=title_number,
            result=audit_result,
            notes=f"Chain integrity: {integrity['message']}",
            request=None,
        )
        return result
    @staticmethod
    def _ensure_qr_code(land: LandRecord) -> str | None:
        """Generate and save QR code if not already present. Returns media URL."""
        if land.qr_code_path:
            return f"{settings.MEDIA_URL}{land.qr_code_path}"

        qr_dir = os.path.join(settings.MEDIA_ROOT, "qr_codes")
        os.makedirs(qr_dir, exist_ok=True)

        # QR content: a real clickable URL that opens the verification page directly
        qr_content = f"{settings.FRONTEND_BASE_URL}/verify?title={land.title_number}"
        img = qrcode.make(qr_content)
        filename = f"qr_{land.title_number.replace('/', '_')}.png"
        filepath = os.path.join(qr_dir, filename)
        img.save(filepath)

        rel_path = f"qr_codes/{filename}"
        LandRecord.objects.filter(pk=land.pk).update(qr_code_path=rel_path)
        return f"{settings.MEDIA_URL}{rel_path}"


class OwnershipTransferService:

    @staticmethod
    @transaction.atomic
    def execute_transfer(transfer_request: TransferRequest, approved_by) -> OwnershipRecord:
        """
        Approve and execute an ownership transfer:
        1. Validate no duplicate active ownership.
        2. Close current ownership record.
        3. Write new blockchain block.
        4. Update land status.
        5. Audit log.
        """
        land = transfer_request.land

        # ── Fraud prevention: duplicate / second-sale check ───────────────────
        if land.status == LandStatus.FLAGGED:
            raise ValueError("This land is flagged for possible fraud. Transfer blocked.")

        current = land.ownership_records.filter(is_current=True).first()
        if current is None:
            raise ValueError("No active ownership record found. Cannot transfer.")

        # Prevent transferring to the same owner
        if current.owner_national_id == transfer_request.new_owner_national_id:
            raise ValueError("New owner is the same as current owner. Transfer rejected.")

        prev_hash = current.block_hash
        next_index = current.block_index + 1

        # ── Close current ownership ───────────────────────────────────────────
        current.is_current = False
        current.transferred_at = timezone.now().date()
        current.transfer_reason = transfer_request.reason
        current.save()

        # ── Create new ownership block ────────────────────────────────────────
        new_block_data = {
            "title_number": land.title_number,
            "previous_owner": current.owner_name,
            "new_owner": transfer_request.new_owner_name,
            "new_owner_national_id": transfer_request.new_owner_national_id,
            "acquired_at": str(timezone.now().date()),
            "prev_hash": prev_hash,
            "block_index": next_index,
        }
        block_hash = BlockchainService.compute_hash(new_block_data)

        new_ownership = OwnershipRecord.objects.create(
            land=land,
            owner=transfer_request.new_owner_user,
            owner_name=transfer_request.new_owner_name,
            owner_national_id=transfer_request.new_owner_national_id,
            acquired_at=timezone.now().date(),
            is_current=True,
            transfer_reason=transfer_request.reason,
            block_hash=block_hash,
            prev_hash=prev_hash,
            block_index=next_index,
            recorded_by=approved_by,
        )

        # ── Update land status ────────────────────────────────────────────────
        land.status = LandStatus.TRANSFERRED
        land.save()

        # ── Mark transfer request as approved ─────────────────────────────────
        transfer_request.status = TransferRequest.TransferStatus.APPROVED
        transfer_request.reviewed_by = approved_by
        transfer_request.reviewed_at = timezone.now()
        transfer_request.save()

        # ── Audit log ─────────────────────────────────────────────────────────
        AuditLog.log(
            user=approved_by,
            action=AuditAction.TRANSFER,
            land_title=land.title_number,
            result=AuditResult.SUCCESS,
            notes=f"Transferred to {transfer_request.new_owner_name} ({transfer_request.new_owner_national_id}). Block #{next_index}.",
            request=None,
        )
        return new_ownership

    @staticmethod
    def check_for_duplicates(title_number: str) -> dict:
        """Check if a land title has suspicious duplicate ownership attempts."""
        try:
            land = LandRecord.objects.get(title_number=title_number)
        except LandRecord.DoesNotExist:
            return {"duplicate": False, "message": "Land not found."}

        ownership_count = land.ownership_records.count()
        pending_transfers = TransferRequest.objects.filter(
            land=land,
            status=TransferRequest.TransferStatus.PENDING
        ).count()

        flagged = pending_transfers > 1
        if flagged and land.status != LandStatus.FLAGGED:
            land.status = LandStatus.FLAGGED
            land.save()

        return {
            "duplicate": flagged,
            "title_number": title_number,
            "ownership_history_count": ownership_count,
            "pending_transfer_count": pending_transfers,
            "land_status": land.status,
        }
