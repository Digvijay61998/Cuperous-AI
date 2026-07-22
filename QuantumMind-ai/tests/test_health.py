"""Smoke tests for the service scaffold (no external deps required)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "running"


def test_healthcheck():
    r = client.get("/healthcheck")
    assert r.status_code == 200
    assert r.json()["status"] == 200
