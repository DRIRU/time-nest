from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Report(Base):
    __tablename__ = 'reports'

    report_id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Who reported
    reporter_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    
    # What's being reported (either service or request)
    reported_service_id = Column(Integer, ForeignKey('services.service_id', ondelete='CASCADE'), nullable=True)
    reported_request_id = Column(Integer, ForeignKey('requests.request_id', ondelete='CASCADE'), nullable=True)
    
    # Who's being reported (the owner of the service/request)
    reported_user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    
    # Report details
    report_type = Column(SQLEnum(
        'service_quality', 
        'fraud_scam', 
        'inappropriate_content', 
        'payment_dispute', 
        'no_show', 
        'unprofessional_behavior',
        'safety_concern',
        'other'
    ), nullable=False)
    
    category = Column(SQLEnum('service', 'request'), nullable=False)  # Whether reporting a service or request
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Status tracking
    status = Column(SQLEnum(
        'pending', 
        'under_review', 
        'resolved', 
        'dismissed',
        'escalated'
    ), default='pending', nullable=False)
    
    # Admin handling
    assigned_admin_id = Column(Integer, ForeignKey('admins.admin_id'), nullable=True)
    admin_notes = Column(Text, nullable=True)
    resolution = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_made")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_received")
    reported_service = relationship("Service", back_populates="reports")
    reported_request = relationship("Request", back_populates="reports")
    assigned_admin = relationship("Admin", back_populates="assigned_reports")
    
    def __repr__(self):
        return f"<Report(report_id={self.report_id}, type='{self.report_type}', status='{self.status}')>"
