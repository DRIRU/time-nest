#!/usr/bin/env python3
"""
Test the API approval flow for moderator creation
"""

import requests
import json

def test_api_approval():
    """Test the API approval flow"""
    
    # API endpoint
    base_url = "http://localhost:8000"
    
    # First, let's try to get admin login (you'll need to replace with actual admin credentials)
    # For now, let's just test the approval endpoint directly
    
    # Update request data to approve the moderator application
    update_data = {
        "status": "approved"
    }
    
    try:
        # Test the approval API endpoint
        # Note: This will need proper authentication headers in real scenario
        response = requests.put(
            f"{base_url}/api/mod-requests/2",  # Request ID 2
            json=update_data,
            headers={"Content-Type": "application/json"}
            # TODO: Add authorization header with admin token
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ API call successful")
            # Now check if moderator was created
            check_moderator_creation()
        else:
            print("❌ API call failed")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def check_moderator_creation():
    """Check if moderator was created after approval"""
    try:
        from app.db.database import get_db
        from app.db.models.moderator import Moderator
        
        db = next(get_db())
        moderators = db.query(Moderator).all()
        
        print(f"\n📊 Moderators after approval:")
        print(f"Total count: {len(moderators)}")
        
        for mod in moderators:
            print(f"  - ID: {mod.moderator_id}, User: {mod.email}, Status: {mod.status}")
            
    except Exception as e:
        print(f"❌ Error checking moderators: {e}")

if __name__ == "__main__":
    print("🚀 Testing API approval flow...")
    test_api_approval()
