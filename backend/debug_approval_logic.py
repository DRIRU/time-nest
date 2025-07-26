#!/usr/bin/env python3
"""
Debug the approval flow logic
"""

from app.db.database import get_db
from app.db.models.modRequest import ModRequest, ModRequestStatus
from app.db.models.user import User
from app.db.models.moderator import Moderator, ModeratorStatus
from datetime import datetime

def debug_approval_logic():
    """Debug why the approval logic isn't working"""
    try:
        db = next(get_db())
        
        # Get the current request
        request = db.query(ModRequest).filter(ModRequest.request_id == 2).first()
        
        if not request:
            print("❌ No request found with ID 2")
            return
            
        print(f"📋 Current request status: {request.status}")
        print(f"📅 Reviewed at: {request.reviewed_at}")
        
        # Simulate the approval logic
        old_status = request.status  # This is already 'approved'
        new_status = ModRequestStatus.approved  # This is what we're setting it to
        
        print(f"🔄 Approval Logic Check:")
        print(f"   Old status: {old_status}")
        print(f"   New status: {new_status}")
        print(f"   old_status != new_status: {old_status != new_status}")
        print(f"   Condition met: {old_status != ModRequestStatus.approved and new_status == ModRequestStatus.approved}")
        
        if old_status != ModRequestStatus.approved and new_status == ModRequestStatus.approved:
            print("✅ Logic condition MET - would create moderator")
        else:
            print("❌ Logic condition NOT MET - this is why moderator wasn't created!")
            print("💡 The request was already approved, so old_status == ModRequestStatus.approved")
            
        # Check if moderator exists
        existing_moderator = db.query(Moderator).filter(
            Moderator.user_id == request.user_id
        ).first()
        
        if existing_moderator:
            print(f"ℹ️  Moderator already exists: {existing_moderator.moderator_id}")
        else:
            print("ℹ️  No moderator exists for this user")
            
        print()
        print("💡 SOLUTION: We need to modify the logic to handle this case")
        print("   Option 1: Check if moderator exists regardless of status change")
        print("   Option 2: Add a manual 'create moderator' action")
        print("   Option 3: Allow re-approval to trigger moderator creation")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_approval_logic()
