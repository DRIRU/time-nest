from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class RatingCreate(BaseModel):
    booking_id: int = Field(..., description="ID of the booking being rated")
    service_id: int = Field(..., description="ID of the service being rated")
    provider_id: int = Field(..., description="ID of the service provider being rated")
    rating: int = Field(..., ge=1, le=5, description="Rating value from 1 to 5 stars")
    review: Optional[str] = Field(None, max_length=1000, description="Optional review text")

    @validator('review')
    def validate_review(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v

class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated rating value")
    review: Optional[str] = Field(None, max_length=1000, description="Updated review text")

    @validator('review')
    def validate_review(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v

class RatingResponse(BaseModel):
    rating_id: int
    booking_id: int
    service_id: int
    rater_id: int
    provider_id: int
    rating: int
    review: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for detailed responses
    rater_name: Optional[str] = None
    service_title: Optional[str] = None

    class Config:
        from_attributes = True

class RatingStats(BaseModel):
    total_ratings: int
    average_rating: float

class ServiceRatingStats(RatingStats):
    service_id: int
    service_title: str

class ProviderRatingStats(RatingStats):
    provider_id: int
    provider_name: str

class RatingListResponse(BaseModel):
    ratings: list[RatingResponse]
    total_count: int
    average_rating: Optional[float] = None
