from fastapi import APIRouter
from .endpoints import users, services, requests

api_router = APIRouter()

# Include user routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include service routes
api_router.include_router(services.router, prefix="/services", tags=["services"])

# Include request routes
api_router.include_router(requests.router, prefix="/requests", tags=["requests"])

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "TimeNest API is running"}