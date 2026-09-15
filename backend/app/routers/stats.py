from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas import StatsResponse
from backend.app.services.cache import cache
from backend.app import crud

router = APIRouter(prefix="/api/v1/stats", tags=["Market Statistics"])

@router.get("", response_model=StatsResponse, summary="Get high-level market statistics")
def read_stats(db: Session = Depends(get_db)):
    """
    Retrieve market overview metrics including total prices recorded,
    active mandis count, states covered, top traded crops by volume, and latest update.
    Cached for 5s to optimize high-frequency mobile polling.
    """
    cached_data = cache.get("market_stats")
    if cached_data is not None:
        return cached_data

    stats_data = crud.get_market_statistics(db)
    result = StatsResponse(**stats_data)
    cache.set("market_stats", result, ttl=5.0)
    return result
