from sqlalchemy import Column, Integer, Text, DateTime, DECIMAL, Enum as SqlEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class ProposalStatusEnum(str, enum.Enum):
    pending = 'pending'
    accepted = 'accepted'
    rejected = 'rejected'
    withdrawn = 'withdrawn'

class RequestProposal(Base):
    __tablename__ = "request_proposals"

    proposal_id = Column(Integer, primary_key=True, autoincrement=True)
    
    request_id = Column(Integer, ForeignKey("requests.request_id", ondelete="CASCADE"), nullable=False)
    proposer_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    proposal_text = Column(Text, nullable=False)
    proposed_credits = Column(DECIMAL(5, 2), nullable=False)

    status = Column(SqlEnum(ProposalStatusEnum), default=ProposalStatusEnum.pending)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    response_at = Column(DateTime, nullable=True)

    request = relationship("Request", backref="proposals")
    proposer = relationship("User", backref="proposals")
