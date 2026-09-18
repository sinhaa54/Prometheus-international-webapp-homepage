"""Repository interfaces (abstract base classes)."""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from ..models.dashboard import AccessCatalogItem, Dashboard
from ..models.submissions import SubmissionOut


class DashboardRepository(ABC):
    """Read-side repository for dashboards."""

    @abstractmethod
    def list_all(self) -> tuple[list[Dashboard], datetime | None]:
        """Return (dashboards, source_refreshed_at). Only-active filtering is applied by service layer."""

    def access_catalog(self) -> list[AccessCatalogItem]:
        """Return the curated list of dashboards eligible for self-service access requests.

        Default implementation returns an empty list; concrete repositories may
        override to expose curated entries stored alongside dashboard data.
        """
        return []


class SubmissionRepository(ABC):
    """Write-side repository for form submissions (access / feedback / contact)."""

    @abstractmethod
    def save(self, record: dict) -> SubmissionOut: ...
