from typing import Optional
from fastapi import APIRouter, Depends, Query, Path, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas import TrendResponse
from backend.app import crud

router = APIRouter(prefix="/api/v1/trends", tags=["Price Trends"])

@router.get("/{crop}", response_model=TrendResponse, summary="Analyze historical price trends for a crop")
def read_crop_trends(
    crop: str = Path(..., description="Crop name (e.g., Wheat, Tomato, Onion)"),
    state: Optional[str] = Query(None, description="Filter trends by specific state"),
    days: Optional[int] = Query(30, ge=1, le=1000, description="Number of days to analyze"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Computes daily price aggregations (average, minimum, maximum, volume)
    along with overall metrics and percentage price variation.
    """
    trend_data = crud.get_crop_trends(
        db=db,
        crop=crop,
        state=state,
        days=days,
        start_date=start_date,
        end_date=end_date
    )
    if not trend_data["data"]:
        # Return structured response with empty data rather than 404 to support UI chart state cleanly
        return TrendResponse(**trend_data)
    return TrendResponse(**trend_data)
