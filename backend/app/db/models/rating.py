from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Rating(Base):
    __tablename__ = "ratings"

    rating_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("service_bookings.booking_id", ondelete="CASCADE"), nullable=False, unique=True)
    service_id = Column(Integer, ForeignKey("services.service_id", ondelete="CASCADE"), nullable=False, index=True)
    rater_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False, index=True)
    review = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Add constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        CheckConstraint('rater_id != provider_id', name='check_rater_not_provider'),
    )

    # Relationships
    booking = relationship("ServiceBooking", back_populates="rating")
    service = relationship("Service", back_populates="ratings")
    rater = relationship("User", foreign_keys=[rater_id], back_populates="given_ratings")
    provider = relationship("User", foreign_keys=[provider_id], back_populates="received_ratings")

    def to_dict(self):
        return {
            "rating_id": self.rating_id,
            "booking_id": self.booking_id,
            "service_id": self.service_id,
            "rater_id": self.rater_id,
            "provider_id": self.provider_id,
            "rating": self.rating,
            "review": self.review,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
