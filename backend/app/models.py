from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from backend.app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Price(Base):
    """
    Historical and real-time market arrivals and price discovery data.
    """
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    crop_name = Column(String(100), nullable=False, index=True)
    mandi_name = Column(String(150), nullable=False, index=True)
    price_per_unit = Column(Float, nullable=False)  # Mapped to modal_price for backward compatibility
    modal_price = Column(Float, nullable=True)
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    variety = Column(String(100), nullable=True)
    quantity = Column(Float, nullable=False, default=0.0)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    state = Column(String(100), nullable=False, index=True)
    region = Column(String(100), nullable=True)  # district or region
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_prices_crop_state_date", "crop_name", "state", "date"),
        Index("idx_prices_mandi_date", "mandi_name", "date"),
    )


class Mandi(Base):
    """
    Agricultural Produce Market Committee (APMC) / Mandi directory.
    """
    __tablename__ = "mandis"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=True)


class Crop(Base):
    """
    Crop master entity with baseline bounds and measurement units.
    """
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    unit_of_measurement = Column(String(50), nullable=False, default="Quintal")
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)


class Buyer(Base):
    """
    Verified buyers, aggregators, and institutional traders.
    """
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    crop = Column(String(100), nullable=False, index=True)
    min_quantity = Column(Float, nullable=False, default=10.0)
    location = Column(String(150), nullable=False)  # State or City
    contact = Column(String(100), nullable=False)


class PriceAlert(Base):
    """
    Custom farmer price notification threshold alerts.
    """
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    crop = Column(String(100), nullable=False, index=True)
    threshold_price = Column(Float, nullable=False)
    alert_type = Column(String(20), nullable=False)  # 'above' or 'below'
    created_at = Column(DateTime, default=utc_now)
