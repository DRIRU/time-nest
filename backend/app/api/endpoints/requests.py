from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import logging

from ...db.database import get_db
from ...db.models.request import Request
from ...db.models.user import User
from ...schemas.request import RequestCreate, RequestResponse, RequestUpdate
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    request_data: RequestCreate, 
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new service request
    """
    try:
        # Convert tags list to comma-separated string if provided
        tags_string = None
        if request_data.tags:
            tags_string = ",".join(request_data.tags)
        
        # Convert skills list to comma-separated string if provided
        skills_string = None
        if request_data.skills:
            skills_string = ",".join(request_data.skills)
        
        # Create new request
        new_request = Request(
            creator_id=current_user.user_id,
            title=request_data.title,
            description=request_data.description,
            category=request_data.category,
            budget=request_data.budget,
            location=request_data.location,
            deadline=request_data.deadline,
            urgency=request_data.urgency,
            whats_included=request_data.whats_included,
            requirements=request_data.requirements,
            tags=tags_string,
            skills=skills_string
        )

        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        # Get creator name for the response
        creator = db.query(User).filter(User.user_id == current_user.user_id).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
        
        # Create response data
        response_data = {
            "request_id": new_request.request_id,
            "creator_id": new_request.creator_id,
            "creator_name": creator_name,
            "title": new_request.title,
            "description": new_request.description,
            "category": new_request.category,
            "budget": new_request.budget,
            "location": new_request.location,
            "deadline": new_request.deadline,
            "urgency": new_request.urgency,
            "whats_included": new_request.whats_included,
            "requirements": new_request.requirements,
            "tags": new_request.get_tags_list(),
            "skills": new_request.get_skills_list(),
            "created_at": new_request.created_at
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
        logger.error(f"Error creating request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during request creation: {str(e)}"
        )

@router.get("/", response_model=List[RequestResponse])
def get_requests(
    skip: int = 0, 
    limit: int = 100, 
    category: str = None,
    urgency: str = None,
    exclude_creator_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Get all service requests with optional filtering
    Can also exclude requests by a specific creator_id
    """
    from ...db.models.user import User
    
    query = db.query(Request)
    
    if category:
        query = query.filter(Request.category == category)
    
    if urgency:
        query = query.filter(Request.urgency == urgency)
    
    # Exclude requests by specific creator_id if provided
    if exclude_creator_id:
        query = query.filter(Request.creator_id != exclude_creator_id)
    
    requests = query.offset(skip).limit(limit).all()
    
    # Process each request to format the response correctly
    response_requests = []
    for request in requests:
        # Get creator name
        creator = db.query(User).filter(User.user_id == request.creator_id).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
        
        response_requests.append({
            "request_id": request.request_id,
            "creator_id": request.creator_id,
            "creator_name": creator_name,
            "title": request.title,
            "description": request.description,
            "category": request.category,
            "budget": request.budget,
            "location": request.location,
            "deadline": request.deadline,
            "urgency": request.urgency,
            "whats_included": request.whats_included,
            "requirements": request.requirements,
            "tags": request.get_tags_list(),
            "skills": request.get_skills_list(),
            "created_at": request.created_at
        })
    
    return response_requests

@router.get("/{request_id}", response_model=RequestResponse)
def get_request(
    request_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get a specific request by ID
    """
    from ...db.models.user import User
    
    request = db.query(Request).filter(Request.request_id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Get creator name
    creator = db.query(User).filter(User.user_id == request.creator_id).first()
    creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
    
    response_data = {
        "request_id": request.request_id,
        "creator_id": request.creator_id,
        "creator_name": creator_name,
        "title": request.title,
        "description": request.description,
        "category": request.category,
        "budget": request.budget,
        "location": request.location,
        "deadline": request.deadline,
        "urgency": request.urgency,
        "whats_included": request.whats_included,
        "requirements": request.requirements,
        "tags": request.get_tags_list(),
        "skills": request.get_skills_list(),
        "created_at": request.created_at
    }
    
    return response_data

@router.put("/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: int,
    request_data: RequestUpdate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing request
    """
    # Get the request
    request = db.query(Request).filter(Request.request_id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check if the current user is the creator of the request
    if request.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this request"
        )
    
    # Update basic fields if provided
    if request_data.title is not None:
        request.title = request_data.title
    if request_data.description is not None:
        request.description = request_data.description
    if request_data.category is not None:
        request.category = request_data.category
    if request_data.budget is not None:
        request.budget = request_data.budget
    if request_data.location is not None:
        request.location = request_data.location
    if request_data.deadline is not None:
        request.deadline = request_data.deadline
    if request_data.urgency is not None:
        request.urgency = request_data.urgency
    if request_data.whats_included is not None:
        request.whats_included = request_data.whats_included
    if request_data.requirements is not None:
        request.requirements = request_data.requirements
    
    # Update tags if provided
    if request_data.tags is not None:
        request.tags = ",".join(request_data.tags) if request_data.tags else None
    
    # Update skills if provided
    if request_data.skills is not None:
        request.skills = ",".join(request_data.skills) if request_data.skills else None
    
    try:
        db.commit()
        db.refresh(request)
        
        # Get creator name
        creator = db.query(User).filter(User.user_id == request.creator_id).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unknown"
        
        # Prepare response
        response_data = {
            "request_id": request.request_id,
            "creator_id": request.creator_id,
            "creator_name": creator_name,
            "title": request.title,
            "description": request.description,
            "category": request.category,
            "budget": request.budget,
            "location": request.location,
            "deadline": request.deadline,
            "urgency": request.urgency,
            "whats_included": request.whats_included,
            "requirements": request.requirements,
            "tags": request.get_tags_list(),
            "skills": request.get_skills_list(),
            "created_at": request.created_at
        }
        
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during request update: {str(e)}"
        )

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(
    request_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a request
    """
    request = db.query(Request).filter(Request.request_id == request_id).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Check if the current user is the creator of the request
    if request.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this request"
        )
    
    try:
        db.delete(request)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during request deletion: {str(e)}"
        )