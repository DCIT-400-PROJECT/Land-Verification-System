"""
lands/views.py
Land verification, record management, ownership transfer endpoints.
"""
from rest_framework import generics, status, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse

from .models import LandRecord, OwnershipRecord, TransferRequest, LandStatus
from .serializers import (
    LandRecordSerializer, LandRecordCreateWithOwnerSerializer, LandRecordUpdateSerializer,
    OwnershipRecordSerializer, TransferRequestSerializer,
    TransferRequestCreateSerializer, TransferReviewSerializer,
)
from .services import LandVerificationService, OwnershipTransferService
from accounts.permissions import IsAdminUser, IsCitizenUser
from accounts.throttles import VerificationRateThrottle
from blockchain.service import BlockchainService
from audit.models import AuditLog, AuditAction, AuditResult


def success(data=None, message="", code=status.HTTP_200_OK):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=code)


# ─── Land Verification (Citizen) ──────────────────────────────────────────────

@extend_schema(
    tags=["land"],
    summary="Verify land ownership by title number",
    parameters=[OpenApiParameter("title_number", str, OpenApiParameter.PATH, description="Land title number")]
)
class LandVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [VerificationRateThrottle]

    def get(self, request, title_number):
        result = LandVerificationService.verify_land(title_number.upper(), request.user)
        return success(data=result, message="Verification complete.")


@extend_schema(tags=["land"], summary="Get QR code for a land title")
class LandQRCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, title_number):
        try:
            land = LandRecord.objects.get(title_number=title_number.upper())
        except LandRecord.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Land not found."}},
                            status=status.HTTP_404_NOT_FOUND)
        qr_url = LandVerificationService._ensure_qr_code(land)
        return success(data={"title_number": land.title_number, "qr_code_url": qr_url},
                       message="QR code ready.")


@extend_schema(tags=["land"], summary="Download official-style land title certificate (PDF)")
class LandCertificateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, title_number):
        try:
            land = LandRecord.objects.get(title_number=title_number.upper())
        except LandRecord.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Land not found."}},
                            status=status.HTTP_404_NOT_FOUND)

        pdf_buffer = LandVerificationService.generate_certificate_pdf(land)
        filename = f"OLVS_Certificate_{land.title_number.replace('/', '-')}.pdf"
        response = HttpResponse(pdf_buffer, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


@extend_schema(tags=["land"], summary="List all land records currently owned by a given Ghana Card number")
class LandsByGhanaCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, national_id):
        results = LandVerificationService.search_by_ghana_card(national_id)
        return success(data={
            "national_id": national_id,
            "count": len(results),
            "results": results,
        }, message="Search complete.")


# ─── Land Record CRUD (Admin) ─────────────────────────────────────────────────

@extend_schema(tags=["land"], summary="List all land records (Admin)")
class LandRecordListView(generics.ListAPIView):
    serializer_class = LandRecordSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title_number", "region", "district", "location"]
    ordering_fields = ["created_at", "title_number", "status"]
    queryset = LandRecord.objects.select_related("created_by").prefetch_related("ownership_records").all()


@extend_schema(tags=["land"], summary="Create new land record with genesis owner (Admin)")
class LandRecordCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = LandRecordCreateWithOwnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        land_data = serializer.validated_data["land"]
        owner_data = serializer.validated_data["initial_owner"]

        with transaction.atomic():
            # Create the land record
            land = LandRecord.objects.create(
                **land_data,
                created_by=request.user,
                status=LandStatus.VERIFIED,
            )

            # Genesis block (prev_hash = "0" * 64)
            genesis_data = {
                "title_number": land.title_number,
                "previous_owner": None,
                "new_owner": owner_data["owner_name"],
                "new_owner_national_id": owner_data["owner_national_id"],
                "acquired_at": str(owner_data["acquired_at"]),
                "prev_hash": "0" * 64,
                "block_index": 0,
            }
            block_hash = BlockchainService.compute_hash(genesis_data)

            OwnershipRecord.objects.create(
                land=land,
                owner_name=owner_data["owner_name"],
                owner_national_id=owner_data["owner_national_id"],
                acquired_at=owner_data["acquired_at"],
                is_current=True,
                block_hash=block_hash,
                prev_hash=None,
                block_index=0,
                recorded_by=request.user,
            )

        AuditLog.log(user=request.user, action=AuditAction.CREATE_RECORD,
                     land_title=land.title_number, result=AuditResult.SUCCESS,
                     notes=f"Land record created. Genesis block written.", request=request)

        return success(data=LandRecordSerializer(land, context={"request": request}).data,
                       message="Land record created with genesis ownership block.",
                       code=status.HTTP_201_CREATED)

