from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas import MandiResponse, MandiPricesResponse
from backend.app import crud

router = APIRouter(prefix="/api/v1/mandis", tags=["Mandis"])

@router.get("", response_model=List[MandiResponse], summary="List all mandis/APMCs")
def read_mandis(
    state: Optional[str] = Query(None, description="Filter mandis by state"),
    db: Session = Depends(get_db)
):
    """Retrieve list of registered APMC mandis across India."""
    return crud.get_mandis(db, state=state)


@router.get("/{mandiId}/prices", response_model=MandiPricesResponse, summary="Get prices for a specific mandi")
def read_mandi_prices(
    mandiId: int = Path(..., description="Unique Mandi ID", gt=0),
    days: Optional[int] = Query(30, ge=1, le=365, description="Filter by past N days"),
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    db: Session = Depends(get_db)
):
    """Retrieve latest price arrivals and trade history for a specific mandi."""
    mandi = crud.get_mandi_by_id(db, mandi_id=mandiId)
    if not mandi:
        raise HTTPException(status_code=404, detail=f"Mandi with ID {mandiId} not found")

    total, prices = crud.get_mandi_prices(db, mandi_name=mandi.name, days=days, limit=limit)
    return MandiPricesResponse(
        mandi=mandi,
        total_records=total,
        prices=prices
    )
