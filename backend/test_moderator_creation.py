#!/usr/bin/env python3
"""
Test script to debug moderator creation during approval process
"""

from app.db.database import get_db
from app.db.models.modRequest import ModRequest, ModRequestStatus
from app.db.models.user import User
from app.db.models.moderator import Moderator, ModeratorStatus
from app.core.security import hash_password as get_password_hash
from sqlalchemy.orm import Session
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_moderator_creation():
    """Test creating a moderator for the approved request"""
    try:
        db = next(get_db())
        
        # Get the approved mod request
        request = db.query(ModRequest).filter(
            ModRequest.request_id == 2,
            ModRequest.status == ModRequestStatus.approved
        ).first()
        
        if not request:
            print("No approved mod request found with ID 2")
            return
            
        print(f"Found approved request: ID {request.request_id}, User ID: {request.user_id}")
        
        # Check if moderator already exists
        existing_moderator = db.query(Moderator).filter(
            Moderator.user_id == request.user_id
        ).first()
        
        if existing_moderator:
            print(f"Moderator already exists: {existing_moderator.moderator_id}")
            return
            
        # Get user details
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            print(f"User not found for user_id: {request.user_id}")
            return
            
        print(f"Found user: {user.email} ({user.first_name} {user.last_name})")
        
        # Use the existing user's hashed password (no need to create a new one)
        hashed_password = user.password_hash
        
        print(f"Using existing user password hash")
        print(f"Hashed password length: {len(hashed_password)}")
        
        # Create moderator account
        new_moderator = Moderator(
            user_id=user.user_id,
            email=user.email,
            password_hash=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
            phone_number=user.phone_number,
            status=ModeratorStatus.active,
            approved_by=1,  # Assuming admin ID 1
            mod_request_id=request.request_id
        )
        
        print("Created moderator object, attempting to save...")
        
        db.add(new_moderator)
        db.commit()
        db.refresh(new_moderator)
        
        print(f"SUCCESS: Moderator created with ID: {new_moderator.moderator_id}")
        print(f"Moderator details: {new_moderator.to_dict()}")
        
        # Verify the moderator was saved
        verify_moderator = db.query(Moderator).filter(
            Moderator.moderator_id == new_moderator.moderator_id
        ).first()
        
        if verify_moderator:
            print(f"VERIFIED: Moderator exists in database")
        else:
            print(f"ERROR: Moderator not found after creation")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()

if __name__ == "__main__":
    test_moderator_creation()
