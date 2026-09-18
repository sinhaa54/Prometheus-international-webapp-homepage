from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["dashboard_repository_mode"] == "local"


def test_list_dashboards_returns_items():
    r = client.get("/api/v1/dashboards")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    assert len(body["items"]) > 0
    assert "available_filters" in body
    assert body["available_filters"]["platforms"]


def test_dashboard_search_and_filter():
    r = client.get("/api/v1/dashboards", params={"search": "germany"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    names = [d["dashboard_name"].lower() for d in body["items"]]
    assert any("germany" in n for n in names)

    r2 = client.get("/api/v1/dashboards", params={"platform": "T&C Global"})
    assert r2.status_code == 200
    body2 = r2.json()
    assert all(d["platform"] == "T&C Global" for d in body2["items"])


def test_dashboard_pagination():
    r = client.get("/api/v1/dashboards", params={"page": 1, "page_size": 2})
    assert r.status_code == 200
    body = r.json()
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert len(body["items"]) == 2


def test_dashboard_detail_and_404():
    r = client.get("/api/v1/dashboards/TCG-ENT-001")
    assert r.status_code == 200
    assert r.json()["dashboard_id"] == "TCG-ENT-001"

    r2 = client.get("/api/v1/dashboards/DOES-NOT-EXIST")
    assert r2.status_code == 404


def test_metadata_counts():
    r = client.get("/api/v1/metadata")
    assert r.status_code == 200
    body = r.json()
    assert body["active_dashboard_count"] > 0
    assert body["platform_count"] >= 3
    assert body["market_count"] >= 1
    assert "tableau.pfizer.com" in body["tableau_allowed_hosts"]