@extend_schema(tags=["land"], summary="Get, update, or flag a land record (Admin)")
class LandRecordDetailView(generics.RetrieveUpdateAPIView):
    queryset = LandRecord.objects.all()
    permission_classes = [IsAdminUser]
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return LandRecordUpdateSerializer
        return LandRecordSerializer

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        instance = self.get_object()
        old_status = instance.status

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.pop("status_change_reason", "")
        new_status = serializer.validated_data.get("status", old_status)

        if new_status != old_status:
            if not reason.strip():
                return Response(
                    {"success": False, "error": {"code": "REASON_REQUIRED",
                                                  "message": "A reason is required when changing status."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save(
                status_change_reason=reason.strip(),
                status_changed_at=timezone.now(),
                status_changed_by=request.user,
            )
            AuditLog.log(
                user=request.user, action=AuditAction.ADMIN_ACTION,
                land_title=instance.title_number, result=AuditResult.SUCCESS,
                notes=f"Status changed {old_status} → {new_status}. Reason: {reason.strip()}",
                request=request,
            )
        else:
            serializer.save()

        return success(data=LandRecordSerializer(instance, context={"request": request}).data,
                       message="Land record updated successfully.")


@extend_schema(tags=["land"], summary="Get full ownership history (blockchain chain) for a land")
class LandOwnershipHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, title_number):
        try:
            land = LandRecord.objects.get(title_number=title_number.upper())
        except LandRecord.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Land not found."}},
                            status=status.HTTP_404_NOT_FOUND)
        chain = land.ownership_chain
        return success(data={
            "title_number": land.title_number,
            "chain_length": chain.count(),
            "history": OwnershipRecordSerializer(chain, many=True).data,
        })


# ─── Flagged / Duplicate Detection (Admin) ───────────────────────────────────

@extend_schema(tags=["admin"], summary="List all flagged land records")
class FlaggedLandListView(generics.ListAPIView):
    serializer_class = LandRecordSerializer
    permission_classes = [IsAdminUser]
    queryset = LandRecord.objects.filter(status=LandStatus.FLAGGED)


@extend_schema(tags=["land"], summary="Run duplicate/fraud check on a land title")
class DuplicateCheckView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, title_number):
        result = OwnershipTransferService.check_for_duplicates(title_number.upper())
        return success(data=result)


# ─── Ownership Transfer (Admin) ───────────────────────────────────────────────

@extend_schema(tags=["transfer"], summary="Submit a new transfer request (Admin)")
class TransferRequestCreateView(generics.CreateAPIView):
    serializer_class = TransferRequestCreateSerializer
    permission_classes = [IsAdminUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        land = serializer.validated_data["land"]
        current = land.current_owner  # OwnershipRecord or None

        tr = serializer.save(
            requested_by=request.user,
            previous_owner_name=current.owner_name if current else "",
            previous_owner_national_id=current.owner_national_id if current else "",
        )

        AuditLog.log(user=request.user, action=AuditAction.TRANSFER_REQUEST,
                     land_title=tr.land.title_number, result=AuditResult.SUCCESS,
                     notes=f"Transfer request: {tr.previous_owner_name or 'unknown'} → {tr.new_owner_name}",
                     request=request)
        return success(data=TransferRequestSerializer(tr).data,
                       message="Transfer request submitted.",
                       code=status.HTTP_201_CREATED)

@extend_schema(tags=["transfer"], summary="List all transfer requests (Admin)")
class TransferRequestListView(generics.ListAPIView):
    serializer_class = TransferRequestSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["land__title_number", "new_owner_name", "status"]
    queryset = TransferRequest.objects.select_related("land", "requested_by", "reviewed_by").all()


@extend_schema(tags=["transfer"], summary="Approve or reject a transfer request (Admin)")
class TransferRequestReviewView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            tr = TransferRequest.objects.select_related("land").get(pk=pk)
        except TransferRequest.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Transfer request not found."}},
                            status=status.HTTP_404_NOT_FOUND)

        if tr.status != TransferRequest.TransferStatus.PENDING:
            return Response({"success": False, "error": {"code": "BAD_REQUEST",
                                                          "message": f"Transfer is already {tr.status}."}},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = TransferReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["action"] == "approve":
            try:
                new_block = OwnershipTransferService.execute_transfer(tr, approved_by=request.user)
            except ValueError as e:
                return Response({"success": False, "error": {"code": "TRANSFER_BLOCKED", "message": str(e)}},
                                status=status.HTTP_400_BAD_REQUEST)
            return success(data=OwnershipRecordSerializer(new_block).data,
                           message="Transfer approved and blockchain block written.")
        else:
            tr.status = TransferRequest.TransferStatus.REJECTED
            tr.reviewed_by = request.user
            tr.reviewed_at = timezone.now()
            tr.rejection_reason = serializer.validated_data.get("rejection_reason", "")
            tr.save()
            AuditLog.log(user=request.user, action=AuditAction.TRANSFER,
                         land_title=tr.land.title_number, result=AuditResult.FAILED,
                         notes=f"Transfer rejected: {tr.rejection_reason}", request=request)
            return success(message="Transfer request rejected.")
