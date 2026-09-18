"""Factory helpers - select repository implementations by configuration."""
from __future__ import annotations

from pathlib import Path

from .core.config import Settings, get_settings
from .repositories.base import DashboardRepository, SubmissionRepository
from .repositories.local_dashboards import LocalDashboardRepository
from .repositories.submissions import (
    DataikuSubmissionRepository,
    LocalSubmissionRepository,
)
from .services.dashboards import DashboardService
from .services.submissions import SubmissionService

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
_DATA_DIR = _BACKEND_ROOT / "data"


def build_dashboard_repository(settings: Settings) -> DashboardRepository:
    if settings.dashboard_repository_mode == "dataiku":
        # Import lazily so local runs never require the dataiku package.
        # DataikuDashboardRepository is no-arg — all config comes from
        # DataikuConfig (DSS project variables).
        from .repositories.dataiku_dashboards import DataikuDashboardRepository
        return DataikuDashboardRepository()
    return LocalDashboardRepository(_DATA_DIR / "sample_dashboards.json")


def build_submission_repository(settings: Settings) -> SubmissionRepository:
    if settings.submission_repository_mode == "dataiku":
        # DataikuSubmissionRepository is no-arg — uses DataikuConfig.
        return DataikuSubmissionRepository()
    return LocalSubmissionRepository(_DATA_DIR / "submissions.local.jsonl")


# Simple module-level singletons (built lazily on first import in main.py).
_dashboard_service: DashboardService | None = None
_submission_service: SubmissionService | None = None


def get_dashboard_service() -> DashboardService:
    global _dashboard_service
    if _dashboard_service is None:
        s = get_settings()
        _dashboard_service = DashboardService(
            build_dashboard_repository(s),
            s.dashboard_cache_ttl_seconds,
        )
    return _dashboard_service


def get_submission_service() -> SubmissionService:
    global _submission_service
    if _submission_service is None:
        _submission_service = SubmissionService(build_submission_repository(get_settings()))
    return _submission_service
