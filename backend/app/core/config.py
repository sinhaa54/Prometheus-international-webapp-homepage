"""Application configuration loaded from env vars / .env."""
from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- application ----
    app_env: str = "development"
    app_version: str = "0.1.0"
    api_prefix: str = "/api"
    api_timeout_seconds: int = 15
    log_level: str = "INFO"

    # ---- CORS ----
    frontend_origin: str = "http://localhost:5173"
    cors_allowed_origins: str = "http://localhost:5173"

    # ---- repositories ----
    dashboard_repository_mode: str = "local"          # local | dataiku
    dataiku_dataset_name: str = "PROMETHEUS_DASHBOARDS"
    submission_repository_mode: str = "local"         # local | dataiku
    submission_dataset_name: str = "PROMETHEUS_SUBMISSIONS"

    # ---- caching / pagination ----
    dashboard_cache_ttl_seconds: int = 60
    default_page_size: int = 50
    max_page_size: int = 500

    # ---- Tableau ----
    allowed_tableau_hosts: str = "tableau.pfizer.com,eu-west-1a.online.tableau.com,us-east-1.online.tableau.com"
    tableau_open_in_new_tab: bool = True

    # ---- Access-request catalog ----
    # Hosts allowed for external access-request URLs (Office Forms wrapped by
    # Pfizer's urldefense.com link protection). Any catalog entry whose URL
    # does not resolve to one of these hosts is dropped by the service.
    allowed_access_request_hosts: str = "forms.office.com,urldefense.com,forms.cloud.microsoft,rm.pfizer.com"

    # Uniform accent color used for the category chip strip in the UI.
    category_accent: str = "#3B9EDE"

    # ---- External support links (surfaced via /metadata) ----
    # "Contact us" is a mailto link; "Feedback" is an external Office Forms
    # URL. The frontend header opens these directly - no backend submission
    # is involved for either action anymore.
    contact_mailto: str = "mailto:DL-Prometheus_International_Operations@pfizer.com?subject=Prometheus%20%E2%80%94%20Analytics%20query"
    feedback_url: str = "https://forms.cloud.microsoft/r/EBBNExBV23"

    # ---- Dataiku base path ----
    dataiku_base_path: str = "/"

    # ---------- parsed helpers ----------
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def allowed_tableau_hosts_list(self) -> list[str]:
        return [h.strip().lower() for h in self.allowed_tableau_hosts.split(",") if h.strip()]

    @property
    def allowed_access_request_hosts_list(self) -> list[str]:
        return [h.strip().lower() for h in self.allowed_access_request_hosts.split(",") if h.strip()]

    @field_validator("dashboard_repository_mode", "submission_repository_mode")
    @classmethod
    def _lower(cls, v: str) -> str:
        return v.strip().lower()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
