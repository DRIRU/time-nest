from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class ProposalBase(BaseModel):
    request_id: int
    proposal_text: str = Field(..., min_length=5, max_length=1000)
    proposed_credits: Decimal = Field(..., gt=0)

class ProposalCreate(ProposalBase):
    pass

class ProposalUpdate(BaseModel):
    proposal_text: Optional[str] = Field(None, min_length=5, max_length=1000)
    proposed_credits: Optional[Decimal] = Field(None, gt=0)
    status: Optional[str] = Field(None, description="One of: pending, accepted, rejected, withdrawn")

class ProposalResponse(ProposalBase):
    proposal_id: int
    proposer_id: int
    status: str
    submitted_at: datetime
    response_at: Optional[datetime] = None
    proposer_name: Optional[str] = None

    class Config:
        orm_mode = True
