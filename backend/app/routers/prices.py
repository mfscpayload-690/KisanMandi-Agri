from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Crop
from backend.app.schemas import PriceListResponse, PriceResponse, CropResponse
from backend.app import crud

router = APIRouter(prefix="/api/v1", tags=["Prices & Crops"])

@router.get("/prices", response_model=PriceListResponse, summary="Discover crop prices across mandis")
def read_prices(
    crop: Optional[str] = Query(None, description="Crop name (e.g., wheat, onion)"),
    state: Optional[str] = Query(None, description="State (e.g., maharashtra, punjab)"),
    mandi: Optional[str] = Query(None, description="Mandi/APMC name"),
    days: Optional[int] = Query(None, ge=1, le=1000, description="Historical filter in days"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    sort_by: str = Query("date", description="Sort by field: date, price_per_unit, quantity"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    """
    Get paginated real-time and historical crop market prices with multi-parameter filtering.
    """
    allowed_sort = {"date", "price_per_unit", "quantity", "crop_name", "mandi_name"}
    if sort_by not in allowed_sort:
        sort_by = "date"

    total, records = crud.get_prices(
        db=db,
        crop=crop,
        state=state,
        mandi=mandi,
        days=days,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        order=order
    )
    
    page = (offset // limit) + 1 if limit > 0 else 1
    return PriceListResponse(
        total=total,
        page=page,
        limit=limit,
        data=records
    )

@router.get("/crops", response_model=List[CropResponse], summary="List all master crops")
def read_crops(db: Session = Depends(get_db)):
    """Retrieve all available crops for search dropdowns and filters."""
    crops = db.query(Crop).order_by(Crop.name).all()
    return crops
