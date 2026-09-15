from typing import List
from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas import PriceAlertCreate, PriceAlertResponse
from backend.app import crud

router = APIRouter(prefix="/api/v1/alerts", tags=["Price Alerts"])

@router.post("", response_model=PriceAlertResponse, status_code=status.HTTP_201_CREATED, summary="Create price alert")
def create_alert(
    alert_in: PriceAlertCreate,
    db: Session = Depends(get_db)
):
    """
    Set a target price notification alert for a specific crop (above or below threshold).
    """
    new_alert = crud.create_price_alert(db, alert_in=alert_in)
    # Fetch enriched alert with latest price info
    user_alerts = crud.get_alerts_by_user(db, user_id=new_alert.user_id)
    created = next((a for a in user_alerts if a["id"] == new_alert.id), None)
    if created:
        return PriceAlertResponse(**created)
    return PriceAlertResponse(
        id=new_alert.id,
        user_id=new_alert.user_id,
        crop=new_alert.crop,
        threshold_price=new_alert.threshold_price,
        alert_type=new_alert.alert_type,
        created_at=new_alert.created_at,
        current_market_price=None,
        is_triggered=False
    )


@router.get("/{userId}", response_model=List[PriceAlertResponse], summary="Get user price alerts")
def read_user_alerts(
    userId: str = Path(..., description="Unique User/Farmer identifier"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all active price alerts for a user, indicating whether current market prices meet the threshold.
    """
    alerts = crud.get_alerts_by_user(db, user_id=userId)
    return [PriceAlertResponse(**a) for a in alerts]


@router.delete("/{alertId}", status_code=status.HTTP_200_OK, summary="Delete a price alert")
def remove_alert(
    alertId: int = Path(..., description="Alert ID to delete", gt=0),
    db: Session = Depends(get_db)
):
    """Delete a price alert by ID."""
    success = crud.delete_alert(db, alert_id=alertId)
    if not success:
        raise HTTPException(status_code=404, detail=f"Price alert {alertId} not found")
    return {"message": "Alert deleted successfully", "id": alertId}
