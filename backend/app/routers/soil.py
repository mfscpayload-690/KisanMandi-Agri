"""
Kerala Soil Erosion Monitor API Router
Provides spatial GeoJSON and RUSLE analytical endpoints for
14 districts, 61+ taluks, custom circle ROI zonal statistics, and P-factor simulations.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Response, status
from pydantic import BaseModel, Field

from backend.app.services.bundled_geojson_service import (
    get_districts,
    get_district_by_id,
    get_taluks,
    get_taluk_by_id,
    get_all_taluk_properties,
)
from backend.app.services.rusle_calculator import (
    calculate_rusle,
    categorize,
    simulate_conservation,
    compute_roi_stats,
)

router = APIRouter(prefix="/api/v1", tags=["Soil Erosion Monitor"])

class RoiRequest(BaseModel):
    lat: float = Field(..., description="Center latitude of inspection circle (e.g. 10.45)")
    lng: float = Field(..., description="Center longitude of inspection circle (e.g. 76.52)")
    radius_km: float = Field(default=10.0, description="Inspection radius in kilometers")
    year: str = Field(default="2024", description="Target evaluation year (2018-2024)")

@router.get("/soil/health")
def soil_health():
    """Returns status of the Soil Erosion Monitor service and available datasets."""
    taluks = get_all_taluk_properties()
    return {
        "status": "online",
        "data_mode": "bundled",
        "gee_connected": False,
        "district_count": 14,
        "taluk_count": len(taluks),
        "available_years": ["2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        "model": "RUSLE (A = R × K × LS × C × P)"
    }

@router.get("/districts")
def list_districts(
    year: str = Query("2024", description="Year for soil loss calculations (2018-2024)"),
    data_source: str = Query("bundled", description="Data source mode: bundled, gee_proxy, bhuvan_wms")
):
    """Returns GeoJSON FeatureCollection of the 14 Kerala districts with RUSLE factors."""
    return get_districts(year=year, data_source=data_source)

@router.get("/districts/{district_id}")
def get_district(district_id: str):
    """Returns single district GeoJSON feature by ID."""
    dist = get_district_by_id(district_id)
    if not dist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"District '{district_id}' not found.")
    return dist

@router.get("/taluks")
def list_taluks(
    year: str = Query("2024", description="Year for soil loss calculations (2018-2024)"),
    district: Optional[str] = Query(None, description="Optional filter by district name or ID"),
    data_source: str = Query("bundled", description="Data source mode: bundled, gee_proxy, bhuvan_wms")
):
    """Returns GeoJSON FeatureCollection of Kerala taluks with micro-topographic metrics."""
    return get_taluks(year=year, district=district, data_source=data_source)

@router.get("/taluks/{taluk_id}")
def get_taluk(taluk_id: str):
    """Returns single taluk GeoJSON feature by ID."""
    t = get_taluk_by_id(taluk_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Taluk '{taluk_id}' not found.")
    return t

@router.post("/roi/calculate")
def calculate_custom_roi(payload: RoiRequest):
    """
    Computes spatial circle Area of Interest (ROI) zonal statistics
    across all intersecting taluks for the given radius.
    """
    all_taluks = get_all_taluk_properties()
    stats_result = compute_roi_stats(
        lat=payload.lat,
        lng=payload.lng,
        radius_km=payload.radius_km,
        all_taluks=all_taluks,
        year=payload.year
    )
    return stats_result

@router.get("/rusle/simulate")
def simulate_rusle_practice(
    p_factor: float = Query(..., ge=0.35, le=1.0, description="Target conservation practice factor (0.35 - 1.0)"),
    district_id: Optional[str] = Query(None, description="District ID to simulate"),
    baseline_loss: Optional[float] = Query(None, description="Explicit baseline loss to simulate from"),
    year: str = Query("2024", description="Year context")
):
    """
    Simulates the conservation benefit of adopting terrace bunding or vegetative strips.
    """
    base_loss = baseline_loss
    base_p = 0.70

    if base_loss is None and district_id:
        dist = get_district_by_id(district_id)
        if dist:
            props = dist.get("properties", {})
            base_loss = props.get("time_series", {}).get(str(year), props.get("rusle", {}).get("A", 18.0))
            base_p = props.get("rusle", {}).get("P", 0.70)
    
    if base_loss is None:
        base_loss = 22.0

    return simulate_conservation(
        baseline_loss=float(base_loss),
        baseline_p=float(base_p),
        simulated_p=float(p_factor)
    )

@router.get("/layers/bhuvan-wms")
async def proxy_bhuvan_wms(
    service: str = "WMS",
    version: str = "1.1.1",
    request: str = "GetMap",
    layers: str = "lulc:KL_LULC50K_1516",
    styles: str = "",
    bbox: str = "",
    width: int = 256,
    height: int = 256,
    srs: str = "EPSG:3857",
    format: str = "image/png",
    transparent: str = "true"
):
    """
    Proxies live raster requests to official ISRO Bhuvan NRSC Web Map Service (WMS).
    Connects to Natural Resources Census layers (e.g. Kerala Land Use & Land Cover KL_LULC50K_1516).
    """
    import urllib.request
    from urllib.parse import urlencode

    query_params = {
        "SERVICE": service,
        "VERSION": version,
        "REQUEST": request,
        "LAYERS": layers or "lulc:KL_LULC50K_1516",
        "STYLES": styles,
        "BBOX": bbox,
        "WIDTH": width,
        "HEIGHT": height,
        "SRS": srs,
        "FORMAT": format,
        "TRANSPARENT": transparent
    }
    bhuvan_target_url = f"https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms?{urlencode(query_params)}"

    try:
        req = urllib.request.Request(
            bhuvan_target_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KisanMandi-Agri/1.0",
                "Accept": "image/png,image/*;q=0.8"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            tile_bytes = resp.read()
            return Response(content=tile_bytes, media_type="image/png")
    except Exception as e:
        # Fallback 1x1 transparent PNG if network latency or Bhuvan rate limit occurs
        transparent_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
        return Response(content=transparent_png_bytes, media_type="image/png")
