from sqlalchemy import Column, Integer, String, Text, Numeric, Enum, Date, DateTime, ForeignKey
from ..database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class RequestUrgencyEnum(Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"

class Request(Base):
    __tablename__ = "requests"

    request_id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"),nullable=False)

    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    budget = Column(Numeric(10, 2), nullable=False)

    location = Column(String(100), nullable=False)
    deadline = Column(Date)
    urgency = Column(Enum(RequestUrgencyEnum), default=RequestUrgencyEnum.normal)

    whats_included = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)     # Comma-separated
    skills = Column(Text, nullable=True)   # Comma-separated

    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", backref="requests")

    def get_tags_list(self):
        return self.tags.split(',') if self.tags else []

    def get_skills_list(self):
        return self.skills.split(',') if self.skills else []
