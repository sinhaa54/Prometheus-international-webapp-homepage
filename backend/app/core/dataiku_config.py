"""
Prometheus-specific Dataiku configuration.

Reads DSS project variables lazily (only when first accessed so the module
can be imported locally without the dataiku package). Owns a process-level
singleton DatabaseClient so every repository shares one connection.

Required DSS project variables
───────────────────────────────
  PROJECT_KEY                  – DSS project key
  SNOWFLAKE_CONNECTION_NAME    – Named Snowflake connection in DSS
  database                     – Snowflake database name
  schema                       – Snowflake schema name
  DEFAULT_PROVIDER             – "dataiku" | "snowflake"  (default: "dataiku")
  PROMETHEUS_DASHBOARDS_TABLE  – Snowflake table for the dashboard catalog
                                 (default: "PROMETHEUS_DASHBOARDS")
  PROMETHEUS_SUBMISSIONS_TABLE – Snowflake table / DSS dataset for form submissions
                                 (default: "PROMETHEUS_SUBMISSIONS")

Optional DSS project variables
───────────────────────────────
  PROMETHEUS_ACCESS_CATALOG    – JSON array of access-catalog items (same
                                 shape as the local sample_dashboards.json
                                 access_catalog array). When set, overrides
                                 the hardcoded sample data in production.
"""
from __future__ import annotations

import json
import logging
import time

_log = logging.getLogger(__name__)


class DataikuConfig:
    """
    Lazy-loaded Prometheus configuration backed by DSS project variables.

    All class-level attributes are None until `_ensure_loaded()` is called,
    which happens automatically the first time any property or method is
    used. Import-time side-effects are intentionally avoided so that unit
    tests and local dev can import the module without the dataiku package.
    """

    # -- cached state --------------------------------------------------------
    _project_variables: dict | None = None
    _db_client_instance = None

    # -- internal helpers ----------------------------------------------------

    @classmethod
    def _ensure_loaded(cls) -> dict:
        """Load and cache DSS project variables once."""
        if cls._project_variables is None:
            import dataiku
            _t0 = time.perf_counter()
            project = dataiku.api_client().get_project(dataiku.default_project_key())
            cls._project_variables = project.get_variables()["standard"]
            _log.info(
                "DataikuConfig: project variables loaded in %.1f ms",
                (time.perf_counter() - _t0) * 1000,
            )
        return cls._project_variables

    @classmethod
    def _pv(cls) -> dict:
        """Alias for _ensure_loaded — keeps call-sites terse."""
        return cls._ensure_loaded()

    # -- database client -----------------------------------------------------

    @classmethod
    def get_db_client(cls, provider: str | None = None):
        """
        Return (and lazily create) the singleton DatabaseClient.

        The provider is resolved in priority order:
          1. explicit `provider` argument
          2. DSS project variable DEFAULT_PROVIDER
          3. falls back to "dataiku"
        """
        if cls._db_client_instance is None:
            pv = cls._pv()
            chosen = provider or pv.get("DEFAULT_PROVIDER") or "dataiku"
            _log.info("DataikuConfig: creating '%s' db client", chosen)
            _t0 = time.perf_counter()
            from .db_adapter import create_db_client
            cls._db_client_instance = create_db_client(chosen, pv)
            _log.info(
                "DataikuConfig: '%s' client ready in %.1f ms",
                chosen,
                (time.perf_counter() - _t0) * 1000,
            )
        return cls._db_client_instance

    # -- table/dataset names -------------------------------------------------

    @classmethod
    def get_dashboards_table(cls) -> str:
        """
        Fully-qualified Snowflake table path for the dashboard catalog.
        Format: <database>.<schema>.<table>
        """
        pv = cls._pv()
        db = pv.get("database", "")
        schema = pv.get("schema", "")
        table = pv.get("PROMETHEUS_DASHBOARDS_TABLE", "PROMETHEUS_DASHBOARDS")
        if db and schema:
            return f"{db}.{schema}.{table}"
        # Fallback: unqualified name (works if DSS connection already scopes
        # to the correct database/schema).
        return table

    @classmethod
    def get_submissions_dataset(cls) -> str:
        """
        Name of the DSS dataset (or Snowflake table) for form submissions.
        Only the table/dataset name — not fully qualified — because
        write_dataframe() is called via the Dataiku project API which
        resolves the connection automatically.
        """
        pv = cls._pv()
        return pv.get("PROMETHEUS_SUBMISSIONS_TABLE", "PROMETHEUS_SUBMISSIONS")

    # -- optional access catalog (project variable) --------------------------

    @classmethod
    def get_access_catalog_raw(cls) -> list[dict]:
        """
        Return the access-catalog item list from the DSS project variable
        PROMETHEUS_ACCESS_CATALOG, if defined.

        The variable may be stored as:
          - a JSON string   → json.loads()
          - a native list   → returned as-is (Dataiku parses JSON variables
                              automatically when entered as JSON in the UI)
          - absent / empty  → returns []

        Each item should match the AccessCatalogItem schema:
          { name, platform, category, icon_key, meta?, request_url }
        """
        pv = cls._pv()
        raw = pv.get("PROMETHEUS_ACCESS_CATALOG")
        if not raw:
            return []
        if isinstance(raw, list):
            return raw
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except Exception as exc:
            _log.warning("PROMETHEUS_ACCESS_CATALOG is not valid JSON: %s", exc)
            return []

    # -- reset (test helper) -------------------------------------------------

    @classmethod
    def _reset(cls) -> None:
        """Clear cached state — used in tests only."""
        cls._project_variables = None
        cls._db_client_instance = None
