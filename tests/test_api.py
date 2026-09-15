import sys
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure root import works
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.main import app

client = TestClient(app)

def test_health_check():
    """Verify service health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_endpoint_a_prices():
    """Endpoint a: GET /api/v1/prices?crop=wheat&state=maharashtra&days=30"""
    start = time.time()
    response = client.get("/api/v1/prices?crop=wheat&state=maharashtra&days=30")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500, f"Latency {latency}ms exceeded 500ms budget"

    data = response.json()
    assert "total" in data
    assert "data" in data
    assert isinstance(data["data"], list)
    if data["data"]:
        record = data["data"][0]
        assert record["crop_name"].lower() == "wheat"
        assert record["state"].lower() == "maharashtra"


def test_endpoint_b_mandis():
    """Endpoint b: GET /api/v1/mandis"""
    start = time.time()
    response = client.get("/api/v1/mandis")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    assert any("Lasalgaon" in m["name"] for m in data)


def test_endpoint_c_mandi_prices():
    """Endpoint c: GET /api/v1/mandis/{mandiId}/prices"""
    # First get a valid mandi ID
    mandis_resp = client.get("/api/v1/mandis")
    assert mandis_resp.status_code == 200
    first_mandi_id = mandis_resp.json()[0]["id"]

    start = time.time()
    response = client.get(f"/api/v1/mandis/{first_mandi_id}/prices?days=30")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert "mandi" in data
    assert "prices" in data
    assert data["mandi"]["id"] == first_mandi_id


def test_endpoint_c_mandi_prices_not_found():
    """Verify 404 response for invalid mandi ID."""
    response = client.get("/api/v1/mandis/999999/prices")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_endpoint_d_crop_trends():
    """Endpoint d: GET /api/v1/trends/{crop}?state=punjab&days=30"""
    start = time.time()
    response = client.get("/api/v1/trends/Wheat?state=punjab&days=30")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert data["crop"] == "Wheat"
    assert "overall_avg" in data
    assert "overall_min" in data
    assert "overall_max" in data
    assert "price_change_pct" in data
    assert "data" in data
    assert isinstance(data["data"], list)


def test_endpoint_e_buyers():
    """Endpoint e: GET /api/v1/buyers?crop=wheat&state=delhi"""
    start = time.time()
    response = client.get("/api/v1/buyers?crop=wheat")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for buyer in data:
        assert buyer["crop"].lower() == "wheat"
        assert "contact" in buyer


def test_endpoint_f_create_alert():
    """Endpoint f: POST /api/v1/alerts (create price alert)"""
    payload = {
        "user_id": "test_farmer_101",
        "crop": "Wheat",
        "threshold_price": 2550.0,
        "alert_type": "above"
    }
    start = time.time()
    response = client.post("/api/v1/alerts", json=payload)
    latency = (time.time() - start) * 1000

    assert response.status_code == 201
    assert latency < 500

    data = response.json()
    assert data["user_id"] == "test_farmer_101"
    assert data["crop"] == "Wheat"
    assert data["threshold_price"] == 2550.0
    assert data["alert_type"] == "above"
    assert "is_triggered" in data


def test_endpoint_g_get_user_alerts():
    """Endpoint g: GET /api/v1/alerts/{userId}"""
    start = time.time()
    response = client.get("/api/v1/alerts/farmer_ramesh")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first_alert = data[0]
    assert first_alert["user_id"] == "farmer_ramesh"
    assert "current_market_price" in first_alert
    assert "is_triggered" in first_alert


def test_endpoint_h_market_stats():
    """Endpoint h: GET /api/v1/stats"""
    start = time.time()
    response = client.get("/api/v1/stats")
    latency = (time.time() - start) * 1000

    assert response.status_code == 200
    assert latency < 500

    data = response.json()
    assert data["total_price_records"] >= 300
    assert data["total_mandis"] >= 10
    assert data["total_crops"] >= 5
    assert len(data["top_traded_crops"]) > 0
    assert "states_covered" in data


def test_validation_error():
    """Verify 422 on invalid alert payload."""
    invalid_payload = {
        "user_id": "",
        "crop": "Wheat",
        "threshold_price": -100,  # Invalid: negative
        "alert_type": "invalid_type"  # Invalid: must be above or below
    }
    response = client.post("/api/v1/alerts", json=invalid_payload)
    assert response.status_code == 422
