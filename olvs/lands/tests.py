"""
lands/tests.py
Tests for land verification, duplicate detection, and transfer logic.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from lands.models import LandRecord, OwnershipRecord, LandStatus
from blockchain.service import BlockchainService


class LandVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email="admin@olvs.gh", national_id="ADM-001",
            password="AdminPass123!", full_name="Admin"
        )
        self.citizen = User.objects.create_user(
            email="citizen@olvs.gh", national_id="GHA-001",
            password="CitizenPass123!", full_name="Citizen User"
        )
        # Create a land record with a genesis block
        self.land = LandRecord.objects.create(
            title_number="GHA/ACC/TEST/001",
            location="Plot 5, Cantonments, Accra",
            region="Greater Accra",
            district="Accra",
            area_sqm=500,
            status=LandStatus.VERIFIED,
            registered_at="2020-01-01",
            created_by=self.admin,
        )
        genesis_data = {
            "title_number": self.land.title_number,
            "previous_owner": None,
            "new_owner": "Kwame Test",
            "new_owner_national_id": "GHA-TEST-001",
            "acquired_at": "2020-01-01",
            "prev_hash": "0" * 64,
            "block_index": 0,
        }
        h = BlockchainService.compute_hash(genesis_data)
        self.ownership = OwnershipRecord.objects.create(
            land=self.land,
            owner_name="Kwame Test",
            owner_national_id="GHA-TEST-001",
            acquired_at="2020-01-01",
            is_current=True,
            block_hash=h,
            prev_hash=None,
            block_index=0,
            recorded_by=self.admin,
        )

    def test_citizen_can_verify_land(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse("land-verify", kwargs={"title_number": "GHA/ACC/TEST/001"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["found"])
        self.assertTrue(response.data["data"]["blockchain"]["integrity_valid"])

    def test_verify_nonexistent_land(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse("land-verify", kwargs={"title_number": "GHOST/000"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["found"])

    def test_unauthenticated_cannot_verify(self):
        url = reverse("land-verify", kwargs={"title_number": "GHA/ACC/TEST/001"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tamper_detected_on_modified_hash(self):
        # Corrupt the stored hash
        self.ownership.block_hash = "a" * 64
        self.ownership.save()
        self.client.force_authenticate(user=self.citizen)
        url = reverse("land-verify", kwargs={"title_number": "GHA/ACC/TEST/001"})
        response = self.client.get(url)
        self.assertFalse(response.data["data"]["blockchain"]["integrity_valid"])

    def test_qr_code_generated_on_verify(self):
        self.client.force_authenticate(user=self.citizen)
        url = reverse("land-verify", kwargs={"title_number": "GHA/ACC/TEST/001"})
        response = self.client.get(url)
        self.assertIsNotNone(response.data["data"]["qr_code_url"])
