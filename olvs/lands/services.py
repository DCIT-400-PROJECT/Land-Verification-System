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
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


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
                "plot_number": land.plot_number,
                "land_type": land.land_type,
                "land_use": land.land_use,
                "locality": land.locality,
                "area_acres": str(land.area_acres) if land.area_acres is not None else None,
                "gps_coordinates": land.gps_coordinates,
                "beacon_numbers": land.beacon_numbers,
                "deed_type": land.deed_type,
                "deed_reference": land.deed_reference,
                "survey_plan_number": land.survey_plan_number,
                "surveyor_name": land.surveyor_name,
                "surveyor_license": land.surveyor_license,
                "town_planning_approval": land.town_planning_approval,
                "stamp_duty_paid": land.stamp_duty_paid,
                "stamp_duty_ref": land.stamp_duty_ref,
                "encumbrances": land.encumbrances,
            },
            "current_owner": {
                "owner_name": current_ownership.owner_name if current_ownership else "Unknown",
                "owner_national_id": current_ownership.owner_national_id if current_ownership else "N/A",
                "owner_contact": current_ownership.owner_contact if current_ownership else None,
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
    """Generate and save QR code if not already present. Returns its URL."""
    if land.qr_code_path:
        return default_storage.url(land.qr_code_path)

    qr_content = f"{settings.FRONTEND_BASE_URL}/verify?title={land.title_number}"
    img = qrcode.make(qr_content)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    filename = f"qr_codes/qr_{land.title_number.replace('/', '_')}.png"
    saved_path = default_storage.save(filename, ContentFile(buf.read()))

    LandRecord.objects.filter(pk=land.pk).update(qr_code_path=saved_path)
    return default_storage.url(saved_path)

    @staticmethod
    def generate_certificate_pdf(land: LandRecord) -> BytesIO:
        """
        Renders an official-style Certificate of Land Title Registration as a
        PDF, matching Lands Commission certificate conventions (certificate
        number, registered owner, parcel particulars, registrar signature
        line) plus a blockchain hash + QR code for digital authentication.
        Returns an in-memory PDF buffer.
        """
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.lib.colors import HexColor
        from reportlab.pdfgen import canvas
        from reportlab.lib.utils import ImageReader

        NAVY, GOLD, INK, MUTED = (
            HexColor("#1A3C5E"), HexColor("#C9A227"),
            HexColor("#1A1A1A"), HexColor("#5B6673"),
        )

        current_ownership = land.current_owner
        chain = list(land.ownership_chain)
        latest_block = chain[-1] if chain else None
        block_hash = getattr(latest_block, "block_hash", None) or "N/A — no ownership block recorded"
        verify_url = f"{settings.FRONTEND_BASE_URL}/verify?title={land.title_number}"

        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        W, H = A4
        margin = 14 * mm

        c.setStrokeColor(NAVY)
        c.setLineWidth(2.2)
        c.rect(margin, margin, W - 2 * margin, H - 2 * margin)
        c.setStrokeColor(GOLD)
        c.setLineWidth(0.7)
        c.rect(margin + 4 * mm, margin + 4 * mm, W - 2 * margin - 8 * mm, H - 2 * margin - 8 * mm)

        c.saveState()
        c.setFillColor(NAVY)
        c.setFillAlpha(0.04)
        c.setFont("Helvetica-Bold", 90)
        c.translate(W / 2, H / 2)
        c.rotate(35)
        c.drawCentredString(0, 0, "OLVS")
        c.restoreState()

        y = H - margin - 14 * mm
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(W / 2, y, "REPUBLIC OF GHANA")
        y -= 6 * mm
        c.setFont("Helvetica-Bold", 15)
        c.drawCentredString(W / 2, y, "LANDS COMMISSION")
        y -= 5.5 * mm
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8.3)
        c.drawCentredString(W / 2, y, "Online Land Verification System — Digitally Issued Record")

        y -= 7 * mm
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.1)
        c.line(W / 2 - 55 * mm, y, W / 2 + 55 * mm, y)

        y -= 9 * mm
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 13.5)
        c.drawCentredString(W / 2, y, "CERTIFICATE OF LAND TITLE REGISTRATION")
        y -= 6 * mm
        c.setFont("Helvetica", 8.5)
        c.setFillColor(MUTED)
        c.drawCentredString(W / 2, y, f"Certificate No. OLVS-{land.title_number.replace('/', '-')}")

        y -= 12 * mm
        c.setFillColor(INK)
        c.setFont("Helvetica", 9.5)
        c.drawString(margin + 10 * mm, y,
            "This is to certify that the particulars below are recorded on the land register in respect of the parcel described,")
        y -= 4.6 * mm
        c.drawString(margin + 10 * mm, y,
            "and that the registered proprietor's title, as at the date of issue, is as stated.")

        def field_row(label, value, yy):
            c.setFont("Helvetica-Bold", 8.6)
            c.setFillColor(MUTED)
            c.drawString(margin + 10 * mm, yy, label.upper())
            c.setFont("Helvetica", 10.5)
            c.setFillColor(INK)
            c.drawString(margin + 55 * mm, yy, str(value) if value else "—")
            c.setStrokeColor(HexColor("#D8DEE6"))
            c.setLineWidth(0.5)
            c.line(margin + 10 * mm, yy - 2.6 * mm, W - margin - 10 * mm, yy - 2.6 * mm)

        y -= 12 * mm
        rows = [
            ("Title Number", land.title_number),
            ("Registered Owner", current_ownership.owner_name if current_ownership else "Unrecorded"),
            ("Owner Ghana Card No.", current_ownership.owner_national_id if current_ownership else "—"),
            ("Location", land.location),
            ("Region / District", f"{land.region} / {land.district or '—'}"),
            ("Plot Number", land.plot_number),
            ("Land Type", land.get_land_type_display() if land.land_type else None),
            ("Land Use", land.get_land_use_display() if land.land_use else None),
            ("Area", f"{land.area_sqm} sq.m  ({land.area_acres or '—'} acres)"),
            ("GPS Coordinates", land.gps_coordinates),
            ("Survey Plan No.", land.survey_plan_number),
            ("Deed Reference", land.deed_reference),
            ("Date of Registration", str(land.registered_at)),
            ("Status", land.get_status_display().upper()),
        ]
        for label, value in rows:
            field_row(label, value, y)
            y -= 7.4 * mm

        y -= 4 * mm
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 8.6)
        c.drawString(margin + 10 * mm, y, "BLOCKCHAIN AUTHENTICATION HASH")
        y -= 4.6 * mm
        c.setFont("Courier", 7.6)
        c.setFillColor(MUTED)
        c.drawString(margin + 10 * mm, y, block_hash)

        qr_img = qrcode.make(verify_url)
        qr_buf = BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)
        qr_size = 26 * mm
        qr_x = W - margin - 10 * mm - qr_size
        qr_y = margin + 16 * mm
        c.drawImage(ImageReader(qr_buf), qr_x, qr_y, width=qr_size, height=qr_size)
        c.setFont("Helvetica", 6.8)
        c.setFillColor(MUTED)
        c.drawCentredString(qr_x + qr_size / 2, qr_y - 4 * mm, "Scan to re-verify")

        sig_y = margin + 28 * mm
        c.setStrokeColor(INK)
        c.setLineWidth(0.6)
        c.line(margin + 10 * mm, sig_y, margin + 70 * mm, sig_y)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(INK)
        c.drawString(margin + 10 * mm, sig_y - 4.5 * mm, "Registrar of Lands — Authorized Signatory")
        c.setFont("Helvetica", 7.3)
        c.setFillColor(MUTED)
        c.drawString(margin + 10 * mm, sig_y - 8.5 * mm,
            "This certificate is system-generated and valid without a physical signature")
        c.drawString(margin + 10 * mm, sig_y - 12 * mm,
            "when its QR code or hash verifies successfully on the OLVS verification page.")

        c.showPage()
        c.save()
        buf.seek(0)
        return buf

    @staticmethod
    def search_by_ghana_card(national_id: str) -> list[dict]:
        """
        Returns every land parcel currently owned by the given Ghana Card
        (national ID) holder — one entry per land where an OwnershipRecord
        with is_current=True matches that national ID.
        """
        records = (
            OwnershipRecord.objects
            .filter(owner_national_id__iexact=national_id.strip(), is_current=True)
            .select_related("land")
        )
        return [
            {
                "title_number": r.land.title_number,
                "location": r.land.location,
                "region": r.land.region,
                "district": r.land.district,
                "status": r.land.status,
                "area_sqm": str(r.land.area_sqm),
                "owner_name": r.owner_name,
                "acquired_at": str(r.acquired_at),
            }
            for r in records
        ]

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
            owner_contact=transfer_request.new_owner_contact,
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
