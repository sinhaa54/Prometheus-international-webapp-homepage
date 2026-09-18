from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


def test_access_request_ok():
    r = client.post("/api/v1/access-requests", json={
        "name": "Alex Morgan",
        "email": "alex@pfizer.com",
        "platform": "T&C Global",
        "dashboard_id": "TCG-ENT-001",
        "reason": "Need to review enterprise contracts",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["submission_type"] == "access"
    assert body["request_id"].startswith("REQ-")


def test_feedback_validation():
    r = client.post("/api/v1/feedback", json={"message": ""})
    assert r.status_code == 422

    r2 = client.post("/api/v1/feedback", json={"message": "Working well", "rating": 4})
    assert r2.status_code == 201


def test_contact_ok():
    r = client.post("/api/v1/contact", json={
        "name": "Sam Lee", "email": "sam@pfizer.com",
        "subject": "Data refresh", "message": "When does data refresh?",
    })
    assert r.status_code == 201


def test_contact_invalid_email():
    r = client.post("/api/v1/contact", json={
        "name": "Sam", "email": "not-an-email", "message": "hi",
    })
    assert r.status_code == 422
