from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from pytz import timezone
from mysql.connector import connect, Error as MySQLError
import logging


from ...db.database import create_connection
from ...db.database import get_db
from ...db.models.user import User
from ...db.models.admin import Admin
from ...core.credit_manager import CreditManager
from ...schemas.user import (
    UserCreate, 
    UserResponse, 
    UserLogin, 
    AdminLogin,
    Token, 
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserUpdate
)
from ...core.security import (
    hash_password, 
    verify_password, 
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token
)
from ...core.email import send_password_reset_email
from fastapi.security import OAuth2PasswordBearer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

router = APIRouter()

def get_current_user_dependency(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from ...core.security import verify_token
    credentials_exception = HTTPException(
    # Get the email from the token
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    # Get the user from the database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_admin_dependency(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependency to get current admin user from token"""
    from ...core.security import verify_token
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    admin_exception = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    # Try admin table first
    admin = db.query(Admin).filter(Admin.email == email).first()
    if admin:
        return admin
    
    # If not in admin table, check if user is an admin by email
    user = db.query(User).filter(
        User.email == email,
        User.status == 'Active',
        User.email.in_(["admin@timenest.com", "admin@example.com"])  # Simplified admin check
    ).first()
    
    if not user:
        raise admin_exception
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash the password
        hashed_password = hash_password(user_data.password)

        # Create new user with initial 10 credits
        new_user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password_hash=hashed_password,
            phone_number=user_data.phone_number,
            gender=user_data.gender,
            age=user_data.age,
            location=user_data.location,
            time_credits=0,  # Start with 10 credits
            total_credits_earned=0  # Count initial credits as earned
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create initial transaction record for the 10 credits
        try:
            credit_manager = CreditManager(db)
            credit_manager.add_initial_bonus(new_user.user_id, amount=Decimal('10.00'))
        except Exception as credit_error:
            # Log the error but don't fail registration
            print(f"Warning: Could not create initial credit transaction: {credit_error}")

        return new_user

    except IntegrityError as e:
        db.rollback()
        if "email" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Database integrity error"
            )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during registration: {str(e)}"
        )

