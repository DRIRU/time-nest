from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import logging

from ...db.database import get_db
from ...db.models.service import Service
from ...schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: ServiceCreate, 
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new service listing
    """
    try:
        # Map availability list to individual boolean fields
        availability_map = {
            "weekday-mornings": "availability_weekday_morning",
            "weekday-afternoons": "availability_weekday_afternoon",
            "weekday-evenings": "availability_weekday_evening",
            "weekend-mornings": "availability_weekend_morning",
            "weekend-afternoons": "availability_weekend_afternoon",
            "weekend-evenings": "availability_weekend_evening",
            "flexible": "availability_flexible"
        }
        
        # Create a dictionary with all availability fields set to False by default
        availability_dict = {field: False for field in availability_map.values()}
        
        # Set the selected availability options to True
        for option in service_data.availability:
            if option in availability_map:
                availability_dict[availability_map[option]] = True
        
        # Convert tags list to comma-separated string if provided
        tags_string = None
        if service_data.tags:
            tags_string = ",".join(service_data.tags)
        
        # Create new service
        new_service = Service(
            creator_id=current_user.user_id,
            title=service_data.title,
            description=service_data.description,
            category=service_data.category,
            time_credits_per_hour=service_data.time_credits_per_hour,
            location=service_data.location,
            whats_included=service_data.whats_included,
            requirements=service_data.requirements,
            tags=tags_string,
            **availability_dict
        )

        db.add(new_service)
        db.commit()
        db.refresh(new_service)
        
        # Convert the service model to response format
        # Map boolean fields back to list for response
        availability_response = []
        for option, field in availability_map.items():
            if getattr(new_service, field):
                availability_response.append(option)
        
        # Convert tags string back to list for response
        tags_response = []
        if new_service.tags:
            tags_response = new_service.tags.split(",")
        
        # Create response data
        response_data = {
            "service_id": new_service.service_id,
            "creator_id": new_service.creator_id,
            "title": new_service.title,
            "description": new_service.description,
            "category": new_service.category,
            "time_credits_per_hour": new_service.time_credits_per_hour,
            "location": new_service.location,
            "availability": availability_response,
            "whats_included": new_service.whats_included,
            "requirements": new_service.requirements,
            "tags": tags_response,
            "created_at": new_service.created_at
        }

        return response_data

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during service creation: {str(e)}"
        )

@router.get("/", response_model=List[ServiceResponse])
def get_services(
    skip: int = 0, 
    limit: int = 100, 
    category: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all services with optional filtering by category
    """
    from ...db.models.user import User
    
    query = db.query(Service)
    
    if category:
        query = query.filter(Service.category == category)
    
    services = query.offset(skip).limit(limit).all()
    
    # Process each service to format the response correctly
    response_services = []
    for service in services:
        # Map boolean fields to list for response
        availability_map = {
            "weekday-mornings": service.availability_weekday_morning,
            "weekday-afternoons": service.availability_weekday_afternoon,
            "weekday-evenings": service.availability_weekday_evening,
            "weekend-mornings": service.availability_weekend_morning,
            "weekend-afternoons": service.availability_weekend_afternoon,
            "weekend-evenings": service.availability_weekend_evening,
            "flexible": service.availability_flexible
        }
        
        # Get creator name
        creator = db.query(User).filter(User.user_id == service.creator_id).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
        
        availability_response = [option for option, value in availability_map.items() if value]
        
        # Convert tags string to list
        tags_response = []
        if service.tags:
            tags_response = service.tags.split(",")
        
        response_services.append({
            "service_id": service.service_id,
            "creator_id": service.creator_id,
            "creator_name": creator_name,
            "title": service.title,
            "description": service.description,
            "category": service.category,
            "time_credits_per_hour": service.time_credits_per_hour,
            "location": service.location,
            "availability": availability_response,
            "whats_included": service.whats_included,
            "requirements": service.requirements,
            "tags": tags_response,
            "created_at": service.created_at
        })
    
    return response_services

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get a specific service by ID
    """
    service = db.query(Service).filter(Service.service_id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Map boolean fields to list for response
    availability_map = {
        "weekday-mornings": service.availability_weekday_morning,
        "weekday-afternoons": service.availability_weekday_afternoon,
        "weekday-evenings": service.availability_weekday_evening,
        "weekend-mornings": service.availability_weekend_morning,
        "weekend-afternoons": service.availability_weekend_afternoon,
        "weekend-evenings": service.availability_weekend_evening,
        "flexible": service.availability_flexible
    }
    
    availability_response = [option for option, value in availability_map.items() if value]
    
    # Convert tags string to list
    tags_response = []
    if service.tags:
        tags_response = service.tags.split(",")
    
    response_data = {
        "service_id": service.service_id,
        "creator_id": service.creator_id,
        "title": service.title,
        "description": service.description,
        "category": service.category,
        "time_credits_per_hour": service.time_credits_per_hour,
        "location": service.location,
        "availability": availability_response,
        "whats_included": service.whats_included,
        "requirements": service.requirements,
        "tags": tags_response,
        "created_at": service.created_at
    }
    
    return response_data

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing service
    """
    # Get the service
    service = db.query(Service).filter(Service.service_id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Check if the current user is the creator of the service
    if service.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this service"
        )
    
    # Update basic fields if provided
    if service_data.title is not None:
        service.title = service_data.title
    if service_data.description is not None:
        service.description = service_data.description
    if service_data.category is not None:
        service.category = service_data.category
    if service_data.time_credits_per_hour is not None:
        service.time_credits_per_hour = service_data.time_credits_per_hour
    if service_data.location is not None:
        service.location = service_data.location
    if service_data.whats_included is not None:
        service.whats_included = service_data.whats_included
    if service_data.requirements is not None:
        service.requirements = service_data.requirements
    
    # Update tags if provided
    if service_data.tags is not None:
        service.tags = ",".join(service_data.tags) if service_data.tags else None
    
    # Update availability if provided
    if service_data.availability is not None:
        # Reset all availability fields
        service.availability_weekday_morning = False
        service.availability_weekday_afternoon = False
        service.availability_weekday_evening = False
        service.availability_weekend_morning = False
        service.availability_weekend_afternoon = False
        service.availability_weekend_evening = False
        service.availability_flexible = False
        
        # Set the selected availability options
        availability_map = {
            "weekday-mornings": "availability_weekday_morning",
            "weekday-afternoons": "availability_weekday_afternoon",
            "weekday-evenings": "availability_weekday_evening",
            "weekend-mornings": "availability_weekend_morning",
            "weekend-afternoons": "availability_weekend_afternoon",
            "weekend-evenings": "availability_weekend_evening",
            "flexible": "availability_flexible"
        }
        
        for option in service_data.availability:
            if option in availability_map:
                setattr(service, availability_map[option], True)
    
    try:
        db.commit()
        db.refresh(service)
        
        # Prepare response
        # Map boolean fields back to list for response
        availability_map = {
            "weekday-mornings": service.availability_weekday_morning,
            "weekday-afternoons": service.availability_weekday_afternoon,
            "weekday-evenings": service.availability_weekday_evening,
            "weekend-mornings": service.availability_weekend_morning,
            "weekend-afternoons": service.availability_weekend_afternoon,
            "weekend-evenings": service.availability_weekend_evening,
            "flexible": service.availability_flexible
        }
        
        availability_response = [option for option, value in availability_map.items() if value]
        
        # Convert tags string to list
        tags_response = []
        if service.tags:
            tags_response = service.tags.split(",")
        
        response_data = {
            "service_id": service.service_id,
            "creator_id": service.creator_id,
            "title": service.title,
            "description": service.description,
            "category": service.category,
            "time_credits_per_hour": service.time_credits_per_hour,
            "location": service.location,
            "availability": availability_response,
            "whats_included": service.whats_included,
            "requirements": service.requirements,
            "tags": tags_response,
            "created_at": service.created_at
        }
        
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during service update: {str(e)}"
        )

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a service
    """
    service = db.query(Service).filter(Service.service_id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Check if the current user is the creator of the service
    if service.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this service"
        )
    
    try:
        db.delete(service)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting service: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during service deletion: {str(e)}"
        )