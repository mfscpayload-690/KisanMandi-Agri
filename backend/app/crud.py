from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from backend.app.models import Price, Mandi, Crop, Buyer, PriceAlert
from backend.app.schemas import PriceAlertCreate

def get_prices(
    db: Session,
    crop: Optional[str] = None,
    state: Optional[str] = None,
    mandi: Optional[str] = None,
    days: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "date",
    order: str = "desc"
) -> Tuple[int, List[Price]]:
    """Fetch paginated prices with dynamic filters."""
    query = db.query(Price)

    if crop:
        query = query.filter(func.lower(Price.crop_name) == crop.strip().lower())
    if state:
        query = query.filter(func.lower(Price.state) == state.strip().lower())
    if mandi:
        query = query.filter(func.lower(Price.mandi_name).contains(mandi.strip().lower()))

    if start_date:
        query = query.filter(Price.date >= start_date)
    elif days and days > 0:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        query = query.filter(Price.date >= cutoff_date)

    if end_date:
        query = query.filter(Price.date <= end_date)

    total = query.count()

    # Dynamic sorting
    sort_col = getattr(Price, sort_by, Price.date)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col), asc(Price.id))
    else:
        query = query.order_by(desc(sort_col), desc(Price.id))

    prices = query.offset(offset).limit(limit).all()
    return total, prices


def get_mandis(db: Session, state: Optional[str] = None) -> List[Mandi]:
    """Retrieve list of mandis with optional state filter."""
    query = db.query(Mandi)
    if state:
        query = query.filter(func.lower(Mandi.state) == state.strip().lower())
    return query.order_by(Mandi.state, Mandi.name).all()


def get_mandi_by_id(db: Session, mandi_id: int) -> Optional[Mandi]:
    """Retrieve a single mandi by ID."""
    return db.query(Mandi).filter(Mandi.id == mandi_id).first()


def get_mandi_prices(
    db: Session,
    mandi_name: str,
    days: Optional[int] = 30,
    limit: int = 50
) -> Tuple[int, List[Price]]:
    """Retrieve recent prices recorded at a specific mandi."""
    query = db.query(Price).filter(Price.mandi_name == mandi_name)
    if days and days > 0:
        cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
        query = query.filter(Price.date >= cutoff_date)

    total = query.count()
    prices = query.order_by(desc(Price.date), desc(Price.id)).limit(limit).all()
    return total, prices


