from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SqlEnum, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class ModeratorStatus(str, enum.Enum):
    active = 'active'
    suspended = 'suspended'
    inactive = 'inactive'

class Moderator(Base):
    __tablename__ = "moderators"

    moderator_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone_number = Column(String(15), nullable=True)
    status = Column(SqlEnum(ModeratorStatus), default=ModeratorStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, nullable=True)
    approved_by = Column(Integer, nullable=True)  # Admin ID who approved this moderator
    mod_request_id = Column(Integer, ForeignKey("mod_requests.request_id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", backref="moderator_profile")
    mod_request = relationship("ModRequest", backref="approved_moderator")

    def to_dict(self):
        """Convert moderator object to dictionary"""
        return {
            'moderator_id': self.moderator_id,
            'user_id': self.user_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'status': self.status.value if self.status else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'approved_by': self.approved_by,
            'mod_request_id': self.mod_request_id
        }
