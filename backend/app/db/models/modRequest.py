from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class ModRequestStatus(str, enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'

class ModRequest(Base):
    __tablename__ = "mod_requests"

    request_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=False)
    experience = Column(Text, nullable=True)

    status = Column(SqlEnum(ModRequestStatus), default=ModRequestStatus.pending)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", backref="mod_requests")
