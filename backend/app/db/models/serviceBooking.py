from sqlalchemy import Column, Integer,  Enum as SQLAlchemyEnum, String, Text, Date, DateTime, Enum, ForeignKey, Numeric
from ..database import Base
from sqlalchemy.ext.declarative import declarative_base
from enum import Enum
from datetime import datetime
from sqlalchemy.orm import relationship


class BookingStatusEnum(str, Enum):
    pending = 'pending'
    confirmed = 'confirmed'
    completed = 'completed'
    cancelled = 'cancelled'
    rejected = 'rejected'

class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    booking_id = Column(Integer, primary_key=True, autoincrement=True)
    
    service_id = Column(Integer, ForeignKey("services.service_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    booking_date = Column(DateTime, default=datetime.utcnow)
    scheduled_datetime = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)  
    status = Column(SQLAlchemyEnum(BookingStatusEnum), default=BookingStatusEnum.pending)
    message = Column(Text, nullable=True)
    time_credits_used = Column(Numeric(5, 2), default=0.00)

    service = relationship("Service", backref="bookings")
    user = relationship("User", backref="bookings")
    
    # Relationship with the Rating model (one-to-one)
    rating = relationship("Rating", back_populates="booking", uselist=False, cascade="all, delete-orphan")
