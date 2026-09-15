from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Buyer
from backend.app.schemas import BuyerResponse, BuyerCreate
from backend.app import crud

router = APIRouter(prefix="/api/v1/buyers", tags=["Buyer Directory"])

@router.get("", response_model=List[BuyerResponse], summary="List verified buyers")
def read_buyers(
    crop: Optional[str] = Query(None, description="Filter buyers by purchasing crop"),
    state: Optional[str] = Query(None, description="Filter buyers by state/location"),
    db: Session = Depends(get_db)
):
    """
    Retrieve verified agricultural buyers, aggregators, and institutional traders.
    """
    return crud.get_buyers(db, crop=crop, state=state)


@router.post("", response_model=BuyerResponse, status_code=201, summary="Register a verified buyer")
def create_buyer(
    buyer_in: BuyerCreate,
    db: Session = Depends(get_db)
):
    """Add a new buyer profile to the directory."""
    buyer = Buyer(
        name=buyer_in.name,
        crop=buyer_in.crop,
        min_quantity=buyer_in.min_quantity,
        location=buyer_in.location,
        contact=buyer_in.contact
    )
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer
