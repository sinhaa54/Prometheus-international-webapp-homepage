from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.config import get_settings
from ...dependencies import get_dashboard_service
from ...models.dashboard import (
    AccessCatalogResponse,
    Dashboard,
    DashboardListResponse,
    MetadataResponse,
)
from ...services.dashboards import DashboardService

router = APIRouter(prefix="/v1", tags=["dashboards"])


@router.get("/dashboards", response_model=DashboardListResponse)
def list_dashboards(
    search: str | None = Query(default=None, max_length=200),
    platform: str | None = Query(default=None, max_length=128),
    category: str | None = Query(default=None, max_length=128),
    market: str | None = Query(default=None, max_length=128),
    page: int = Query(default=1, ge=1, le=10_000),
    page_size: int | None = Query(default=None, ge=1, le=1000),
    sort_by: str = Query(default="display_order",
                         pattern="^(display_order|name|platform|last_updated_at)$"),
    sort_direction: str = Query(default="asc", pattern="^(asc|desc)$"),
    svc: DashboardService = Depends(get_dashboard_service),
) -> DashboardListResponse:
    settings = get_settings()
    ps = page_size or settings.default_page_size
    return svc.list_dashboards(
        search=search,
        platform=platform,
        category=category,
        market=market,
        page=page,
        page_size=ps,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )


@router.get("/dashboards/{dashboard_id}", response_model=Dashboard)
def get_dashboard(
    dashboard_id: str,
    svc: DashboardService = Depends(get_dashboard_service),
) -> Dashboard:
    d = svc.get_dashboard(dashboard_id)
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return d


@router.get("/metadata", response_model=MetadataResponse)
def metadata(svc: DashboardService = Depends(get_dashboard_service)) -> MetadataResponse:
    return svc.metadata()


@router.get("/access-catalog", response_model=AccessCatalogResponse)
def access_catalog(svc: DashboardService = Depends(get_dashboard_service)) -> AccessCatalogResponse:
    """Curated dashboards a user can self-service request access for.

    The catalog is intentionally small and static (managed as data) - not a
    submission endpoint. Each item points at an external Office Forms URL
    which the frontend opens with `noopener,noreferrer` in a new tab.
    """
    return svc.access_catalog()
