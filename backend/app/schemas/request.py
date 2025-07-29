from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal

class RequestBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="Request title")
    description: str = Field(..., min_length=10, description="Detailed description of the request")
    category: str = Field(..., min_length=1, max_length=50, description="Request category")
    budget: Decimal = Field(..., gt=0, description="Proposed budget (in time credits or money)")
    location: str = Field(..., min_length=1, max_length=100, description="Request location")

    deadline: Optional[date] = Field(None, description="Deadline for the request (optional)")
    urgency: Optional[str] = Field(default="normal", description="Urgency level: low, normal, high, urgent")
    
    whats_included: Optional[str] = Field(None, description="What the requester will provide or support")
    requirements: Optional[str] = Field(None, description="Any specific expectations or prerequisites")
    
    tags: Optional[List[str]] = Field(None, description="Tags to help identify or categorize the request")
    skills: Optional[List[str]] = Field(None, description="Required skills (if any)")

    @validator('urgency')
    def validate_urgency(cls, v):
        valid_urgencies = ['low', 'normal', 'high', 'urgent']
        if v not in valid_urgencies:
            raise ValueError(f"Invalid urgency level: {v}. Must be one of {valid_urgencies}")
        return v

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    budget: Optional[Decimal] = Field(None, gt=0)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    deadline: Optional[date] = None
    urgency: Optional[str] = Field(None, description="Urgency level: low, normal, high, urgent")
    whats_included: Optional[str] = None
    requirements: Optional[str] = None
    tags: Optional[List[str]] = None
    skills: Optional[List[str]] = None

    @validator('urgency')
    def validate_urgency(cls, v):
        if v is None:
            return v
        valid_urgencies = ['low', 'normal', 'high', 'urgent']
        if v not in valid_urgencies:
            raise ValueError(f"Invalid urgency level: {v}. Must be one of {valid_urgencies}")
        return v

class RequestResponse(RequestBase):
    request_id: int
    creator_id: int
    creator_name: Optional[str] = None
    creator_date_joined: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True
