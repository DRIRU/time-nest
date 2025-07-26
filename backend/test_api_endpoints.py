#!/usr/bin/env python3
"""
Test moderator API endpoints
"""

import requests
import json

def test_moderator_endpoints():
    """Test if moderator endpoints are accessible"""
    base_url = "http://localhost:8000"
    
    print("🔍 Testing moderator API endpoints...")
    
    # Test if the API is running
    try:
        response = requests.get(f"{base_url}/api/v1/health")
        if response.status_code == 200:
            print("✅ API is running")
        else:
            print("❌ API health check failed")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure the server is running on port 8000")
        return
    
    # Test moderator login endpoint
    try:
        # This should return a 422 (validation error) for missing data, not 404
        response = requests.post(f"{base_url}/api/v1/moderators/login")
        print(f"📍 POST /api/v1/moderators/login - Status: {response.status_code}")
        
        if response.status_code == 404:
            print("❌ Moderator login endpoint not found!")
            print("💡 The moderator router might not be properly registered")
        elif response.status_code == 422:
            print("✅ Moderator login endpoint exists (validation error expected)")
        else:
            print(f"ℹ️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing login endpoint: {e}")
    
    # Test moderator stats endpoint (should require auth)
    try:
        response = requests.get(f"{base_url}/api/v1/moderators/stats")
        print(f"📍 GET /api/v1/moderators/stats - Status: {response.status_code}")
        
        if response.status_code == 404:
            print("❌ Moderator stats endpoint not found!")
        elif response.status_code == 401:
            print("✅ Moderator stats endpoint exists (auth required)")
        else:
            print(f"ℹ️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing stats endpoint: {e}")
    
    # List all available endpoints
    try:
        response = requests.get(f"{base_url}/docs")
        if response.status_code == 200:
            print("✅ API documentation available at http://localhost:8000/docs")
            print("💡 Check the docs to see if moderator endpoints are listed")
        else:
            print("⚠️  API documentation not accessible")
    except Exception as e:
        print(f"❌ Error checking docs: {e}")

if __name__ == "__main__":
    test_moderator_endpoints()
