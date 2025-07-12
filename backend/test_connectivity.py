#!/usr/bin/env python3
"""
Test script to verify backend connectivity
"""

import requests
import sys

def test_backend_connectivity():
    """Test if the backend is accessible"""
    try:
        # Test the root endpoint
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"Root endpoint status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test the health endpoint
        response = requests.get("http://localhost:8000/api/v1/health", timeout=5)
        print(f"Health endpoint status: {response.status_code}")
        print(f"Health response: {response.json()}")
        
        # Test CORS preflight
        response = requests.options("http://localhost:8000/api/v1/chat/conversations", 
                                   headers={
                                       "Origin": "http://localhost:3000",
                                       "Access-Control-Request-Method": "GET",
                                       "Access-Control-Request-Headers": "Content-Type,Authorization"
                                   }, timeout=5)
        print(f"CORS preflight status: {response.status_code}")
        print(f"CORS headers: {dict(response.headers)}")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend server at http://localhost:8000")
        print("Make sure the backend server is running with: python main.py")
        return False
    except requests.exceptions.Timeout:
        print("ERROR: Request to backend timed out")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("Testing backend connectivity...")
    if test_backend_connectivity():
        print("✅ Backend connectivity test passed!")
    else:
        print("❌ Backend connectivity test failed!")
        sys.exit(1)
