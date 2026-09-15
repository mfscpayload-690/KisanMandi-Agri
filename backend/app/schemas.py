from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

# ----------------- Price Schemas -----------------

class PriceBase(BaseModel):
    crop_name: str = Field(..., examples=["Wheat"])
    mandi_name: str = Field(..., examples=["Lasalgaon APMC"])
    price_per_unit: float = Field(..., gt=0, examples=[2450.50])
    modal_price: Optional[float] = Field(None, examples=[2450.50])
    min_price: Optional[float] = Field(None, examples=[2300.0])
    max_price: Optional[float] = Field(None, examples=[2550.0])
    variety: Optional[str] = Field(None, examples=["FAQ"])
    quantity: float = Field(..., ge=0, examples=[350.0])
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", examples=["2026-09-15"])
    state: str = Field(..., examples=["Maharashtra"])
    region: Optional[str] = Field(None, examples=["Nashik"])

class PriceCreate(PriceBase):
    pass

class PriceResponse(PriceBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PriceListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[PriceResponse]

# ----------------- Mandi Schemas -----------------

class MandiBase(BaseModel):
    name: str = Field(..., examples=["Khanna APMC"])
    state: str = Field(..., examples=["Punjab"])
    district: str = Field(..., examples=["Ludhiana"])
    contact: Optional[str] = Field(None, examples=["+91 1628 220101"])

class MandiResponse(MandiBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class MandiPricesResponse(BaseModel):
    mandi: MandiResponse
    total_records: int
    prices: List[PriceResponse]

# ----------------- Crop Schemas -----------------

class CropBase(BaseModel):
    name: str = Field(..., examples=["Wheat"])
    unit_of_measurement: str = Field(default="Quintal")
    min_price: Optional[float] = None
    max_price: Optional[float] = None

class CropResponse(CropBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# ----------------- Buyer Schemas -----------------

class BuyerBase(BaseModel):
    name: str = Field(..., examples=["AgroCorp Supplies"])
    crop: str = Field(..., examples=["Wheat"])
    min_quantity: float = Field(..., ge=1, examples=[50.0])
    location: str = Field(..., examples=["Delhi"])
    contact: str = Field(..., examples=["+91 98765 43210"])

class BuyerCreate(BuyerBase):
    pass

class BuyerResponse(BuyerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# ----------------- Alert Schemas -----------------

class PriceAlertCreate(BaseModel):
    user_id: str = Field(..., min_length=1, examples=["farmer_ramesh"])
    crop: str = Field(..., examples=["Wheat"])
    threshold_price: float = Field(..., gt=0, examples=[2500.0])
    alert_type: str = Field(..., pattern="^(above|below)$", examples=["above"])

class PriceAlertResponse(BaseModel):
    id: int
    user_id: str
    crop: str
    threshold_price: float
    alert_type: str
    created_at: Optional[datetime] = None
    current_market_price: Optional[float] = None
    is_triggered: bool = False

    model_config = ConfigDict(from_attributes=True)

# ----------------- Trend Schemas -----------------

class TrendPoint(BaseModel):
    date: str
    avg_price: float
    min_price: float
    max_price: float
    total_quantity: float

class TrendResponse(BaseModel):
    crop: str
    state: Optional[str] = None
    days: int
    overall_min: float
    overall_max: float
    overall_avg: float
    latest_price: Optional[float] = None
    price_change_pct: float
    data: List[TrendPoint]

# ----------------- Stats Schemas -----------------

class CropStat(BaseModel):
    crop_name: str
    avg_price: float
    min_price: float
    max_price: float
    total_quantity: float
    record_count: int

class StatsResponse(BaseModel):
    total_price_records: int
    total_mandis: int
    total_crops: int
    total_buyers: int
    states_covered: List[str]
    top_traded_crops: List[CropStat]
    latest_update: Optional[str] = None
