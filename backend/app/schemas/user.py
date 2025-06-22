from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    phone_number: Optional[str] = Field(None, max_length=15, description="User's phone number")
    gender: Optional[str] = Field(None, description="User's gender")
    age: Optional[int] = Field(None, ge=13, le=120, description="User's age")
    location: Optional[str] = Field(None, max_length=100, description="User's location")

    @validator('gender')
    def validate_gender(cls, v):
        if v is not None and v not in ['Male', 'Female', 'Other']:
            raise ValueError('Gender must be Male, Female, or Other')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if v is not None:
            # Remove any non-digit characters for validation
            digits_only = ''.join(filter(str.isdigit, v))
            if len(digits_only) < 10:
                raise ValueError('Phone number must contain at least 10 digits')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User's password (minimum 8 characters)")

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserResponse(UserBase):
    user_id: int
    total_credits_earned: float
    total_credits_spent: float
    time_credits: float
    services_completed_count: int
    services_availed_count: int
    status: str
    date_joined: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None