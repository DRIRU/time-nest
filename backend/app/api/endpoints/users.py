from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime, timedelta
from pytz import timezone

from ...db.database import get_db
from ...db.models.user import User
from ...schemas.user import (
    UserCreate, 
    UserResponse, 
    UserLogin, 
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

router = APIRouter()

def get_current_user_dependency(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from ...core.security import verify_token
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
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
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send password reset email to user
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if user:
            # Generate reset token
            reset_token = create_password_reset_token(user.email)
            
            # Set token expiration (15 minutes from now)
            india_tz = timezone("Asia/Kolkata")
            expires_at = datetime.now(india_tz) + timedelta(minutes=15)
            
            # Update user with reset token and expiration
            user.reset_token = reset_token
            user.reset_token_expires_at = expires_at
            db.commit()
            
            # Create reset link (adjust URL based on your frontend)
            reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
            
            # Send email
            email_sent = send_password_reset_email(
                recipient_email=user.email,
                reset_token=reset_token,
                reset_link=reset_link
            )
            
            if not email_sent:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send reset email. Please try again later."
                )
        
        # Always return success message to prevent email enumeration
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again later."
        )

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
        
        # Check if token matches and hasn't expired
        india_tz = timezone("Asia/Kolkata")
        current_time = datetime.now(india_tz)
        
        if (user.reset_token != request.token or 
            not user.reset_token_expires_at or 
            current_time > user.reset_token_expires_at):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash the new password
        hashed_password = hash_password(request.new_password)
        
        # Update user password and clear reset token
        user.password_hash = hashed_password
        user.reset_token = None
        user.reset_token_expires_at = None
        db.commit()
        
        return {"message": "Password has been reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
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