"""
blockchain/views.py
Blockchain inspection endpoints – chain details and tamper log.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from drf_spectacular.utils import extend_schema
from .service import BlockchainService
from .models import TamperLog
from .serializers import TamperLogSerializer, BlockSummarySerializer
from lands.models import LandRecord, OwnershipRecord
from accounts.permissions import IsAdminUser
from audit.models import AuditLog, AuditAction, AuditResult


def success(data=None, message="", code=status.HTTP_200_OK):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return Response(payload, status=code)


@extend_schema(tags=["blockchain"], summary="Inspect full blockchain chain for a land title")
class BlockchainInspectView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, title_number):
        try:
            land = LandRecord.objects.get(title_number=title_number.upper())
        except LandRecord.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Land not found."}},
                            status=status.HTTP_404_NOT_FOUND)
        chain = list(land.ownership_chain)
        summary = BlockchainService.get_chain_summary(chain)
        integrity = BlockchainService.verify_chain(chain)

        # Write to TamperLog if corruption found
        if not integrity["valid"]:
            TamperLog.objects.create(
                land_title=land.title_number,
                detected_by=request.user,
                tampered_block_index=integrity.get("tampered_index"),
                description=integrity["message"],
            )
            AuditLog.log(user=request.user, action=AuditAction.TAMPER_DETECT,
                         land_title=land.title_number, result=AuditResult.FLAGGED,
                         notes=integrity["message"], request=request)

        return success(data={
            "title_number": land.title_number,
            "chain_length": len(chain),
            "integrity": integrity,
            "blocks": summary,
        })


@extend_schema(tags=["blockchain"], summary="Run integrity check on a specific block index")
class BlockIntegrityCheckView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, title_number, block_index):
        try:
            land = LandRecord.objects.get(title_number=title_number.upper())
            record = OwnershipRecord.objects.filter(land=land, block_index=block_index).first()
        except LandRecord.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Land not found."}},
                            status=status.HTTP_404_NOT_FOUND)
        if not record:
            return Response({"success": False, "error": {"code": "NOT_FOUND",
                                                          "message": f"Block #{block_index} not found."}},
                            status=status.HTTP_404_NOT_FOUND)

        chain = list(land.ownership_chain)
        summary = BlockchainService.get_chain_summary(chain)
        block_info = next((b for b in summary if b["block_index"] == block_index), None)
        return success(data=block_info)


@extend_schema(tags=["blockchain"], summary="List all tamper detection events (Admin)")
class TamperLogListView(generics.ListAPIView):
    serializer_class = TamperLogSerializer
    permission_classes = [IsAdminUser]
    queryset = TamperLog.objects.select_related("detected_by").all()
