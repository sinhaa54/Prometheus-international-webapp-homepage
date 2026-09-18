"""Tests for the /api/v1/access-catalog endpoint."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(monkeypatch, tmp_path: Path) -> TestClient:
    # Isolated dataset with 2 valid entries + 1 disallowed-host entry.
    data = {
        "source_refreshed_at": "2026-09-01T06:00:00Z",
        "platforms": [{"name": "T&C Global", "label": "T&C Global"}],
        "access_catalog": [
            {
                "name": "OK Forms",
                "platform": "T&C Global",
                "category": "Commercial",
                "icon_key": "chart",
                "request_url": "https://forms.office.com/r/abc",
            },
            {
                "name": "OK URLDefense",
                "platform": "T&C Global",
                "category": "Commercial",
                "icon_key": "chart",
                "request_url": "https://urldefense.com/v3/__https://forms.office.com/r/xyz__",
            },
            {
                "name": "BAD Host",
                "platform": "T&C Global",
                "category": "Commercial",
                "icon_key": "chart",
                "request_url": "https://evil.example.com/steal",
            },
        ],
        "dashboards": [
            {
                "dashboard_id": "D1",
                "dashboard_name": "D1",
                "tableau_url": "https://tableau.pfizer.com/views/x",
                "platform": "T&C Global",
                "category": "Commercial",
                "display_order": 1,
                "is_active": True,
                "tags": [],
            }
        ],
    }
    path = tmp_path / "sample.json"
    path.write_text(json.dumps(data), encoding="utf-8")

    monkeypatch.setenv("DASHBOARD_REPOSITORY_MODE", "local")
    monkeypatch.setenv("ALLOWED_ACCESS_REQUEST_HOSTS", "forms.office.com,urldefense.com")

    # Rebuild service singletons with an overridden data path.
    from app import dependencies
    from app.core import config as config_mod
    from app.main import create_app
    from app.repositories.local_dashboards import LocalDashboardRepository
    from app.services.dashboards import DashboardService

    config_mod.get_settings.cache_clear()  # type: ignore[attr-defined]
    dependencies._dashboard_service = DashboardService(  # type: ignore[attr-defined]
        LocalDashboardRepository(path),
        cache_ttl_seconds=0,
    )
    dependencies._submission_service = None  # type: ignore[attr-defined]
    return TestClient(create_app())


def test_catalog_returns_allowed_hosts_only(client: TestClient):
    r = client.get("/api/v1/access-catalog")
    assert r.status_code == 200
    body = r.json()
    names = [item["name"] for item in body["items"]]
    assert names == ["OK Forms", "OK URLDefense"]
    assert "BAD Host" not in names


def test_metadata_includes_category_accent_order_and_support_links(client: TestClient, monkeypatch):
    monkeypatch.setenv("CONTACT_MAILTO", "mailto:foo@example.com")
    monkeypatch.setenv("FEEDBACK_URL", "https://forms.office.com/r/feedback")
    from app.core import config as config_mod
    config_mod.get_settings.cache_clear()  # type: ignore[attr-defined]

    r = client.get("/api/v1/metadata")
    assert r.status_code == 200
    body = r.json()
    assert body["category_accent"].startswith("#")
    assert isinstance(body["category_order"], list)
    assert "Commercial" in body["category_order"]
    assert body["contact_mailto"] == "mailto:foo@example.com"
    assert body["feedback_url"] == "https://forms.office.com/r/feedback"
