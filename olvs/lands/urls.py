from django.urls import path
from .views import (
    LandVerifyView, LandQRCodeView,
    LandRecordListView, LandRecordCreateView, LandRecordDetailView,
    LandOwnershipHistoryView, FlaggedLandListView, DuplicateCheckView,
    TransferRequestCreateView, TransferRequestListView, TransferRequestReviewView,
)

urlpatterns = [
    # Citizen-accessible
    path("verify/<path:title_number>/", LandVerifyView.as_view(), name="land-verify"),
    path("qr/<path:title_number>/", LandQRCodeView.as_view(), name="land-qr"),
    path("history/<path:title_number>/", LandOwnershipHistoryView.as_view(), name="land-history"),
    path("records/duplicate-check/<path:title_number>/", DuplicateCheckView.as_view(), name="land-duplicate-check"),    
    # Admin – Land records
    path("records/", LandRecordListView.as_view(), name="land-list"),
    path("records/create/", LandRecordCreateView.as_view(), name="land-create"),
    path("records/<uuid:pk>/", LandRecordDetailView.as_view(), name="land-detail"),
    path("records/flagged/", FlaggedLandListView.as_view(), name="land-flagged"),
    path("records/duplicate-check/<str:title_number>/", DuplicateCheckView.as_view(), name="land-duplicate-check"),

    # Admin – Transfers
    path("transfer/", TransferRequestCreateView.as_view(), name="transfer-create"),
    path("transfer/list/", TransferRequestListView.as_view(), name="transfer-list"),
    path("transfer/<uuid:pk>/review/", TransferRequestReviewView.as_view(), name="transfer-review"),
]