def get_crop_trends(
    db: Session,
    crop: str,
    state: Optional[str] = None,
    days: Optional[int] = 30,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """Calculate daily price aggregation and trend metrics for a crop."""
    daily_stats = (
        db.query(
            Price.date,
            func.avg(Price.price_per_unit).label("avg_price"),
            func.min(Price.min_price).label("min_price"),
            func.max(Price.max_price).label("max_price"),
            func.sum(Price.quantity).label("total_quantity")
        )
        .filter(func.lower(Price.crop_name) == crop.strip().lower())
    )

    if state:
        daily_stats = daily_stats.filter(func.lower(Price.state) == state.strip().lower())

    if start_date:
        daily_stats = daily_stats.filter(Price.date >= start_date)
    elif days and days > 0:
        # Find latest available date for this crop to determine trend window
        latest_crop_date_row = (
            db.query(Price.date)
            .filter(func.lower(Price.crop_name) == crop.strip().lower())
            .order_by(desc(Price.date))
            .first()
        )
        if latest_crop_date_row:
            latest_dt = datetime.strptime(latest_crop_date_row[0], "%Y-%m-%d")
            cutoff_date = (latest_dt - timedelta(days=days)).strftime("%Y-%m-%d")
            daily_stats = daily_stats.filter(Price.date >= cutoff_date)

    if end_date:
        daily_stats = daily_stats.filter(Price.date <= end_date)

    daily_rows = daily_stats.group_by(Price.date).order_by(asc(Price.date)).all()

    points = []
    prices_list = []
    for r in daily_rows:
        avg_p = round(float(r.avg_price), 2)
        min_p = round(float(r.min_price), 2)
        max_p = round(float(r.max_price), 2)
        qty = round(float(r.total_quantity or 0.0), 1)
        prices_list.append(avg_p)
        points.append({
            "date": r.date,
            "avg_price": avg_p,
            "min_price": min_p,
            "max_price": max_p,
            "total_quantity": qty
        })

    if not points:
        return {
            "crop": crop,
            "state": state,
            "days": days,
            "overall_min": 0.0,
            "overall_max": 0.0,
            "overall_avg": 0.0,
            "latest_price": None,
            "price_change_pct": 0.0,
            "data": []
        }

    overall_min = round(min(p["min_price"] for p in points), 2)
    overall_max = round(max(p["max_price"] for p in points), 2)
    overall_avg = round(sum(prices_list) / len(prices_list), 2)
    latest_price = points[-1]["avg_price"]

    # Price change percent from earliest day in window to latest
    first_price = points[0]["avg_price"]
    price_change_pct = round(((latest_price - first_price) / first_price) * 100.0, 2) if first_price > 0 else 0.0

    return {
        "crop": crop,
        "state": state,
        "days": days,
        "overall_min": overall_min,
        "overall_max": overall_max,
        "overall_avg": overall_avg,
        "latest_price": latest_price,
        "price_change_pct": price_change_pct,
        "data": points
    }


def get_buyers(
    db: Session,
    crop: Optional[str] = None,
    state: Optional[str] = None
) -> List[Buyer]:
    """Retrieve verified buyers with crop and state/location filters."""
    query = db.query(Buyer)
    if crop:
        query = query.filter(func.lower(Buyer.crop) == crop.strip().lower())
    if state:
        query = query.filter(func.lower(Buyer.location).contains(state.strip().lower()))
    return query.order_by(Buyer.crop, Buyer.name).all()


def create_price_alert(db: Session, alert_in: PriceAlertCreate) -> PriceAlert:
    """Create a new user threshold alert."""
    alert = PriceAlert(
        user_id=alert_in.user_id,
        crop=alert_in.crop,
        threshold_price=alert_in.threshold_price,
        alert_type=alert_in.alert_type.lower()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts_by_user(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Retrieve alerts for a user, enriched with live latest market price and trigger status."""
    alerts = db.query(PriceAlert).filter(PriceAlert.user_id == user_id).order_by(desc(PriceAlert.created_at)).all()
    results = []

    for a in alerts:
        # Find latest price recorded for this crop
        latest_record = (
            db.query(Price.price_per_unit)
            .filter(func.lower(Price.crop_name) == a.crop.strip().lower())
            .order_by(desc(Price.date), desc(Price.id))
            .first()
        )
        current_price = round(latest_record[0], 2) if latest_record else None

        is_triggered = False
        if current_price is not None:
            if a.alert_type == "above" and current_price >= a.threshold_price:
                is_triggered = True
            elif a.alert_type == "below" and current_price <= a.threshold_price:
                is_triggered = True

        results.append({
            "id": a.id,
            "user_id": a.user_id,
            "crop": a.crop,
            "threshold_price": a.threshold_price,
            "alert_type": a.alert_type,
            "created_at": a.created_at,
            "current_market_price": current_price,
            "is_triggered": is_triggered
        })

    return results


def delete_alert(db: Session, alert_id: int) -> bool:
    """Delete a price alert by ID."""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
        return True
    return False


def get_market_statistics(db: Session) -> Dict[str, Any]:
    """Provide high-level market metrics, top crops by volume, and coverage summary."""
    total_records = db.query(Price).count()
    total_mandis = db.query(Mandi).count()
    total_crops = db.query(Crop).count()
    total_buyers = db.query(Buyer).count()

    # Distinct states covered
    distinct_states = [
        s[0] for s in db.query(Price.state).distinct().order_by(Price.state).all() if s[0]
    ]

    # Latest record date
    latest_row = db.query(Price.date).order_by(desc(Price.date)).first()
    latest_date = latest_row[0] if latest_row else None

    # Top crops grouped by arrival volume
    top_crops_query = (
        db.query(
            Price.crop_name,
            func.avg(Price.price_per_unit).label("avg_price"),
            func.min(Price.price_per_unit).label("min_price"),
            func.max(Price.price_per_unit).label("max_price"),
            func.sum(Price.quantity).label("total_quantity"),
            func.count(Price.id).label("record_count")
        )
        .group_by(Price.crop_name)
        .order_by(desc("total_quantity"))
        .limit(10)
        .all()
    )

    top_crops = [
        {
            "crop_name": row.crop_name,
            "avg_price": round(float(row.avg_price), 2),
            "min_price": round(float(row.min_price), 2),
            "max_price": round(float(row.max_price), 2),
            "total_quantity": round(float(row.total_quantity or 0.0), 1),
            "record_count": int(row.record_count)
        }
        for row in top_crops_query
    ]

    return {
        "total_price_records": total_records,
        "total_mandis": total_mandis,
        "total_crops": total_crops,
        "total_buyers": total_buyers,
        "states_covered": distinct_states,
        "top_traded_crops": top_crops,
        "latest_update": latest_date
    }
