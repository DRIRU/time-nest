from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..database import Base

class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Plain text as requested
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    role = Column(String(50), default='admin')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Admin(admin_id={self.admin_id}, email='{self.email}', name='{self.first_name} {self.last_name}')>"