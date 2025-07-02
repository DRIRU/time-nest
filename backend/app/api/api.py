from fastapi import APIRouter
from .endpoints import users, services

api_router = APIRouter()

# Include user routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include service routes
api_router.include_router(services.router, prefix="/services", tags=["services"])

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "TimeNest API is running"}