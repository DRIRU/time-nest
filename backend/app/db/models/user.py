from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(15), nullable=True)
    gender = Column(Enum('Male', 'Female', 'Other'), nullable=True)
    age = Column(Integer, nullable=True)
    location = Column(String(100), nullable=True)
    total_credits_earned = Column(DECIMAL(5,2), default=0.00)
    total_credits_spent = Column(DECIMAL(5,2), default=0.00)
    time_credits = Column(DECIMAL(5,2), default=0.00)
    services_completed_count = Column(Integer, default=0)
    services_availed_count = Column(Integer, default=0)
    status = Column(Enum('Active', 'Suspended', 'Deactivated'), default='Active')
    date_joined = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires_at = Column(DateTime, nullable=True)

    # Relationship with the Service model
    services = relationship("Service", back_populates="creator", cascade="all, delete-orphan")
    
    # Relationship with the Rating model
    given_ratings = relationship("Rating", foreign_keys="Rating.rater_id", back_populates="rater", cascade="all, delete-orphan")
    received_ratings = relationship("Rating", foreign_keys="Rating.provider_id", back_populates="provider", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(user_id={self.user_id}, email='{self.email}', name='{self.first_name} {self.last_name}')>"