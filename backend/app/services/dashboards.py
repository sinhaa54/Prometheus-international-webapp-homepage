"""Dashboard service: search / filter / sort / paginate + metadata aggregation."""
from __future__ import annotations

import logging
from datetime import datetime
from urllib.parse import urlparse

from ..core.cache import TTLCache
from ..core.config import get_settings
from ..integrations.tableau import is_valid_tableau_url
from ..models.dashboard import (
    AccessCatalogItem,
    AccessCatalogResponse,
    AvailableFilters,
    Dashboard,
    DashboardListResponse,
    FilterOption,
    MetadataResponse,
    PlatformInfo,
)
from ..repositories.base import DashboardRepository
from ..repositories.local_dashboards import LocalDashboardRepository

_log = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, repo: DashboardRepository, cache_ttl_seconds: int):
        self._repo = repo
        self._cache: TTLCache[tuple[list[Dashboard], datetime | None]] = TTLCache(cache_ttl_seconds)

    # ---- caching ----
    def _load(self) -> tuple[list[Dashboard], datetime | None]:
        return self._cache.get_or_set("all", self._repo.list_all)

    def invalidate_cache(self) -> None:
        self._cache.invalidate()

    # ---- queries ----
    def list_dashboards(
        self,
        *,
        search: str | None = None,
        platform: str | None = None,
        category: str | None = None,
        market: str | None = None,
        page: int = 1,
        page_size: int = 50,
        sort_by: str = "display_order",
        sort_direction: str = "asc",
        include_inactive: bool = False,
    ) -> DashboardListResponse:
        all_items, refreshed = self._load()
        items = [d for d in all_items if include_inactive or d.is_active]

        # Drop any dashboard whose Tableau URL is not in the allowlist - guards
        # against a corrupted / rogue row surfacing an unsafe redirect target.
        items = [d for d in items if is_valid_tableau_url(str(d.tableau_url))]

        # Filters
        if platform:
            items = [d for d in items if _eq(d.platform, platform)]
        if category:
            items = [d for d in items if _eq(d.category, category)]
        if market:
            items = [d for d in items if _eq(d.market, market)]

        # Search
        if search:
            q = search.lower().strip()
            def match(d: Dashboard) -> bool:
                fields: list[str] = [
                    d.dashboard_name or "",
                    d.dashboard_description or "",
                    d.platform or "",
                    d.category or "",
                    d.subcategory or "",
                    d.market or "",
                    " ".join(d.tags or []),
                ]
                return any(q in f.lower() for f in fields)
            items = [d for d in items if match(d)]

        # Sort
        reverse = sort_direction.lower() == "desc"
        key = _sort_key(sort_by)
        items.sort(key=key, reverse=reverse)

        total = len(items)

        # Available filters computed over the FILTERED result (excluding search text)
        # so users see counts consistent with active filters.
        available = self._build_filters(all_items)

        # Pagination
        settings = get_settings()
        page = max(1, page)
        page_size = max(1, min(page_size, settings.max_page_size))
        start = (page - 1) * page_size
        page_items = items[start:start + page_size]

        return DashboardListResponse(
            items=page_items,
            total=total,
            page=page,
            page_size=page_size,
            available_filters=available,
            source_refreshed_at=refreshed,
        )

    def get_dashboard(self, dashboard_id: str) -> Dashboard | None:
        all_items, _ = self._load()
        for d in all_items:
            if d.dashboard_id == dashboard_id:
                return d
        return None

    def metadata(self) -> MetadataResponse:
        settings = get_settings()
        items, refreshed = self._load()
        active = [d for d in items if d.is_active and is_valid_tableau_url(str(d.tableau_url))]
        platforms = {d.platform for d in active if d.platform}
        markets = {d.market for d in active if d.market}
        return MetadataResponse(
            active_dashboard_count=len(active),
            platform_count=len(platforms),
            market_count=len(markets),
            source_refreshed_at=refreshed,
            app_version=settings.app_version,
            tableau_allowed_hosts=settings.allowed_tableau_hosts_list,
            tableau_open_in_new_tab=settings.tableau_open_in_new_tab,
            category_accent=settings.category_accent,
            category_order=self._category_order(active),
            contact_mailto=settings.contact_mailto,
            feedback_url=settings.feedback_url,
        )

    def access_catalog(self) -> AccessCatalogResponse:
        """Curated dashboards eligible for self-service access requests.

        Entries whose `request_url` host is not on ALLOWED_ACCESS_REQUEST_HOSTS
        are dropped defensively so a bad data row can never surface an
        unapproved external redirect.
        """
        settings = get_settings()
        allowed = settings.allowed_access_request_hosts_list
        raw = self._repo.access_catalog()
        safe: list[AccessCatalogItem] = [
            item for item in raw if _is_allowed_access_url(str(item.request_url), allowed)
        ]
        if len(safe) != len(raw):
            _log.warning(
                "Dropped %d access_catalog entries not on host allowlist.",
                len(raw) - len(safe),
            )
        return AccessCatalogResponse(items=safe)

    # ---- category ordering ----
    def _category_order(self, active: list[Dashboard]) -> list[str]:
        # Prefer the repository-declared order (LocalDashboardRepository); fall
        # back to first-seen order in the dataset.
        declared: list[str] = []
        if isinstance(self._repo, LocalDashboardRepository):
            declared = self._repo.category_order()
        seen: list[str] = []
        for d in active:
            if d.category and d.category not in seen:
                seen.append(d.category)
        if not declared:
            return seen
        # Keep declared order; append any dataset categories not in declared.
        ordered = [c for c in declared if c in seen]
        ordered += [c for c in seen if c not in declared]
        return ordered

    # ---- filter building ----
    def _build_filters(self, all_items: list[Dashboard]) -> AvailableFilters:
        active = [d for d in all_items if d.is_active]

        # Platform metadata (optional; only local repo currently exposes it)
        platforms_meta: list[dict] = []
        if isinstance(self._repo, LocalDashboardRepository):
            platforms_meta = self._repo.platforms_metadata()
        meta_by_name = {m.get("name"): m for m in platforms_meta}

        # Compute counts by first-seen order
        seen_platforms: dict[str, int] = {}
        seen_categories: dict[str, int] = {}
        seen_markets: dict[str, int] = {}
        for d in active:
            if d.platform:
                seen_platforms[d.platform] = seen_platforms.get(d.platform, 0) + 1
            if d.category:
                seen_categories[d.category] = seen_categories.get(d.category, 0) + 1
            if d.market:
                seen_markets[d.market] = seen_markets.get(d.market, 0) + 1

        platforms = []
        for name, count in sorted(seen_platforms.items(), key=lambda kv: kv[0]):
            meta = meta_by_name.get(name, {})
            platforms.append(PlatformInfo(
                name=name,
                label=meta.get("label") or name,
                accent=meta.get("accent"),
                blurb=meta.get("blurb"),
                dashboard_count=count,
            ))
        categories = [FilterOption(value=k, label=k, count=v)
                      for k, v in sorted(seen_categories.items(), key=lambda kv: kv[0])]
        markets = [FilterOption(value=k, label=k, count=v)
                   for k, v in sorted(seen_markets.items(), key=lambda kv: kv[0])]
        return AvailableFilters(platforms=platforms, categories=categories, markets=markets)


def _eq(a: str | None, b: str | None) -> bool:
    return (a or "").strip().lower() == (b or "").strip().lower()


def _is_allowed_access_url(url: str, allowed_hosts: list[str]) -> bool:
    """HTTPS + exact-host allowlist check, mirroring the Tableau validator."""
    if not url:
        return False
    try:
        parsed = urlparse(url)
    except Exception:                                    # noqa: BLE001
        return False
    if parsed.scheme.lower() != "https":
        return False
    host = (parsed.hostname or "").lower()
    return bool(host) and host in allowed_hosts


def _sort_key(field: str):
    f = (field or "display_order").lower()
    def key(d: Dashboard):
        if f == "name":
            return (d.dashboard_name or "").lower()
        if f == "platform":
            return ((d.platform or "").lower(), d.display_order or 0)
        if f == "last_updated_at":
            return d.last_updated_at.isoformat() if d.last_updated_at else ""
        # default
        return (d.display_order or 0, (d.dashboard_name or "").lower())
    return key
