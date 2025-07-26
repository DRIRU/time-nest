#!/usr/bin/env python3
"""
Development server script with auto-reload enabled
"""
import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run(
        "main:socket_app",  # Path to your app
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True,  # Enable auto-reload
        log_level="info",
        reload_dirs=["./app"],  # Only watch the app directory for changes
        reload_excludes=["*.pyc", "__pycache__"]  # Exclude unnecessary files
    )
