from fastapi import APIRouter

from ...core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "app_env": s.app_env,
        "app_version": s.app_version,
        "dashboard_repository_mode": s.dashboard_repository_mode,
        "submission_repository_mode": s.submission_repository_mode,
    }
