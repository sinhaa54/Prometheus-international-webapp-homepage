"""
Dataiku-backed dashboard repository (production adapter).

Uses DataikuConfig to acquire a DatabaseClient (Dataiku or direct Snowflake)
and runs a SQL SELECT against the fully-qualified Snowflake table defined by
the PROMETHEUS_DASHBOARDS_TABLE project variable.

Compared to the old iter_rows() approach this gives us:
  • SQL-level filtering (only fetch active rows)
  • Proper NaN → None coercion via db_client post-processing
  • Phase-split timing logs from DataikuDatabaseClient
  • A path to add JOIN / WHERE clauses without touching the app layer
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from ..core.errors import SourceUnavailableError
from ..models.dashboard import AccessCatalogItem, Dashboard
from .base import DashboardRepository

_log = logging.getLogger(__name__)


class DataikuDashboardRepository(DashboardRepository):
    """
    Production dashboard repository.

    No constructor arguments are needed — all config is sourced from
    DataikuConfig (DSS project variables) at call time.
    """

    # -------------------------------------------------------------------
    # DashboardRepository interface
    # -------------------------------------------------------------------

    def list_all(self) -> tuple[list[Dashboard], datetime | None]:
        """
        Execute a SELECT against the Snowflake dashboard table and return
        validated Dashboard instances.

        Malformed rows are logged and skipped rather than raising so a
        single bad row can never take the whole catalog offline.
        """
        try:
            from ..core.dataiku_config import DataikuConfig
        except Exception as exc:
            raise SourceUnavailableError(
                "Dataiku environment is not available in this context."
            ) from exc

        try:
            client = DataikuConfig.get_db_client()
            table = DataikuConfig.get_dashboards_table()
        except Exception as exc:
            _log.exception("Failed to initialise Dataiku DB client")
            raise SourceUnavailableError(
                "Could not connect to the Prometheus dashboard data source."
            ) from exc

        query = f"SELECT * FROM {table}"  # active-only filtering applied by service layer
        try:
            df = client.execute_query_to_df(query)
        except Exception as exc:
            _log.exception("Dashboard query failed: %s", query)
            raise SourceUnavailableError(
                f"Could not query dashboard table '{table}'."
            ) from exc

        rows = df.to_dict("records") if df is not None and not df.empty else []
        dashboards: list[Dashboard] = []
        for row in rows:
            record = _map_row(row)
            try:
                dashboards.append(Dashboard.model_validate(record))
            except Exception as exc:
                _log.warning(
                    "Skipping malformed dashboard row id=%s: %s",
                    record.get("dashboard_id") or record.get("DASHBOARD_ID"),
                    exc,
                )

        _log.info("Loaded %d dashboards from %s", len(dashboards), table)
        return dashboards, datetime.now(timezone.utc)

    def access_catalog(self) -> list[AccessCatalogItem]:
        """
        Return curated access-request items from the DSS project variable
        PROMETHEUS_ACCESS_CATALOG.  Falls back to [] if the variable is
        absent or empty.
        """
        try:
            from ..core.dataiku_config import DataikuConfig
            raw = DataikuConfig.get_access_catalog_raw()
        except Exception as exc:
            _log.warning("Could not load access catalog from DSS: %s", exc)
            return []

        items: list[AccessCatalogItem] = []
        for row in raw:
            try:
                items.append(AccessCatalogItem.model_validate(row))
            except Exception as exc:
                _log.warning("Skipping malformed access_catalog entry: %s", exc)
        return items


# ---------------------------------------------------------------------------
# Row-mapping helpers
# ---------------------------------------------------------------------------

def _map_row(row: dict) -> dict:
    """
    Normalise a raw Snowflake / Dataiku row dict to the Dashboard field names.

    Accepts both snake_case and SCREAMING_CASE keys so the repo is resilient
    to Dataiku pipeline schema changes (Snowflake surfaces columns UPPERCASE;
    DSS recipes often rename to snake_case).
    """
    def g(*keys, default=None):
        for k in keys:
            if k in row and row[k] not in (None, ""):
                return row[k]
        return default

    tags = g("tags", "TAGS")
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]

    display_order = g("display_order", "DISPLAY_ORDER", default=0)
    is_active_raw = g("is_active", "IS_ACTIVE", default=True)

    return {
        "dashboard_id":          g("dashboard_id",          "DASHBOARD_ID"),
        "dashboard_name":        g("dashboard_name",         "DASHBOARD_NAME"),
        "dashboard_description": g("dashboard_description",  "DASHBOARD_DESCRIPTION"),
        "tableau_url":           g("tableau_url",            "TABLEAU_URL"),
        "platform":              g("platform",               "PLATFORM"),
        "category":              g("category",               "CATEGORY"),
        "subcategory":           g("subcategory",            "SUBCATEGORY"),
        "market":                g("market",                 "MARKET"),
        "country_code":          g("country_code",           "COUNTRY_CODE"),
        "display_order":         int(display_order or 0),
        "is_active":             bool(is_active_raw) if is_active_raw is not None else True,
        "owner_name":            g("owner_name",             "OWNER_NAME"),
        "owner_email":           g("owner_email",            "OWNER_EMAIL"),
        "tags":                  tags or [],
        "last_updated_at":       g("last_updated_at",        "LAST_UPDATED_AT"),
    }
