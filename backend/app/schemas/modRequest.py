from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ModRequestBase(BaseModel):
    reason: str = Field(..., min_length=5, max_length=1000)
    experience: Optional[str] = Field(None, max_length=2000)

class ModRequestCreate(ModRequestBase):
    pass

class ModRequestUpdate(BaseModel):
    status: Optional[str] = Field(None, description="One of: pending, approved, rejected")
    reviewed_at: Optional[datetime] = None

class ModRequestResponse(ModRequestBase):
    request_id: int
    user_id: int
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    user_name: Optional[str] = None  # Optional: attach for frontend use

    class Config:
        orm_mode = True
