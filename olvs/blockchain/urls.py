from django.urls import path
from .views import BlockchainInspectView, BlockIntegrityCheckView, TamperLogListView

urlpatterns = [
    path("inspect/<path:title_number>/", BlockchainInspectView.as_view(), name="blockchain-inspect"),
    path("inspect/<path:title_number>/block/<int:block_index>/", BlockIntegrityCheckView.as_view(), name="blockchain-block"),
    path("tamper-log/", TamperLogListView.as_view(), name="tamper-log"),
]
