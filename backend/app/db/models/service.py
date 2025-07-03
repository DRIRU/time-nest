from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Service(Base):
    __tablename__ = 'services'

    service_id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)

    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    time_credits_per_hour = Column(Numeric(3, 1), nullable=False)

    location = Column(String(100), nullable=False)

    availability_weekday_morning = Column(Boolean, default=False)
    availability_weekday_afternoon = Column(Boolean, default=False)
    availability_weekday_evening = Column(Boolean, default=False)
    availability_weekend_morning = Column(Boolean, default=False)
    availability_weekend_afternoon = Column(Boolean, default=False)
    availability_weekend_evening = Column(Boolean, default=False)
    availability_flexible = Column(Boolean, default=False)

    whats_included = Column(Text)
    requirements = Column(Text)
    tags = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    #
    # Relationship with the User model
    # creator = relationship("User", back_populates="services")
    creator = relationship("User", backref="services") 
    def __repr__(self):
        return f"<Service(service_id={self.service_id}, title='{self.title}', category='{self.category}')>"