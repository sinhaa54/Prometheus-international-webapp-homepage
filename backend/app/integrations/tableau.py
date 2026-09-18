"""Validate Tableau redirect URLs against a configurable allowlist."""
from __future__ import annotations

from urllib.parse import urlparse

from ..core.config import get_settings
from ..core.errors import ValidationError


def validate_tableau_url(url: str) -> str:
    if not url or not isinstance(url, str):
        raise ValidationError("Missing Tableau URL.")
    try:
        parsed = urlparse(url)
    except Exception as exc:                        # noqa: BLE001
        raise ValidationError("Malformed Tableau URL.") from exc
    if parsed.scheme.lower() != "https":
        raise ValidationError("Tableau URL must use HTTPS.")
    host = (parsed.hostname or "").lower()
    if not host:
        raise ValidationError("Tableau URL is missing a hostname.")
    allowed = get_settings().allowed_tableau_hosts_list
    if host not in allowed:
        raise ValidationError(f"Host '{host}' is not in the Tableau allowlist.")
    return url


def is_valid_tableau_url(url: str | None) -> bool:
    try:
        if not url:
            return False
        validate_tableau_url(url)
        return True
    except ValidationError:
        return False
