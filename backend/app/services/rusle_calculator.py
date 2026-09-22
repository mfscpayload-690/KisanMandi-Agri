"""
RUSLE Scientific Model and Zonal Statistics Service
Implements: A = R × K × LS × C × P
Calculates annual soil loss in metric tons / hectare / year (t/ha/yr)
and classifies into ICAR / NBSS&LUP severity risk tiers.
"""

from typing import List, Dict, Any, Tuple

THRESHOLDS: List[Tuple[str, float, float]] = [
    ("Low", 0.0, 5.0),
    ("Moderate", 5.0, 10.0),
    ("High", 10.0, 20.0),
    ("Severe", 20.0, 40.0),
    ("Very Severe", 40.0, float("inf")),
]

def calculate_rusle(R: float, K: float, LS: float, C: float, P: float) -> float:
    """
    Computes annual soil loss using the Revised Universal Soil Loss Equation.
    A = R × K × LS × C × P
    """
    return round(float(R) * float(K) * float(LS) * float(C) * float(P), 2)

def categorize(soil_loss: float) -> str:
    """
    Categorizes soil loss score according to ICAR / NBSS&LUP standard thresholds:
    - Low: < 5 t/ha/yr (#2ECC71)
    - Moderate: 5–10 t/ha/yr (#F1C40F)
    - High: 10–20 t/ha/yr (#E67E22)
    - Severe: 20–40 t/ha/yr (#E74C3C)
    - Very Severe: ≥ 40 t/ha/yr (#8E44AD)
    """
    loss = float(soil_loss)
    for name, lo, hi in THRESHOLDS:
        if lo <= loss < hi:
            return name
    return "Very Severe"

def simulate_conservation(baseline_loss: float, baseline_p: float, simulated_p: float) -> Dict[str, Any]:
    """
    Simulates the impact of adopting support conservation practices (contour bunding,
    terrace farming, vegetative hedgerows) by altering the P-factor.
    """
    if baseline_p <= 0:
        baseline_p = 1.0
    
    # A_new = A_base * (P_new / P_base)
    simulated_loss = round(baseline_loss * (simulated_p / baseline_p), 2)
    reduction_pct = round(max(0.0, ((baseline_loss - simulated_loss) / baseline_loss) * 100), 1) if baseline_loss > 0 else 0.0
    
    return {
        "baseline_loss": baseline_loss,
        "simulated_loss": simulated_loss,
        "reduction_pct": reduction_pct,
        "p_factor_used": round(simulated_p, 2),
        "baseline_category": categorize(baseline_loss),
        "simulated_category": categorize(simulated_loss),
    }

def compute_roi_stats(lat: float, lng: float, radius_km: float, all_taluks: List[Dict[str, Any]], year: str = "2024") -> Dict[str, Any]:
    """
    Computes spatial circle Area of Interest (ROI) zonal statistics across intersecting taluks.
    Uses bounding box and centroid distance approximations.
    """
    import math

    area_sq_km = round(math.pi * (radius_km ** 2), 1)
    lat_deg_delta = radius_km / 111.0
    lng_deg_delta = radius_km / (111.0 * math.cos(math.radians(lat)))

    matching = []
    for t in all_taluks:
        c_lat = t.get("centroid", {}).get("lat", t.get("lat"))
        c_lng = t.get("centroid", {}).get("lng", t.get("lng"))
        
        if c_lat is None or c_lng is None:
            # Fallback to bbox if centroid missing
            min_lat = t.get("min_lat", 8.0)
            max_lat = t.get("max_lat", 13.0)
            min_lng = t.get("min_lng", 74.5)
            max_lng = t.get("max_lng", 77.5)
            if not (max_lat < lat - lat_deg_delta or min_lat > lat + lat_deg_delta or
                    max_lng < lng - lng_deg_delta or min_lng > lng + lng_deg_delta):
                matching.append(t)
            continue
        
        # Haversine distance from ROI center to taluk centroid
        dlat = math.radians(c_lat - lat)
        dlng = math.radians(c_lng - lng)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(c_lat)) * math.sin(dlng / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist_km = 6371.0 * c
        
        # Within radius + a small buffer (approximate taluk extent radius)
        taluk_radius = math.sqrt(t.get("area_sq_km", 400.0) / math.pi)
        if dist_km <= (radius_km + taluk_radius * 0.75):
            matching.append(t)

    if not matching:
        # Default midland baseline if tapped just outside covered bounds
        mean_loss = 8.5
        return {
            "area_sq_km": area_sq_km,
            "mean_loss": mean_loss,
            "min_loss": 5.0,
            "max_loss": 12.0,
            "total_tons_per_year": int(mean_loss * area_sq_km * 100),
            "intersecting_regions": ["Kerala Midland Zone"],
            "dominant_risk": "Moderate",
            "conservation_priority": "Routine Catchment Management",
            "matching_count": 0
        }

    scores = []
    for t in matching:
        ts = t.get("time_series", {})
        score = ts.get(str(year), t.get("rusle", {}).get("A", 15.0))
        if isinstance(score, dict):
            score = score.get("soilLossScore", 15.0)
        scores.append(float(score))

    mean_loss = round(sum(scores) / len(scores), 1)
    min_loss = round(min(scores), 1)
    max_loss = round(max(scores), 1)
    total_tons = int(mean_loss * area_sq_km * 100) # 1 ha = 0.01 km², so * 100

    priority = "Routine Catchment Management"
    if mean_loss >= 30.0 or max_loss >= 50.0:
        priority = "URGENT: Extreme Mass-Wasting & Gully Hazard"
    elif mean_loss >= 15.0:
        priority = "HIGH: Active Topsoil Runoff Mitigation Required"
    elif mean_loss >= 8.0:
        priority = "MODERATE: Contour Hedging & Vegetative Cover Recommended"

    intersecting_names = [f"{t.get('taluk_name', 'Region')} ({t.get('district_name', 'District')})" for t in matching[:8]]
    if len(matching) > 8:
        intersecting_names.append(f"+{len(matching) - 8} additional taluks")

    return {
        "area_sq_km": area_sq_km,
        "mean_loss": mean_loss,
        "min_loss": min_loss,
        "max_loss": max_loss,
        "total_tons_per_year": total_tons,
        "intersecting_regions": intersecting_names,
        "dominant_risk": categorize(mean_loss),
        "conservation_priority": priority,
        "matching_count": len(matching)
    }
