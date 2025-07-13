from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Optional, Tuple
import logging

from ..db.models.user import User
from ..db.models.timeTransaction import TimeTransaction, TransactionTypeEnum, ReferenceTypeEnum
from ..schemas.timeTransaction import TransactionCreate

logger = logging.getLogger(__name__)

class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits for a transaction"""
    pass

class CreditManager:
    """Core credit management system"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_balance(self, user_id: int) -> Decimal:
        """Get current credit balance for a user from user table"""
        try:
            user = self.db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return Decimal('0.00')
            
            return Decimal(str(user.time_credits)) if user.time_credits else Decimal('0.00')
        except Exception as e:
            logger.error(f"Error getting balance for user {user_id}: {str(e)}")
            return Decimal('0.00')
    
    def validate_sufficient_credits(self, user_id: int, required_amount: Decimal) -> bool:
        """Check if user has sufficient credits"""
        current_balance = self.get_user_balance(user_id)
        return current_balance >= required_amount
    
    def create_transaction(
        self, 
        user_id: int, 
        amount: Decimal, 
        transaction_type: TransactionTypeEnum,
        reference_type: ReferenceTypeEnum,
        reference_id: Optional[int] = None,
        description: Optional[str] = None
    ) -> TimeTransaction:
        """Create a single transaction record and update user balance"""
        
        # Get user and current balance
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        balance_before = Decimal(str(user.time_credits)) if user.time_credits else Decimal('0.00')
        balance_after = balance_before + amount
        
        # Create transaction record
        transaction = TimeTransaction(
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
            balance_before=balance_before,
            balance_after=balance_after
        )
        
        self.db.add(transaction)
        self.db.flush()  # Get the transaction ID
        
        # Update user's balance and statistics
        user.time_credits = balance_after
        if amount > 0:
            user.total_credits_earned = (user.total_credits_earned or Decimal('0.00')) + amount
        else:
            user.total_credits_spent = (user.total_credits_spent or Decimal('0.00')) + abs(amount)
        
        return transaction
    
    def transfer_credits(
        self,
        from_user_id: int,
        to_user_id: int,
        amount: Decimal,
        reference_type: ReferenceTypeEnum,
        reference_id: int,
        description: str
    ) -> Tuple[TimeTransaction, TimeTransaction]:
        """Transfer credits between two users (atomic operation)"""
        
        # Validate sufficient credits
        if not self.validate_sufficient_credits(from_user_id, amount):
            raise InsufficientCreditsError(f"User {from_user_id} has insufficient credits")
        
        # Determine transaction types based on reference type
        if reference_type == ReferenceTypeEnum.service_booking:
            debit_type = TransactionTypeEnum.service_payment
            credit_type = TransactionTypeEnum.service_earning
        elif reference_type == ReferenceTypeEnum.service_request:
            debit_type = TransactionTypeEnum.request_payment
            credit_type = TransactionTypeEnum.request_earning
        else:
            # Generic transfer
            debit_type = TransactionTypeEnum.manual_adjustment
            credit_type = TransactionTypeEnum.manual_adjustment
        
        try:
            # Create debit transaction (from_user pays)
            debit_transaction = self.create_transaction(
                user_id=from_user_id,
                amount=-amount,  # Negative for outgoing
                transaction_type=debit_type,
                reference_type=reference_type,
                reference_id=reference_id,
                description=f"Payment: {description}"
            )
            
            # Create credit transaction (to_user receives)
            credit_transaction = self.create_transaction(
                user_id=to_user_id,
                amount=amount,  # Positive for incoming
                transaction_type=credit_type,
                reference_type=reference_type,
                reference_id=reference_id,
                description=f"Earned: {description}"
            )
            
            self.db.commit()
            logger.info(f"Credit transfer successful: {amount} credits from user {from_user_id} to user {to_user_id}")
            
            return debit_transaction, credit_transaction
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Credit transfer failed: {str(e)}")
            raise
    
    def add_initial_bonus(self, user_id: int, amount: Decimal = Decimal('10.00')) -> TimeTransaction:
        """Add initial bonus credits for new users"""
        
        transaction = self.create_transaction(
            user_id=user_id,
            amount=amount,
            transaction_type=TransactionTypeEnum.initial_bonus,
            reference_type=ReferenceTypeEnum.registration,
            reference_id=user_id,
            description=f"Initial credits: {amount} credits"
        )
        
        self.db.commit()
        logger.info(f"Initial bonus of {amount} credits added to user {user_id}")
        
        return transaction
    
    def refund_credits(
        self,
        original_reference_id: int,
        reference_type: ReferenceTypeEnum,
        reason: str = "Booking cancelled"
    ) -> list[TimeTransaction]:
        """Refund credits for a cancelled booking/request"""
        
        # Find original transactions
        original_transactions = self.db.query(TimeTransaction).filter(
            TimeTransaction.reference_id == original_reference_id,
            TimeTransaction.reference_type == reference_type
        ).all()
        
        if not original_transactions:
            raise ValueError(f"No transactions found for {reference_type} {original_reference_id}")
        
        refund_transactions = []
        
        try:
            for original_tx in original_transactions:
                # Create reverse transaction
                refund_tx = self.create_transaction(
                    user_id=original_tx.user_id,
                    amount=-original_tx.amount,  # Reverse the amount
                    transaction_type=TransactionTypeEnum.refund,
                    reference_type=reference_type,
                    reference_id=original_reference_id,
                    description=f"Refund: {reason}"
                )
                refund_transactions.append(refund_tx)
            
            self.db.commit()
            logger.info(f"Refund processed for {reference_type} {original_reference_id}")
            
            return refund_transactions
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Refund failed: {str(e)}")
            raise
    
    def get_user_transactions(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 50
    ) -> Tuple[list[TimeTransaction], int]:
        """Get user's transaction history with pagination"""
        
        transactions = self.db.query(TimeTransaction).filter(
            TimeTransaction.user_id == user_id
        ).order_by(TimeTransaction.created_at.desc()).offset(skip).limit(limit).all()
        
        total_count = self.db.query(TimeTransaction).filter(
            TimeTransaction.user_id == user_id
        ).count()
        
        return transactions, total_count
