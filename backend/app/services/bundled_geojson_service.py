import json
from pathlib import Path
from functools import lru_cache
from typing import Dict, Any, List, Optional

DATA_DIR = Path(__file__).parent.parent / "assets" / "data"

@lru_cache(maxsize=2)
def load_districts_geojson() -> Dict[str, Any]:
    """Loads and caches the 14 districts GeoJSON."""
    file_path = DATA_DIR / "kerala_districts.geojson"
    if not file_path.exists():
        raise FileNotFoundError(f"District GeoJSON not found at {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

@lru_cache(maxsize=2)
def load_taluks_geojson() -> Dict[str, Any]:
    """Loads and caches the 61+ taluks GeoJSON."""
    file_path = DATA_DIR / "kerala_taluks.geojson"
    if not file_path.exists():
        raise FileNotFoundError(f"Taluk GeoJSON not found at {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_districts(year: str = "2024", data_source: str = "bundled") -> Dict[str, Any]:
    """Returns districts FeatureCollection with year-specific RUSLE loss score."""
    fc = load_districts_geojson()
    # Create a copy so cached source isn't mutated
    features = []
    for feat in fc.get("features", []):
        props = dict(feat["properties"])
        ts = props.get("time_series", {})
        score = ts.get(str(year), props.get("rusle", {}).get("A", 10.0))
        props["active_year"] = str(year)
        props["active_soil_loss"] = score
        features.append({
            "type": "Feature",
            "id": feat.get("id"),
            "geometry": feat.get("geometry"),
            "properties": props
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

def get_district_by_id(district_id: str) -> Optional[Dict[str, Any]]:
    fc = load_districts_geojson()
    for feat in fc.get("features", []):
        if feat.get("id", "").lower() == district_id.lower() or feat.get("properties", {}).get("id", "").lower() == district_id.lower():
            return feat
    return None

def get_taluks(year: str = "2024", district: Optional[str] = None, data_source: str = "bundled") -> Dict[str, Any]:
    """Returns taluks FeatureCollection, optionally filtered by district."""
    fc = load_taluks_geojson()
    features = []
    for feat in fc.get("features", []):
        props = dict(feat["properties"])
        if district:
            d_name = props.get("district_name", "").lower()
            d_id = props.get("district_id", "").lower()
            target = district.lower()
            if d_name != target and d_id != target:
                continue
        ts = props.get("time_series", {})
        score = ts.get(str(year), props.get("rusle", {}).get("A", 10.0))
        props["active_year"] = str(year)
        props["active_soil_loss"] = score
        features.append({
            "type": "Feature",
            "id": feat.get("id"),
            "geometry": feat.get("geometry"),
            "properties": props
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }

def get_taluk_by_id(taluk_id: str) -> Optional[Dict[str, Any]]:
    fc = load_taluks_geojson()
    for feat in fc.get("features", []):
        if feat.get("id", "").lower() == taluk_id.lower() or feat.get("properties", {}).get("id", "").lower() == taluk_id.lower():
            return feat
    return None

def get_all_taluk_properties() -> List[Dict[str, Any]]:
    """Returns raw list of taluk properties for spatial calculations."""
    fc = load_taluks_geojson()
    return [feat["properties"] for feat in fc.get("features", [])]