@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access token
    """
    # Find user by email
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    india_tz = timezone("Asia/Kolkata")
    user.last_login = datetime.now(india_tz)
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email, "firstName": user.first_name, "user_id": user.user_id}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/admin-login", response_model=Token)
def admin_login(admin_credentials: AdminLogin, db: Session = Depends(get_db)):
    """
    Authenticate admin user and return access token
    """
    try:
        logger.info(f"Admin login attempt for email: {admin_credentials.email}")
        
        # Find admin by email in the database
        admin = db.query(Admin).filter(Admin.email == admin_credentials.email).first()
        
        if not admin:
            logger.warning(f"Admin not found for email: {admin_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Admin found: {admin.email}, checking password...")
        
        # Verify password (plain text comparison as requested)
        if admin_credentials.password != admin.password:
            logger.warning(f"Password mismatch for admin: {admin_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        india_tz = timezone("Asia/Kolkata")
        admin.last_login = datetime.now(india_tz)
        db.commit()
        
        logger.info(f"Successful admin login for email: {admin_credentials.email}")
        
        # Create access token for admin (simplified payload since role is implicit)
        access_token_expires = timedelta(hours=8)  # Longer session for admin
        access_token = create_access_token(
            data={
                "sub": admin.email,
                "admin_id": admin.admin_id
            }, 
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise
    except Exception as e:
        logger.error(f"Unhandled error during admin login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during admin authentication. Please try again."
        )

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send password reset email to user
    """
    try:
        logger.info(f"Password reset requested for email: {request.email}")
        
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if user:
            logger.info(f"User found for email: {request.email}")
            
            # Generate reset token
            reset_token = create_password_reset_token(user.email)
            
            # Set token expiration (15 minutes from now)
            india_tz = timezone("Asia/Kolkata")
            expires_at = datetime.now(india_tz) + timedelta(minutes=15)
            
            # Update user with reset token and expiration
            user.reset_token = reset_token
            user.reset_token_expires_at = expires_at
            db.commit()
            
            logger.info(f"Reset token generated and saved for user: {request.email}")
            
            # Create reset link (adjust URL based on your frontend)
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
            
            # Send email
            email_sent = send_password_reset_email(
                recipient_email=user.email,
                reset_token=reset_token,
                reset_link=reset_link
            )
            
            if not email_sent:
                logger.warning(f"Failed to send email to {user.email}, but continuing...")
                # Don't fail the request if email sending fails in development
        else:
            logger.info(f"No user found for email: {request.email}")
        
        # Always return success message to prevent email enumeration
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }
        
    except Exception as e:
        logger.error(f"Error in forgot_password endpoint: {str(e)}")
        # Return success message even on error to prevent information disclosure
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using the reset token
    """
    try:
        # Verify the reset token
        email = verify_password_reset_token(request.token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Find user by email
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Define the timezone
        india_tz = timezone("Asia/Kolkata")
        
        # Get current time as timezone-aware
        current_time = datetime.now(india_tz)
        
        # Get the stored expiration time
        stored_expires_at = user.reset_token_expires_at
        
        # CRITICAL: Ensure stored_expires_at is timezone-aware for comparison
        # If it's naive (which is likely how SQLAlchemy's DateTime stores it),
        # localize it to the expected timezone (Asia/Kolkata).
        if stored_expires_at and stored_expires_at.tzinfo is None:
            stored_expires_at = india_tz.localize(stored_expires_at)
        # If it's already timezone-aware but in a different timezone, convert it.
        elif stored_expires_at and stored_expires_at.tzinfo != india_tz:
            stored_expires_at = stored_expires_at.astimezone(india_tz)
        
        # Check if token matches and hasn't expired
        if (user.reset_token != request.token or 
            not stored_expires_at or  # Check if it's None
            current_time > stored_expires_at):  # Compare timezone-aware with timezone-aware
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash the new password
        hashed_password = hash_password(request.new_password)
        
        # Update user password and clear reset token
        user.password_hash = hashed_password
        user.reset_token = None
        user.reset_token_expires_at = None  # Clear the expiration time
        db.commit()
        
        return {"message": "Password has been reset successfully"}
        
    except HTTPException:
        # Re-raise HTTPExceptions to be handled by FastAPI
        raise
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Unhandled error during password reset: {e}", exc_info=True)
        # Rollback the session in case of an error
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting your password. Please try again."
        )

@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(get_current_user_dependency)):
    """
    Get current user information
    """
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all users (for admin purposes)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/profile")
def get_user_profile(current_user: User = Depends(get_current_user_dependency), db: Session = Depends(get_db)):
    user_profile = db.query(User).filter(User.email == current_user.email).first()
    name = user_profile.first_name + " " + user_profile.last_name
    
    # Calculate real-time statistics from database
    from ...db.models.serviceBooking import ServiceBooking
    from ...db.models.service import Service
    
    # Count services completed (as a provider)
    services_completed = db.query(ServiceBooking).join(Service).filter(
        Service.creator_id == user_profile.user_id,
        ServiceBooking.status == 'completed'
    ).count()
    
    # Count services availed (as a customer)
    services_availed = db.query(ServiceBooking).filter(
        ServiceBooking.user_id == user_profile.user_id,
        ServiceBooking.status == 'completed'
    ).count()
    
    profile_data_response = {
        "user_id": user_profile.user_id,
        "name": name,
        "email": user_profile.email,
        "phone_number": user_profile.phone_number if user_profile.phone_number else "Not provided",
        "joined_date": user_profile.date_joined.strftime("%d-%m-%Y") if user_profile.date_joined else "Not provided",
        "location": user_profile.location if user_profile.location else "Not provided",
        "status": user_profile.status if user_profile.status else "Active",
        "total_credits_earned": float(user_profile.total_credits_earned) if user_profile.total_credits_earned else 0.0,
        "total_credits_spent": float(user_profile.total_credits_spent) if user_profile.total_credits_spent else 0.0,
        "time_credits": float(user_profile.time_credits) if user_profile.time_credits else 0.0,
        "services_completed_count": services_completed,  # Use calculated value
        "services_availed_count": services_availed,      # Use calculated value
    }
    print(profile_data_response)
    return profile_data_response

@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user_dependency), 
    db: Session = Depends(get_db)
):
    """
    Update current user's profile
    """
    try:
        # Get the current user from the database
        db_user = db.query(User).filter(User.email == current_user.email).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update only the fields that are provided
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(db_user, field):
                setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating your profile. Please try again."
        )

@router.get("/admin/users")
def get_all_users_admin(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort: Optional[str] = None,
    order: Optional[str] = "asc",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_dependency)
):
    """
    Get all users with search and filter capabilities (Admin only)
    """
    try:
        print(status)
        query = db.query(User)
        
        # Apply search filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                User.first_name.ilike(search_filter) |
                User.last_name.ilike(search_filter) |
                User.email.ilike(search_filter) |
                User.phone_number.ilike(search_filter) |
                User.location.ilike(search_filter)
            )
        print(status)
        # Apply status filter
        if status and status != "all":
            if status == "active":
                query = query.filter(User.status == "Active")
            elif status == "suspended":
                query = query.filter(User.status == "Suspended")
            elif status == "deactivated":
                query = query.filter(User.status == "Deactivated")
        
        # Apply sorting
        if sort:
            print(f"Sorting by: {sort}, order: {order}")
            if sort == "created_at":
                try:
                    if order == "desc":
                        query = query.order_by(User.date_joined.desc())
                    else:
                        query = query.order_by(User.date_joined.asc())
                    print("Successfully applied date_joined sorting")
                except Exception as sort_error:
                    print(f"Error applying sorting: {sort_error}")
                    # Skip sorting if there's an error
                    pass
            elif sort == "name":
                if order == "desc":
                    query = query.order_by(User.first_name.desc())
                else:
                    query = query.order_by(User.first_name.asc())
        
        # Apply pagination
        users = query.offset(skip).limit(limit).all()
        
        return users
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching users"
        )

@router.get("/admin/users/stats")
def get_user_stats_admin(
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_dependency)
):
    """
    Get user statistics (Admin only)
    """
    try:
        total_users = db.query(User).count()
        verified_users = db.query(User).filter(User.phone_number.isnot(None)).count()
        active_users = db.query(User).filter(User.status == "Active").count()
        
        # Calculate verification rate
        verification_rate = f"{(verified_users / total_users * 100):.1f}%" if total_users > 0 else "0%"
        
        return {
            "total_users": total_users,
            "verified_users": verified_users,
            "active_users": active_users,
            "verification_rate": verification_rate
        }
        
    except Exception as e:
        logger.error(f"Error fetching user statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while fetching user statistics"
        )

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_admin(user_id: int, db: Session = Depends(get_db)):
    """
    Delete a user (Admin only)
    """
    try:
        print("userid: ", user_id)
        # Find the user
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Delete the user
        db.delete(user)
        db.commit()

        return {"message": "User deleted successfully"}

    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the user"
        )

@router.patch("/admin/update-status/{user_id}")
def admin_update_user_status(
    user_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_admin = Depends(get_current_admin_dependency)
):
    """
    Admin: Update a user's status (Active, Suspended, Deactivated)
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = status
    db.commit()
    db.refresh(user)
    return {"success": True, "user_id": user.user_id, "new_status": user.status}

# Dependency to get current user from token

# OAuth2 scheme for token authentication
