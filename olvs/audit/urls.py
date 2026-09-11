from django.urls import path
from .views import AuditLogListView, AuditDashboardView

urlpatterns = [
    path("audit-log/", AuditLogListView.as_view(), name="audit-log"),
    path("dashboard/", AuditDashboardView.as_view(), name="audit-dashboard"),
]
