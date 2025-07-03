from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class BookingBase(BaseModel):
    service_id: int
    scheduled_date: date
    message: Optional[str] = None
    time_credits_used: Optional[Decimal] = Field(0.0, ge=0.0)

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    message: Optional[str] = None
    status: Optional[str] = Field(None, description="One of: pending, confirmed, completed, cancelled, rejected")

class BookingResponse(BookingBase):
    booking_id: int
    user_id: int
    status: str
    booking_date: datetime
    creator_name: Optional[str] = None  # optional for frontend
    service_title: Optional[str] = None

    class Config:
        from_attributes = True
