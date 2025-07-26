#!/usr/bin/env python3
"""
Manually trigger moderator creation for already approved request
"""

from app.db.database import get_db
from app.db.models.modRequest import ModRequest, ModRequestStatus
from app.db.models.user import User
from app.db.models.moderator import Moderator, ModeratorStatus
from datetime import datetime

def manually_create_moderator():
    """Manually create moderator for the approved request"""
    try:
        db = next(get_db())
        
        # Get the approved mod request
        request = db.query(ModRequest).filter(
            ModRequest.request_id == 2,
            ModRequest.status == ModRequestStatus.approved
        ).first()
        
        if not request:
            print("❌ No approved mod request found with ID 2")
            return
            
        print(f"✅ Found approved request: ID {request.request_id}, User ID: {request.user_id}")
        
        # Check if moderator already exists
        existing_moderator = db.query(Moderator).filter(
            Moderator.user_id == request.user_id
        ).first()
        
        if existing_moderator:
            print(f"ℹ️  Moderator already exists: {existing_moderator.moderator_id}")
            return
            
        print("🔍 No existing moderator found, creating new one...")
        
        # Get user details
        user = db.query(User).filter(User.user_id == request.user_id).first()
        if not user:
            print(f"❌ User not found for user_id: {request.user_id}")
            return
            
        print(f"👤 Found user: {user.email} ({user.first_name} {user.last_name})")
        
        # Use the existing user's hashed password
        hashed_password = user.password_hash
        
        print(f"🔐 Using existing user password hash (length: {len(hashed_password)})")
        
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
        
        print("💾 Creating moderator account...")
        
        db.add(new_moderator)
        db.commit()
        db.refresh(new_moderator)
        
        print(f"🎉 SUCCESS: Moderator created with ID: {new_moderator.moderator_id}")
        print(f"📝 Moderator details:")
        print(f"   - Email: {new_moderator.email}")
        print(f"   - Name: {new_moderator.first_name} {new_moderator.last_name}")
        print(f"   - Status: {new_moderator.status}")
        print(f"   - Created: {new_moderator.created_at}")
        print(f"   - Request ID: {new_moderator.mod_request_id}")
        
        print()
        print("✅ The user can now login to the moderator dashboard using:")
        print(f"   Email: {user.email}")
        print(f"   Password: [their existing account password]")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()

if __name__ == "__main__":
    print("🚀 Manually creating moderator for approved request...")
    manually_create_moderator()
