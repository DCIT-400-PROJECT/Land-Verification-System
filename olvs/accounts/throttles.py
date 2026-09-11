"""
accounts/throttles.py
Custom throttle classes for rate limiting auth endpoints.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """5 requests/minute on login & register endpoints."""
    scope = "auth"


class VerificationRateThrottle(UserRateThrottle):
    """30 verification requests/minute per authenticated user."""
    scope = "verification"
