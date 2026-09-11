"""
audit/middleware.py
Lightweight middleware that logs all auth-related requests automatically.
Heavy logging is done explicitly in views; this catches login/logout/register.
"""
import logging

logger = logging.getLogger("olvs.audit")


class AuditMiddleware:
    TRACKED_PATHS = {
        "/api/auth/login/": "login",
        "/api/auth/logout/": "logout",
        "/api/auth/register/": "register",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        path = request.path_info
        if path in self.TRACKED_PATHS and request.method == "POST":
            action = self.TRACKED_PATHS[path]
            result = "success" if response.status_code < 400 else "failed"
            user = request.user if request.user.is_authenticated else None
            ip = self._get_ip(request)
            logger.info(
                "AUDIT | action=%s | result=%s | user=%s | ip=%s",
                action, result,
                getattr(user, "email", "anonymous"),
                ip,
            )
        return response

    @staticmethod
    def _get_ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "")
