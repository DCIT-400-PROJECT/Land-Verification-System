"""
audit/views.py
Audit log endpoints for admin inspection.
"""
from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.db.models import Count, Q
from .models import AuditLog, AuditAction, AuditResult
from .serializers import AuditLogSerializer
from accounts.permissions import IsAdminUser


@extend_schema(tags=["admin"], summary="List all audit log entries (Admin)")
class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["land_title", "action", "result", "user__email", "user__national_id"]
    ordering_fields = ["timestamp", "action", "result"]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user").all()
        # Optional query-param filters
        action = self.request.query_params.get("action")
        result = self.request.query_params.get("result")
        land = self.request.query_params.get("land_title")
        if action:
            qs = qs.filter(action=action)
        if result:
            qs = qs.filter(result=result)
        if land:
            qs = qs.filter(land_title__icontains=land)
        return qs


@extend_schema(tags=["admin"], summary="Audit log dashboard stats (Admin)")
class AuditDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = {
            "total_entries": AuditLog.objects.count(),
            "verifications": AuditLog.objects.filter(action=AuditAction.VERIFY).count(),
            "transfers": AuditLog.objects.filter(action=AuditAction.TRANSFER).count(),
            "flagged_events": AuditLog.objects.filter(result=AuditResult.FLAGGED).count(),
            "failed_events": AuditLog.objects.filter(result=AuditResult.FAILED).count(),
            "tamper_detections": AuditLog.objects.filter(action=AuditAction.TAMPER_DETECT).count(),
            "actions_breakdown": list(
                AuditLog.objects.values("action").annotate(count=Count("id")).order_by("-count")
            ),
        }
        return Response({"success": True, "data": stats})
