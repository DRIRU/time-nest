from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class ReportCreate(BaseModel):
    reported_service_id: Optional[int] = None
    reported_request_id: Optional[int] = None
    reported_user_id: int
    report_type: Literal[
        'service_quality', 
        'fraud_scam', 
        'inappropriate_content', 
        'payment_dispute', 
        'no_show', 
        'unprofessional_behavior',
        'safety_concern',
        'other'
    ]
    category: Literal['service', 'request']
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)

class ReportResponse(BaseModel):
    report_id: int
    reporter_id: int
    reported_service_id: Optional[int]
    reported_request_id: Optional[int]
    reported_user_id: int
    report_type: str
    category: str
    title: str
    description: str
    status: str
    assigned_admin_id: Optional[int]
    admin_notes: Optional[str]
    resolution: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    
    # Related data
    reporter_name: Optional[str] = None
    reported_user_name: Optional[str] = None
    service_title: Optional[str] = None
    request_title: Optional[str] = None

    class Config:
        from_attributes = True

class ReportUpdate(BaseModel):
    status: Optional[Literal['pending', 'under_review', 'resolved', 'dismissed', 'escalated']] = None
    assigned_admin_id: Optional[int] = None
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None

class ReportSummary(BaseModel):
    total_reports: int
    pending_reports: int
    under_review_reports: int
    resolved_reports: int
    dismissed_reports: int
    escalated_reports: int

class ReportStats(BaseModel):
    user_id: int
    reports_made_count: int
    reports_received_count: int
    recent_reports_made: list[ReportResponse] = []
    recent_reports_received: list[ReportResponse] = []
