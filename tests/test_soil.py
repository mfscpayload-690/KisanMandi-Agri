import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.rusle_calculator import calculate_rusle, categorize, simulate_conservation, compute_roi_stats

client = TestClient(app)

def test_rusle_calculate_formula():
    # A = R * K * LS * C * P
    # R=3000, K=0.028, LS=5.0, C=0.15, P=0.75 -> 3000 * 0.028 * 5.0 * 0.15 * 0.75 = 47.25
    result = calculate_rusle(3000, 0.028, 5.0, 0.15, 0.75)
    assert result == pytest.approx(47.25, abs=0.05)
    # With R=600:
    assert calculate_rusle(600, 0.028, 5.0, 0.15, 0.75) == pytest.approx(9.45, abs=0.05)

def test_categorize_thresholds():
    assert categorize(3.0) == "Low"
    assert categorize(7.5) == "Moderate"
    assert categorize(15.0) == "High"
    assert categorize(30.0) == "Severe"
    assert categorize(45.0) == "Very Severe"

def test_simulate_conservation():
    res = simulate_conservation(baseline_loss=50.0, baseline_p=0.70, simulated_p=0.45)
    assert res["simulated_loss"] < 50.0
    assert res["reduction_pct"] > 30.0
    assert res["simulated_category"] in ["Low", "Moderate", "High", "Severe", "Very Severe"]

def test_soil_health_endpoint():
    r = client.get("/api/v1/soil/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "online"
    assert data["district_count"] == 14
    assert data["taluk_count"] >= 61
    assert "2024" in data["available_years"]

def test_districts_endpoint():
    r = client.get("/api/v1/districts?year=2024")
    assert r.status_code == 200
    fc = r.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) == 14
    first = fc["features"][0]
    assert "properties" in first
    props = first["properties"]
    assert "district_name" in props
    assert "rusle" in props
    assert "time_series" in props
    assert "2024" in props["time_series"]

def test_taluks_endpoint():
    r = client.get("/api/v1/taluks?year=2024")
    assert r.status_code == 200
    fc = r.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) >= 61
    first = fc["features"][0]
    props = first["properties"]
    assert "elevation_m" in props
    assert "slope_degrees" in props

def test_taluk_filter_by_district():
    r = client.get("/api/v1/taluks?district=wayanad")
    assert r.status_code == 200
    fc = r.json()
    assert len(fc["features"]) == 3
    names = [f["properties"]["taluk_name"] for f in fc["features"]]
    assert "Vythiri" in names

def test_roi_calculate_endpoint():
    payload = {
        "lat": 10.45,
        "lng": 76.52,
        "radius_km": 15.0,
        "year": "2024"
    }
    r = client.post("/api/v1/roi/calculate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "area_sq_km" in data
    assert data["area_sq_km"] > 0
    assert "mean_loss" in data
    assert "total_tons_per_year" in data
    assert "dominant_risk" in data
    assert "conservation_priority" in data

def test_rusle_simulate_endpoint():
    r = client.get("/api/v1/rusle/simulate?p_factor=0.5&baseline_loss=20.0")
    assert r.status_code == 200
    data = r.json()
    assert data["simulated_loss"] < 20.0
    assert data["reduction_pct"] > 0
