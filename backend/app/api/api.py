from fastapi import APIRouter
from .endpoints import users, services, requests, service_bookings, request_proposals, mod_requests, admins, chat

api_router = APIRouter()

# Include user routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include service routes
api_router.include_router(services.router, prefix="/services", tags=["services"])

# Include request routes
api_router.include_router(requests.router, prefix="/requests", tags=["requests"])

# Include service booking routes
api_router.include_router(service_bookings.router, prefix="/service-bookings", tags=["service-bookings"])

# Include request proposal routes
api_router.include_router(request_proposals.router, prefix="/request-proposals", tags=["request-proposals"])

# Include moderator application routes
api_router.include_router(mod_requests.router, prefix="/mod-requests", tags=["mod-requests"])

# Include admin routes
api_router.include_router(admins.router, prefix="/admin", tags=["admin"])

# Include chat routes
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "TimeNest API is running"}