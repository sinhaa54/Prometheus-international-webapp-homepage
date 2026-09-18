"""Pydantic models for the Dashboard domain (request + response shapes)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl


class Dashboard(BaseModel):
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    dashboard_id: str = Field(..., min_length=1, max_length=128)
    dashboard_name: str = Field(..., min_length=1, max_length=256)
    dashboard_description: str | None = Field(default=None, max_length=1024)
    tableau_url: HttpUrl
    platform: str = Field(..., min_length=1, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    subcategory: str | None = Field(default=None, max_length=128)
    market: str | None = Field(default=None, max_length=128)
    country_code: str | None = Field(default=None, max_length=8)
    display_order: int = 0
    is_active: bool = True
    owner_name: str | None = Field(default=None, max_length=256)
    owner_email: EmailStr | None = None
    tags: list[str] = Field(default_factory=list)
    last_updated_at: datetime | None = None


class PlatformInfo(BaseModel):
    name: str
    label: str
    accent: str | None = None
    blurb: str | None = None
    dashboard_count: int = 0


class FilterOption(BaseModel):
    value: str
    label: str
    count: int = 0


class AvailableFilters(BaseModel):
    platforms: list[PlatformInfo] = Field(default_factory=list)
    categories: list[FilterOption] = Field(default_factory=list)
    markets: list[FilterOption] = Field(default_factory=list)


class DashboardListResponse(BaseModel):
    items: list[Dashboard]
    total: int
    page: int
    page_size: int
    available_filters: AvailableFilters
    source_refreshed_at: datetime | None = None


class MetadataResponse(BaseModel):
    active_dashboard_count: int
    platform_count: int
    market_count: int
    source_refreshed_at: datetime | None
    app_version: str
    tableau_allowed_hosts: list[str]
    tableau_open_in_new_tab: bool
    category_accent: str
    category_order: list[str] = Field(default_factory=list)
    # External support-link destinations (opened directly by the header).
    contact_mailto: str = ""
    feedback_url: str = ""


class AccessCatalogItem(BaseModel):
    """A curated dashboard the user can self-service request access for.

    The `request_url` points at an external form (typically Office Forms
    wrapped by Pfizer's urldefense.com link protection). Server-side
    validation drops any entry whose host is not on the allowlist.

    `meta` overrides the default "platform · category" subline in the UI -
    used by the "Other Dashboards" grouping which spans multiple platforms.
    """
    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=256)
    platform: str = Field(..., min_length=1, max_length=128)
    category: str | None = Field(default=None, max_length=128)
    icon_key: str = Field(default="chart", max_length=32)
    meta: str | None = Field(default=None, max_length=256)
    request_url: HttpUrl


class AccessCatalogResponse(BaseModel):
    items: list[AccessCatalogItem]
