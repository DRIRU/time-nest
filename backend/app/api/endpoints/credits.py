from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import logging

from ...db.database import get_db
from ...core.credit_manager import CreditManager, InsufficientCreditsError
from ...schemas.timeTransaction import (
    TransactionResponse, TransactionListResponse, BalanceResponse, CreditTransferRequest
)
from .users import get_current_user_dependency

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/balance", response_model=BalanceResponse)
def get_user_balance(
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Get current user's credit balance and statistics"""
    try:
        credit_manager = CreditManager(db)
        
        current_balance = credit_manager.get_user_balance(current_user.user_id)
        print(current_user.total_credits_earned)
        return BalanceResponse(
            user_id=current_user.user_id,
            current_balance=current_balance,
            total_earned=current_user.total_credits_earned or Decimal('0.00'),
            total_spent=current_user.total_credits_spent or Decimal('0.00'),
            last_updated=current_user.last_login or current_user.date_joined
        )
        
    except Exception as e:
        logger.error(f"Error getting balance for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving balance"
        )

@router.get("/balance/{user_id}", response_model=BalanceResponse)
def get_user_balance_by_id(
    user_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Get any user's credit balance (for service providers to check customer balance)"""
    try:
        credit_manager = CreditManager(db)
        
        # Get the target user
        from ...db.models.user import User
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        current_balance = credit_manager.get_user_balance(user_id)
        # print(BalanceResponse)
        return BalanceResponse(
            user_id=user_id,
            current_balance=current_balance,
            total_earned=user.total_credits_earned or Decimal('0.00'),
            total_spent=user.total_credits_spent or Decimal('0.00'),
            last_updated=user.last_login or user.date_joined
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting balance for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving balance"
        )

@router.get("/transactions", response_model=TransactionListResponse)
def get_user_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Get current user's transaction history"""
    try:
        credit_manager = CreditManager(db)
        
        transactions, total_count = credit_manager.get_user_transactions(
            current_user.user_id, skip=skip, limit=limit
        )
        
        current_balance = credit_manager.get_user_balance(current_user.user_id)
        
        return TransactionListResponse(
            transactions=[TransactionResponse.from_orm(tx) for tx in transactions],
            total_count=total_count,
            current_balance=current_balance
        )
        
    except Exception as e:
        logger.error(f"Error getting transactions for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving transactions"
        )

@router.post("/transfer", response_model=dict)
def transfer_credits(
    transfer_request: CreditTransferRequest,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Transfer credits between users (internal use - called when booking is completed)"""
    try:
        # Verify the current user is authorized for this transfer
        # (either they're paying or they're an admin)
        if (current_user.user_id != transfer_request.from_user_id and 
            current_user.user_id != transfer_request.to_user_id):
            # Could add admin role check here in the future
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to perform this transfer"
            )
        
        credit_manager = CreditManager(db)
        
        # Perform the transfer
        debit_tx, credit_tx = credit_manager.transfer_credits(
            from_user_id=transfer_request.from_user_id,
            to_user_id=transfer_request.to_user_id,
            amount=transfer_request.amount,
            reference_type=transfer_request.reference_type,
            reference_id=transfer_request.reference_id,
            description=transfer_request.description
        )
        
        return {
            "success": True,
            "message": f"Successfully transferred {transfer_request.amount} credits",
            "debit_transaction_id": debit_tx.transaction_id,
            "credit_transaction_id": credit_tx.transaction_id
        }
        
    except InsufficientCreditsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transferring credits: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing credit transfer"
        )

@router.post("/initial-bonus", response_model=TransactionResponse)
def add_initial_bonus(
    user_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Add initial bonus credits for a new user (admin only or self)"""
    try:
        # Only allow users to add bonus to themselves or add admin role check
        if current_user.user_id != user_id:
            # Future: add admin role check here
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to add bonus credits"
            )
        
        credit_manager = CreditManager(db)
        
        # Check if user already has an initial bonus
        from ...db.models.timeTransaction import TimeTransaction, TransactionTypeEnum
        existing_bonus = db.query(TimeTransaction).filter(
            TimeTransaction.user_id == user_id,
            TimeTransaction.transaction_type == TransactionTypeEnum.initial_bonus
        ).first()
        
        if existing_bonus:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already received initial bonus"
            )
        
        transaction = credit_manager.add_initial_bonus(user_id)
        
        return TransactionResponse.from_orm(transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding initial bonus for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding initial bonus"
        )
