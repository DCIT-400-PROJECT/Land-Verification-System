"""
OLVS – Custom exception handler for uniform API error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Returns all errors in a consistent envelope:
      { "success": false, "error": { "code": "...", "message": "...", "details": {...} } }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "success": False,
            "error": {
                "code": _get_error_code(response.status_code),
                "message": _extract_message(response.data),
                "details": response.data if isinstance(response.data, dict) else {"non_field_errors": response.data},
            },
        }
        response.data = error_payload
    else:
        # Unhandled server error
        logger.exception("Unhandled server error", exc_info=exc)
        response = Response(
            {
                "success": False,
                "error": {
                    "code": "SERVER_ERROR",
                    "message": "An unexpected server error occurred.",
                    "details": {},
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response


def _get_error_code(status_code):
    codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        429: "RATE_LIMITED",
        500: "SERVER_ERROR",
    }
    return codes.get(status_code, "ERROR")


def _extract_message(data):
    if isinstance(data, dict):
        if "detail" in data:
            return str(data["detail"])
        # Return first field error message
        for key, val in data.items():
            if isinstance(val, list) and val:
                return f"{key}: {val[0]}"
            return str(val)
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."
