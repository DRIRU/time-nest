from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging
from datetime import datetime, timedelta

from ...db.database import get_db
from ...db.models.moderator import Moderator, ModeratorStatus
from ...db.models.user import User
from ...db.models.modRequest import ModRequest, ModRequestStatus
from ...schemas.moderator import (
    ModeratorCreate, ModeratorUpdate, ModeratorResponse, 
    ModeratorLogin, ModeratorLoginResponse, ModeratorStats
)
from ...core.security import verify_password, hash_password as get_password_hash, create_access_token, verify_token
from .users import get_current_user_dependency, get_current_admin_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="moderators/login")

# Dependency to get current moderator
def get_current_moderator(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current moderator from token"""
    try:
        payload = verify_token(token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        moderator_id = payload.get("sub")
        if moderator_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        moderator = db.query(Moderator).filter(Moderator.moderator_id == int(moderator_id)).first()
        if moderator is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Moderator not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if moderator.status != ModeratorStatus.active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Moderator account is not active",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return moderator
        
    except Exception as e:
        logger.error(f"Error verifying moderator token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/create", response_model=ModeratorResponse, status_code=status.HTTP_201_CREATED)
def create_moderator_from_application(
    mod_request_id: int,
    password: str,
    current_admin = Depends(get_current_admin_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a moderator account from an approved moderator application
    """
    try:
        # Get the moderator request
        mod_request = db.query(ModRequest).filter(
            ModRequest.request_id == mod_request_id,
            ModRequest.status == ModRequestStatus.approved
        ).first()
        
        if not mod_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approved moderator application not found"
            )
        
        # Check if moderator already exists for this user
        existing_moderator = db.query(Moderator).filter(
            Moderator.user_id == mod_request.user_id
        ).first()
        
        if existing_moderator:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Moderator account already exists for this user"
            )
        
        # Get user details
        user = db.query(User).filter(User.user_id == mod_request.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create moderator account
        hashed_password = get_password_hash(password)
        
        new_moderator = Moderator(
            user_id=user.user_id,
            email=user.email,
            password_hash=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            phone_number=user.phone_number,
            status=ModeratorStatus.active,
            approved_by=current_admin.admin_id if hasattr(current_admin, 'admin_id') else None,
            mod_request_id=mod_request_id
        )
        
        db.add(new_moderator)
        db.commit()
        db.refresh(new_moderator)
        
        logger.info(f"Moderator account created for user {user.user_id} by admin")
        
        return new_moderator
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating moderator account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating moderator account"
        )

@router.post("/login", response_model=ModeratorLoginResponse)
def login_moderator(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate moderator and return access token
    """
    try:
        moderator = db.query(Moderator).filter(
            Moderator.email == form_data.username.lower()
        ).first()
        
        if not moderator or not verify_password(form_data.password, moderator.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if moderator.status != ModeratorStatus.active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Moderator account is not active",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        moderator.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token_expires = timedelta(minutes=60 * 24)  # 24 hours
        access_token = create_access_token(
            data={"sub": str(moderator.moderator_id), "type": "moderator"},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Moderator {moderator.email} logged in successfully")
        
        return ModeratorLoginResponse(
            access_token=access_token,
            token_type="bearer",
            moderator=moderator
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during moderator login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )

@router.get("/me", response_model=ModeratorResponse)
def get_current_moderator_profile(
    current_moderator: Moderator = Depends(get_current_moderator)
):
    """
    Get current moderator profile
    """
    return current_moderator

@router.put("/me", response_model=ModeratorResponse)
def update_moderator_profile(
    moderator_update: ModeratorUpdate,
    current_moderator: Moderator = Depends(get_current_moderator),
    db: Session = Depends(get_db)
):
    """
    Update current moderator profile
    """
    try:
        # Update fields
        if moderator_update.phone_number is not None:
            current_moderator.phone_number = moderator_update.phone_number
        
        # Only allow status updates by admins (for now, allow self-update)
        if moderator_update.status is not None:
            current_moderator.status = moderator_update.status
        
        db.commit()
        db.refresh(current_moderator)
        
        logger.info(f"Moderator {current_moderator.moderator_id} updated profile")
        
        return current_moderator
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating moderator profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating profile"
        )

@router.get("/all", response_model=List[ModeratorResponse])
def get_all_moderators(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[ModeratorStatus] = None,
    current_admin = Depends(get_current_admin_dependency),
    db: Session = Depends(get_db)
):
    """
    Get all moderators (Admin only)
    """
    try:
        query = db.query(Moderator)
        
        if status_filter:
            query = query.filter(Moderator.status == status_filter)
        
        moderators = query.offset(skip).limit(limit).all()
        return moderators
        
    except Exception as e:
        logger.error(f"Error fetching moderators: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching moderators"
        )

@router.get("/stats", response_model=ModeratorStats)
def get_moderator_stats(
    current_admin = Depends(get_current_admin_dependency),
    db: Session = Depends(get_db)
):
    """
    Get moderator statistics (Admin only)
    """
    try:
        total_moderators = db.query(Moderator).count()
        active_moderators = db.query(Moderator).filter(
            Moderator.status == ModeratorStatus.active
        ).count()
        suspended_moderators = db.query(Moderator).filter(
            Moderator.status == ModeratorStatus.suspended
        ).count()
        
        # TODO: Implement actual counts for daily activities
        # These would require activity logging tables
        reports_handled_today = 0
        content_moderated_today = 0
        users_managed_today = 0
        
        return ModeratorStats(
            total_moderators=total_moderators,
            active_moderators=active_moderators,
            suspended_moderators=suspended_moderators,
            reports_handled_today=reports_handled_today,
            content_moderated_today=content_moderated_today,
            users_managed_today=users_managed_today
        )
        
    except Exception as e:
        logger.error(f"Error fetching moderator stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching moderator statistics"
        )

@router.put("/{moderator_id}/status", response_model=ModeratorResponse)
def update_moderator_status(
    moderator_id: int,
    new_status: ModeratorStatus,
    current_admin = Depends(get_current_admin_dependency),
    db: Session = Depends(get_db)
):
    """
    Update moderator status (Admin only)
    """
    try:
        moderator = db.query(Moderator).filter(
            Moderator.moderator_id == moderator_id
        ).first()
        
        if not moderator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Moderator not found"
            )
        
        moderator.status = new_status
        db.commit()
        db.refresh(moderator)
        
        logger.info(f"Moderator {moderator_id} status updated to {new_status} by admin")
        
        return moderator
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating moderator status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating moderator status"
        )
