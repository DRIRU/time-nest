#!/usr/bin/env python3
"""
Verify the moderator creation after approval
"""

from app.db.database import get_db
from app.db.models.modRequest import ModRequest, ModRequestStatus
from app.db.models.moderator import Moderator

def verify_approval_result():
    """Check the status after approval"""
    try:
        db = next(get_db())
        
        # Check mod request status
        request = db.query(ModRequest).filter(ModRequest.request_id == 2).first()
        if request:
            print(f"📋 Mod Request Status: {request.status}")
            print(f"📅 Reviewed At: {request.reviewed_at}")
        else:
            print("❌ No mod request found")
            
        # Check moderators
        moderators = db.query(Moderator).all()
        print(f"\n👥 Total Moderators: {len(moderators)}")
        
        for mod in moderators:
            print(f"  ✅ Moderator ID: {mod.moderator_id}")
            print(f"     Email: {mod.email}")
            print(f"     Status: {mod.status}")
            print(f"     Created: {mod.created_at}")
            print(f"     Approved By: {mod.approved_by}")
            print(f"     Linked Request: {mod.mod_request_id}")
            print()
            
        if len(moderators) > 0:
            print("🎉 SUCCESS: Moderator account was created!")
            print("💡 The user can now login to the moderator dashboard using their existing email/password")
        else:
            print("⚠️  No moderator accounts found. The approval might not have triggered the creation.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_approval_result()
