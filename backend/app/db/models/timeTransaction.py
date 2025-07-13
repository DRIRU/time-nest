from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
from enum import Enum as PyEnum

class TransactionTypeEnum(str, PyEnum):
    service_payment = 'service_payment'
    service_earning = 'service_earning'
    request_payment = 'request_payment'
    request_earning = 'request_earning'
    initial_bonus = 'initial_bonus'
    refund = 'refund'
    manual_adjustment = 'manual_adjustment'

class ReferenceTypeEnum(str, PyEnum):
    service_booking = 'service_booking'
    service_request = 'service_request'
    registration = 'registration'
    manual = 'manual'
    system = 'system'

class TimeTransaction(Base):
    __tablename__ = "time_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    transaction_type = Column(Enum(TransactionTypeEnum), nullable=False)
    reference_type = Column(Enum(ReferenceTypeEnum), nullable=False)
    reference_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    balance_before = Column(DECIMAL(10, 2), nullable=False)
    balance_after = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship with User model
    user = relationship("User", back_populates="transactions")

    def __repr__(self):
        return f"<TimeTransaction(id={self.transaction_id}, user_id={self.user_id}, amount={self.amount}, type={self.transaction_type})>"
