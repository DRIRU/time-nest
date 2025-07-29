from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class ServiceBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="Service title")
    description: str = Field(..., min_length=10, description="Detailed description of the service")
    category: str = Field(..., min_length=1, max_length=50, description="Service category")
    time_credits_per_hour: Decimal = Field(..., ge=0.5, le=10.0, description="Time credits per hour")
    location: str = Field(..., min_length=1, max_length=100, description="Service location")
    
    # These will be converted to individual boolean fields in the endpoint
    availability: List[str] = Field(..., description="List of availability slots")
    
    whats_included: Optional[str] = Field(None, description="What's included in the service")
    requirements: Optional[str] = Field(None, description="Requirements for the service")
    tags: Optional[List[str]] = Field(None, description="Tags for the service")

    @validator('availability')
    def validate_availability(cls, v):
        valid_options = [
            "weekday-mornings", "weekday-afternoons", "weekday-evenings",
            "weekend-mornings", "weekend-afternoons", "weekend-evenings",
            "flexible"
        ]
        
        if not v or len(v) == 0:
            raise ValueError("At least one availability option must be selected")
        
        for option in v:
            if option not in valid_options:
                raise ValueError(f"Invalid availability option: {option}")
        
        return v

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    service_id: int
    creator_id: int
    created_at: datetime
    creator_name: Optional[str] = None 
    creator_date_joined: Optional[datetime] = None
    # Convert boolean fields back to list for response
    availability: List[str]
    
    # Rating fields
    average_rating: float = Field(0.0, description="Average rating from reviews")
    total_reviews: int = Field(0, description="Total number of reviews")
    
    class Config:
        from_attributes = True

class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    time_credits_per_hour: Optional[Decimal] = Field(None, ge=0.5, le=10.0)
    location: Optional[str] = Field(None, min_length=1, max_length=100)
    availability: Optional[List[str]] = Field(None)
    whats_included: Optional[str] = Field(None)
    requirements: Optional[str] = Field(None)
    tags: Optional[List[str]] = Field(None)

    @validator('availability')
    def validate_availability(cls, v):
        if v is None:
            return v
            
        valid_options = [
            "weekday-mornings", "weekday-afternoons", "weekday-evenings",
            "weekend-mornings", "weekend-afternoons", "weekend-evenings",
            "flexible"
        ]
        
        if len(v) == 0:
            raise ValueError("At least one availability option must be selected")
        
        for option in v:
            if option not in valid_options:
                raise ValueError(f"Invalid availability option: {option}")
        
        return v