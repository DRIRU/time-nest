from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging
from datetime import datetime

from ...db.database import get_db
from ...db.models.modRequest import ModRequest, ModRequestStatus
from ...db.models.user import User
from ...db.models.admin import Admin
from ...db.models.moderator import Moderator, ModeratorStatus
from ...schemas.modRequest import ModRequestCreate, ModRequestResponse, ModRequestUpdate
from .users import get_current_user_dependency, get_current_admin_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Helper function to check if a user is an admin
def is_admin_user(user, db: Session):
    """Check if the user is an admin"""
    if hasattr(user, 'admin_id'):  # If it's already an Admin object
        return True
        
    # Check if user email is in the admin list
    return db.query(User).filter(
        User.user_id == user.user_id,
        User.status == 'Active',
        User.email.in_(["admin@timenest.com", "admin@example.com"])
    ).first() is not None

@router.post("/", response_model=ModRequestResponse, status_code=status.HTTP_201_CREATED)
def create_mod_request(
    request_data: ModRequestCreate, 
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new moderator application request
    """
    try:
        # Check if user already has a pending or approved mod request
        existing_request = db.query(ModRequest).filter(
            ModRequest.user_id == current_user.user_id,
            ModRequest.status.in_([ModRequestStatus.pending, ModRequestStatus.approved])
        ).first()
        
        if existing_request:
            if existing_request.status == ModRequestStatus.pending:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You already have a pending moderator application"
                )
            elif existing_request.status == ModRequestStatus.approved:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already a moderator"
                )
        
        # Create new mod request
        new_request = ModRequest(
            user_id=current_user.user_id,
            reason=request_data.reason,
            experience=request_data.experience,
            status=ModRequestStatus.pending
        )

        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        # Get user name for the response
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        
        # Create response data
        response_data = {
            "request_id": new_request.request_id,
            "user_id": new_request.user_id,
            "reason": new_request.reason,
            "experience": new_request.experience,
            "status": new_request.status,
            "submitted_at": new_request.submitted_at,
            "reviewed_at": new_request.reviewed_at,
            "user_name": user_name
        }

        return response_data

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating mod request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during mod request creation: {str(e)}"
        )

@router.get("/my-applications", response_model=List[ModRequestResponse])
def get_user_mod_applications(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get the current user's moderator application requests
    """
    try:
        # Build the query - only get the current user's requests
        query = db.query(ModRequest).filter(ModRequest.user_id == current_user.user_id)
        
        # Apply pagination
        requests = query.offset(skip).limit(limit).all()
        
        # Process each request to format the response correctly
        response_requests = []
        for request in requests:
            # Get user name
            user = db.query(User).filter(User.user_id == request.user_id).first()
            user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
            
            response_requests.append({
                "request_id": request.request_id,
                "user_id": request.user_id,
                "reason": request.reason,
                "experience": request.experience,
                "status": request.status,
                "submitted_at": request.submitted_at,
                "reviewed_at": request.reviewed_at,
                "user_name": user_name
            })
        
        return response_requests
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user mod applications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching your moderator applications: {str(e)}"
        )

@router.get("/all", response_model=List[ModRequestResponse])
def get_all_mod_applications_admin(
    status: str = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_dependency)
):
    """
    Get all moderator application requests (admin only)
    """
    try:
        # Build the query
        query = db.query(ModRequest)
        
        # Apply status filter if provided
        if status:
            try:
                status_enum = ModRequestStatus(status)
                query = query.filter(ModRequest.status == status_enum)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status: {status}. Must be one of: {', '.join([e.value for e in ModRequestStatus])}"
                )
        
        # Apply pagination
        requests = query.offset(skip).limit(limit).all()
        
        # Process each request to format the response correctly
        response_requests = []
        for request in requests:
            # Get user name
            user = db.query(User).filter(User.user_id == request.user_id).first()
            user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
            
            response_requests.append({
                "request_id": request.request_id,
                "user_id": request.user_id,
                "reason": request.reason,
                "experience": request.experience,
                "status": request.status,
                "submitted_at": request.submitted_at,
                "reviewed_at": request.reviewed_at,
                "user_name": user_name
            })
        
        return response_requests
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all mod applications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching all moderator applications: {str(e)}"
        )

