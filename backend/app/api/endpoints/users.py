from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timedelta
from pytz import timezone
import logging

from ...db.database import get_db
from ...db.models.user import User
from ...db.models.admin import Admin
from ...schemas.user import (
    UserCreate, 
    UserResponse, 
    UserLogin, 
    AdminLogin,
    Token, 
    ForgotPasswordRequest,
    ResetPasswordRequest
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

        # Create new user
        new_user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password_hash=hashed_password,
            phone_number=user_data.phone_number,
            gender=user_data.gender,
            age=user_data.age,
            location=user_data.location
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

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

# Dependency to get current user from token

# OAuth2 scheme for token authentication