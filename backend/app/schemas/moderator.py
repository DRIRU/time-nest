from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List, Any
from datetime import datetime
from enum import Enum

class ModeratorStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    inactive = "inactive"

class ModeratorCreate(BaseModel):
    user_id: int
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    approved_by: Optional[int] = None
    mod_request_id: Optional[int] = None

class ModeratorUpdate(BaseModel):
    status: Optional[ModeratorStatus] = None
    phone_number: Optional[str] = None

class ModeratorLogin(BaseModel):
    email: EmailStr
    password: str

class ModeratorResponse(BaseModel):
    moderator_id: int
    user_id: int
    email: str
    first_name: str
    last_name: str
    phone_number: Optional[str]
    status: ModeratorStatus
    created_at: datetime
    last_login: Optional[datetime]
    last_activity: Optional[datetime]
    approved_by: Optional[int]
    mod_request_id: Optional[int]

    class Config:
        from_attributes = True

class ModeratorLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    moderator: ModeratorResponse

class ModeratorStats(BaseModel):
    total_moderators: int
    active_moderators: int
    suspended_moderators: int
    reports_handled_today: int
    content_moderated_today: int
    users_managed_today: int

class ModeratorActivityLog(BaseModel):
    activity_id: int
    moderator_id: int
    action_type: str
    target_type: str  # user, post, comment, report, etc.
    target_id: Optional[int]
    description: str
    timestamp: datetime
    ip_address: Optional[str]

    class Config:
        from_attributes = True