@router.get("/{request_id}", response_model=ModRequestResponse)
def get_mod_request(
    request_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get a specific moderator application by ID
    - Regular users can only view their own applications
    - Admins can view any application
    """
    # Check if user is an admin
    is_admin = is_admin_user(current_user, db)
    
    # Get the request
    request = db.query(ModRequest).filter(ModRequest.request_id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moderator application request not found"
        )
    
    # Check if the current user is authorized to view this request
    if not is_admin and request.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this moderator application"
        )
    
    # Get user name
    user = db.query(User).filter(User.user_id == request.user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
    
    response_data = {
        "request_id": request.request_id,
        "user_id": request.user_id,
        "reason": request.reason,
        "experience": request.experience,
        "status": request.status,
        "submitted_at": request.submitted_at,
        "reviewed_at": request.reviewed_at,
        "user_name": user_name
    }
    
    return response_data

@router.put("/{request_id}", response_model=ModRequestResponse)
def update_mod_request(
    request_id: int,
    request_data: ModRequestUpdate,
    current_user = Depends(get_current_admin_dependency),
    db: Session = Depends(get_db)
):
    """
    Update a moderator application request (admin only)
    """
    # Check if user is an admin
    if not is_admin_user(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update moderator applications"
        )
    
    # Get the application
    request = db.query(ModRequest).filter(ModRequest.request_id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Moderator application request not found"
        )
    
    # Update status if provided
    if request_data.status is not None:
        try:
            old_status = request.status
            new_status = ModRequestStatus(request_data.status)
            request.status = new_status
            request.reviewed_at = datetime.utcnow()
            
            # If status is being changed to approved, create moderator account
            if old_status != ModRequestStatus.approved and new_status == ModRequestStatus.approved:
                logger.info(f"🎯 Creating moderator for approved request {request.request_id}")
                
                # Check if moderator account already exists
                existing_moderator = db.query(Moderator).filter(
                    Moderator.user_id == request.user_id
                ).first()
                
                if existing_moderator:
                    logger.info(f"⚠️ Moderator already exists for user {request.user_id}")
                else:
                    logger.info(f"✅ No existing moderator found, creating new one for user {request.user_id}")
                    
                    # Get user details
                    user = db.query(User).filter(User.user_id == request.user_id).first()
                    if user:
                        logger.info(f"👤 Found user: {user.email}")
                        
                        # Use the existing user's hashed password (they can use same login credentials)
                        hashed_password = user.password_hash
                        
                        # Create moderator account
                        new_moderator = Moderator(
                            user_id=user.user_id,
                            email=user.email,
                            password_hash=hashed_password,
                            first_name=user.first_name,
                            last_name=user.last_name,
                            phone_number=user.phone_number,
                            status=ModeratorStatus.active,
                            approved_by=current_user.admin_id if hasattr(current_user, 'admin_id') else None,
                            mod_request_id=request.request_id
                        )
                        
                        db.add(new_moderator)
                        logger.info(f"🎉 Moderator account created for user {user.user_id}")
                        
                        # TODO: Send email to user with login credentials
                        # This should include the default password and instructions to change it
                    else:
                        logger.error(f"❌ User not found for user_id: {request.user_id}")
            else:
                logger.info(f"ℹ️ Moderator creation condition not met. Old status: {old_status}, New status: {new_status}")
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {request_data.status}. Must be one of: {', '.join([e.value for e in ModRequestStatus])}"
            )
    
    try:
        db.commit()
        db.refresh(request)
        
        # Get user name
        user = db.query(User).filter(User.user_id == request.user_id).first()
        user_name = f"{user.first_name} {user.last_name}" if user else "Unknown"
        
        response_data = {
            "request_id": request.request_id,
            "user_id": request.user_id,
            "reason": request.reason,
            "experience": request.experience,
            "status": request.status,
            "submitted_at": request.submitted_at,
            "reviewed_at": request.reviewed_at,
            "user_name": user_name
        }
        
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating mod request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during mod request update: {str(e)}"
        )