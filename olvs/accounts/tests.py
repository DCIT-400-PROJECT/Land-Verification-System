"""
accounts/tests.py
Tests for user registration, login, logout, role enforcement.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, UserRole


class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")

        self.citizen_data = {
            "email": "citizen@olvs.gh",
            "national_id": "GHA-001-2024",
            "full_name": "Kwame Asante",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
        }
        self.admin = User.objects.create_superuser(
            email="admin@olvs.gh",
            national_id="ADM-001",
            password="AdminPass123!",
            full_name="Admin User",
        )

    def test_register_citizen(self):
        response = self.client.post(self.register_url, self.citizen_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertIn("tokens", response.data["data"])
        self.assertEqual(response.data["data"]["user"]["role"], UserRole.CITIZEN)

    def test_register_duplicate_email(self):
        self.client.post(self.register_url, self.citizen_data, format="json")
        response = self.client.post(self.register_url, self.citizen_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_register_password_mismatch(self):
        data = {**self.citizen_data, "password_confirm": "WrongPass!"}
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        User.objects.create_user(**{k: v for k, v in self.citizen_data.items() if k != "password_confirm"},
                                  password=self.citizen_data["password"])
        response = self.client.post(self.login_url,
                                    {"email": self.citizen_data["email"], "password": self.citizen_data["password"]},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"]["tokens"])

    def test_login_wrong_password(self):
        User.objects.create_user(**{k: v for k, v in self.citizen_data.items() if k != "password_confirm"},
                                  password=self.citizen_data["password"])
        response = self.client.post(self.login_url,
                                    {"email": self.citizen_data["email"], "password": "WrongPass"},
                                    format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_citizen_cannot_access_admin_user_list(self):
        user = User.objects.create_user(**{k: v for k, v in self.citizen_data.items() if k != "password_confirm"},
                                         password=self.citizen_data["password"])
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_user_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_is_hashed(self):
        user = User.objects.create_user(**{k: v for k, v in self.citizen_data.items() if k != "password_confirm"},
                                         password=self.citizen_data["password"])
        self.assertNotEqual(user.password, self.citizen_data["password"])
        self.assertTrue(user.password.startswith("pbkdf2_sha256$"))
        self.assertTrue(user.check_password(self.citizen_data["password"]))
