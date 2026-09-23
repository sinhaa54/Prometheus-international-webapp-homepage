"""Local dashboard repository - reads a JSON file at rest for dev/offline use.

The JSON file may contain a top-level object with keys:
  - dashboards: list of raw dashboard records
  - platforms:  optional platform metadata (accent, label, blurb)
  - category_order: optional list of category names in display order
  - access_catalog: optional list of curated access-request items
  - source_refreshed_at: optional ISO-8601 timestamp
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path

from ..core.errors import SourceUnavailableError
from ..models.dashboard import AccessCatalogItem, Dashboard
from .base import DashboardRepository

_log = logging.getLogger(__name__)


class LocalDashboardRepository(DashboardRepository):
    def __init__(self, data_path: Path):
        self._path = Path(data_path)

    def list_all(self) -> tuple[list[Dashboard], datetime | None]:
        if not self._path.exists():
            raise SourceUnavailableError(
                f"Local dashboard dataset not found at '{self._path}'."
            )
        try:
            payload = json.loads(self._path.read_text(encoding="utf-8"))
        except Exception as exc:                    # noqa: BLE001
            _log.exception("Failed to read local dataset")
            raise SourceUnavailableError("Local dashboard dataset is unreadable.") from exc

        raw_items = payload.get("dashboards") or []
        refreshed_raw = payload.get("source_refreshed_at")
        refreshed = _parse_datetime(refreshed_raw) if refreshed_raw else None

        dashboards: list[Dashboard] = []
        for row in raw_items:
            try:
                dashboards.append(Dashboard.model_validate(row))
            except Exception as exc:                # noqa: BLE001
                _log.warning("Skipping malformed dashboard row id=%s: %s", row.get("dashboard_id"), exc)

        return dashboards, refreshed

    # ---- helpers exposed for callers that also need platform metadata ----
    def platforms_metadata(self) -> list[dict]:
        return self._read_payload_field("platforms")

    def category_order(self) -> list[str]:
        raw = self._read_payload_field("category_order")
        return [str(x) for x in raw if isinstance(x, str)]

    def access_catalog(self) -> list[AccessCatalogItem]:
        raw = self._read_payload_field("access_catalog")
        items: list[AccessCatalogItem] = []
        for row in raw:
            try:
                items.append(AccessCatalogItem.model_validate(row))
            except Exception as exc:                    # noqa: BLE001
                _log.warning("Skipping malformed access_catalog row: %s", exc)
        return items

    def contact_mailto(self) -> str | None:
        raw = self._read_payload_scalar("contact_mailto")
        return str(raw) if raw else None

    def feedback_url(self) -> str | None:
        raw = self._read_payload_scalar("feedback_url")
        return str(raw) if raw else None

    def _read_payload_field(self, key: str) -> list:
        if not self._path.exists():
            return []
        try:
            payload = json.loads(self._path.read_text(encoding="utf-8"))
            return list(payload.get(key) or [])
        except Exception:
            return []

    def _read_payload_scalar(self, key: str):
        if not self._path.exists():
            return None
        try:
            payload = json.loads(self._path.read_text(encoding="utf-8"))
            return payload.get(key)
        except Exception:
            return None


def _parse_datetime(v: str) -> datetime | None:
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except Exception:
        return None
