from django.urls import path
from .views import (
    LandVerifyView, LandQRCodeView, LandCertificateView, LandsByGhanaCardView,
    LandRecordListView, LandRecordCreateView, LandRecordDetailView,
    LandOwnershipHistoryView, FlaggedLandListView, DuplicateCheckView,
    TransferRequestCreateView, TransferRequestListView, TransferRequestReviewView,UpdateOwnerContactView
)

urlpatterns = [
    # Citizen-accessible
    # NOTE: <path:...> (not <str:...>) because title numbers contain slashes,
    # e.g. GHA/ACC/CANT/001 — <str:> stops at the first slash.
    path("verify/<path:title_number>/", LandVerifyView.as_view(), name="land-verify"),
    path("qr/<path:title_number>/", LandQRCodeView.as_view(), name="land-qr"),
    path("history/<path:title_number>/", LandOwnershipHistoryView.as_view(), name="land-history"),
    path("certificate/<path:title_number>/", LandCertificateView.as_view(), name="land-certificate"),
    path("by-ghana-card/<str:national_id>/", LandsByGhanaCardView.as_view(), name="land-by-ghana-card"),

    # Admin – Land records
    path("records/", LandRecordListView.as_view(), name="land-list"),
    path("records/create/", LandRecordCreateView.as_view(), name="land-create"),
    path("records/<uuid:pk>/", LandRecordDetailView.as_view(), name="land-detail"),
    path("records/<uuid:pk>/owner-contact/", UpdateOwnerContactView.as_view(), name="land-owner-contact"),
    path("records/flagged/", FlaggedLandListView.as_view(), name="land-flagged"),
    path("records/duplicate-check/<path:title_number>/", DuplicateCheckView.as_view(), name="land-duplicate-check"),

    # Admin – Transfers
    path("transfer/", TransferRequestCreateView.as_view(), name="transfer-create"),
    path("transfer/list/", TransferRequestListView.as_view(), name="transfer-list"),
    path("transfer/<uuid:pk>/review/", TransferRequestReviewView.as_view(), name="transfer-review"),
    
]
