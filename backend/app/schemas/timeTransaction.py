from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TransactionBase(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            Decimal: lambda v: float(v) if v is not None else None
        }
    )
    
    amount: Decimal = Field(..., description="Transaction amount (positive for credit, negative for debit)")
    transaction_type: str = Field(..., description="Type of transaction")
    reference_type: str = Field(..., description="Type of reference (booking, request, etc.)")
    reference_id: Optional[int] = Field(None, description="ID of the referenced entity")
    description: Optional[str] = Field(None, description="Transaction description")

class TransactionCreate(TransactionBase):
    user_id: int = Field(..., description="User ID for the transaction")
    balance_before: Decimal = Field(..., description="User balance before transaction")
    balance_after: Decimal = Field(..., description="User balance after transaction")

class TransactionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            Decimal: lambda v: float(v) if v is not None else None
        }
    )
    
    transaction_id: int
    user_id: int
    amount: Decimal
    transaction_type: str
    reference_type: str
    reference_id: Optional[int]
    description: Optional[str]
    balance_before: Decimal
    balance_after: Decimal
    created_at: datetime
    updated_at: datetime

class TransactionListResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            Decimal: lambda v: float(v) if v is not None else None
        }
    )
    
    transactions: list[TransactionResponse]
    total_count: int
    current_balance: Decimal

class BalanceResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            Decimal: lambda v: float(v) if v is not None else None
        }
    )
    
    user_id: int
    current_balance: Decimal
    total_earned: Decimal
    total_spent: Decimal
    last_updated: datetime

class CreditTransferRequest(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            Decimal: lambda v: float(v) if v is not None else None
        }
    )
    
    from_user_id: int = Field(..., description="User paying credits")
    to_user_id: int = Field(..., description="User receiving credits")
    amount: Decimal = Field(..., gt=0, description="Amount of credits to transfer")
    reference_type: str = Field(..., description="Type of reference")
    reference_id: int = Field(..., description="ID of the referenced entity (booking_id, etc.)")
    description: str = Field(..., description="Description of the transfer")
