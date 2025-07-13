from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import logging
from datetime import datetime

from ...db.database import get_db
from ...db.models.serviceBooking import ServiceBooking, BookingStatusEnum
from ...db.models.service import Service
from ...db.models.user import User
from ...schemas.serviceBooking import BookingCreate, BookingResponse, BookingUpdate
from ...core.credit_manager import CreditManager, InsufficientCreditsError
from ...db.models.timeTransaction import ReferenceTypeEnum
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate, 
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new service booking
    """
    try:
        # Check if the service exists
        service = db.query(Service).filter(Service.service_id == booking_data.service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Create new booking
        new_booking = ServiceBooking(
            service_id=booking_data.service_id,
            user_id=current_user.user_id,
            scheduled_datetime=booking_data.scheduled_datetime,
            duration_minutes=booking_data.duration_minutes,
            message=booking_data.message,
            time_credits_used=booking_data.time_credits_used,
            status=BookingStatusEnum.pending
        )

        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)

        # Get booker name (person making the booking)
        booker = db.query(User).filter(User.user_id == current_user.user_id).first()
        booker_name = f"{booker.first_name} {booker.last_name}" if booker else "Unknown"
        
        # Get service provider name (person who created the service)
        service_provider = db.query(User).filter(User.user_id == service.creator_id).first()
        service_provider_name = f"{service_provider.first_name} {service_provider.last_name}" if service_provider else "Unknown"
        
        # Get service title for the response
        service_title = service.title if service else "Unknown Service"
        
        # Create response data
        response_data = {
            "booking_id": new_booking.booking_id,
            "service_id": new_booking.service_id,
            "user_id": new_booking.user_id,
            "scheduled_datetime": new_booking.scheduled_datetime,
            "duration_minutes": new_booking.duration_minutes,
            "message": new_booking.message,
            "time_credits_used": new_booking.time_credits_used,
            "status": new_booking.status,
            "booking_date": new_booking.booking_date,
            "booker_name": booker_name,
            "service_provider_name": service_provider_name,
            "service_title": service_title,
            "creator_id": service.creator_id  # Keep this for backward compatibility
        }

        return response_data

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during booking creation: {str(e)}"
        )

@router.get("/", response_model=List[BookingResponse])
def get_bookings(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get all bookings for the current user
    """
    try:
        # Get bookings where the user is either the service creator or the booking user
        user_services = db.query(Service).filter(Service.creator_id == current_user.user_id).all()
        service_ids = [service.service_id for service in user_services]
        
        # Query for bookings where user is either the service provider or the customer
        bookings = db.query(ServiceBooking).filter(
            (ServiceBooking.user_id == current_user.user_id) | 
            (ServiceBooking.service_id.in_(service_ids))
        ).offset(skip).limit(limit).all()
        
        # Process each booking to format the response correctly
        response_bookings = []
        for booking in bookings:
            # Get service details
            service = db.query(Service).filter(Service.service_id == booking.service_id).first()
            service_title = service.title if service else "Unknown Service"
            creator_id = service.creator_id if service else None
            
            # Get booker details (person who made the booking)
            booker = db.query(User).filter(User.user_id == booking.user_id).first()
            booker_name = f"{booker.first_name} {booker.last_name}" if booker else "Unknown"
            
            # Get service provider details (person who created the service)
            if service and service.creator_id:
                service_provider = db.query(User).filter(User.user_id == service.creator_id).first()
                service_provider_name = f"{service_provider.first_name} {service_provider.last_name}" if service_provider else "Unknown"
            else:
                service_provider_name = "Unknown"
            
            response_bookings.append({
                "booking_id": booking.booking_id,
                "service_id": booking.service_id,
                "user_id": booking.user_id,
                "creator_id": creator_id,  # Keep for backward compatibility
                "scheduled_datetime": booking.scheduled_datetime,
                "duration_minutes": booking.duration_minutes,
                "message": booking.message,
                "time_credits_used": booking.time_credits_used,
                "status": booking.status,
                "booking_date": booking.booking_date,
                "booker_name": booker_name,
                "service_provider_name": service_provider_name,
                "service_title": service_title
            })
        
        return response_bookings
        
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching bookings: {str(e)}"
        )

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get a specific booking by ID
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if the current user is authorized to view this booking
    service = db.query(Service).filter(Service.service_id == booking.service_id).first()
    if booking.user_id != current_user.user_id and service.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this booking"
        )
    
    # Get service title
    service_title = service.title if service else "Unknown Service"
    
    # Get booker details (person who made the booking)
    booker = db.query(User).filter(User.user_id == booking.user_id).first()
    booker_name = f"{booker.first_name} {booker.last_name}" if booker else "Unknown"
    
    # Get service provider details (person who created the service)
    if service and service.creator_id:
        service_provider = db.query(User).filter(User.user_id == service.creator_id).first()
        service_provider_name = f"{service_provider.first_name} {service_provider.last_name}" if service_provider else "Unknown"
    else:
        service_provider_name = "Unknown"
    
    response_data = {
        "booking_id": booking.booking_id,
        "service_id": booking.service_id,
        "user_id": booking.user_id,
        "creator_id": service.creator_id,  # Keep for backward compatibility
        "scheduled_datetime": booking.scheduled_datetime,
        "duration_minutes": booking.duration_minutes,
        "message": booking.message,
        "time_credits_used": booking.time_credits_used,
        "status": booking.status,
        "booking_date": booking.booking_date,
        "booker_name": booker_name,
        "service_provider_name": service_provider_name,
        "service_title": service_title
    }
    
    return response_data

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: BookingUpdate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing booking
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if the current user is authorized to update this booking
    service = db.query(Service).filter(Service.service_id == booking.service_id).first()
    if booking.user_id != current_user.user_id and service.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this booking"
        )
    
    # Update fields if provided
    if booking_data.scheduled_datetime is not None:
        booking.scheduled_datetime = booking_data.scheduled_datetime
    if booking_data.duration_minutes is not None:
        booking.duration_minutes = booking_data.duration_minutes
    if booking_data.message is not None:
        booking.message = booking_data.message
    
    # Handle status changes with credit transfers
    old_status = booking.status
    if booking_data.status is not None:
        # Validate status
        try:
            new_status = BookingStatusEnum(booking_data.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {booking_data.status}. Must be one of: {', '.join([e.value for e in BookingStatusEnum])}"
            )
        
        # Handle credit transfer when booking is completed
        if new_status == BookingStatusEnum.completed and old_status != BookingStatusEnum.completed:
            try:
                credit_manager = CreditManager(db)
                
                # Transfer credits from customer to service provider
                credit_manager.transfer_credits(
                    from_user_id=booking.user_id,  # Customer pays
                    to_user_id=service.creator_id,  # Service provider receives
                    amount=booking.time_credits_used,
                    reference_type=ReferenceTypeEnum.service_booking,
                    reference_id=booking.booking_id,
                    description=f"Service completed: {service.title}"
                )
                
                logger.info(f"Credit transfer completed for booking {booking_id}: {booking.time_credits_used} credits from user {booking.user_id} to user {service.creator_id}")
                
            except InsufficientCreditsError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer has insufficient credits to complete this booking"
                )
            except Exception as e:
                logger.error(f"Error processing credit transfer for booking {booking_id}: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error processing payment for completed service"
                )
        
        # Handle refund when booking is cancelled
        elif new_status in [BookingStatusEnum.cancelled, BookingStatusEnum.rejected] and old_status == BookingStatusEnum.confirmed:
            try:
                credit_manager = CreditManager(db)
                
                # Refund credits if booking was previously paid
                credit_manager.refund_credits(
                    original_reference_id=booking.booking_id,
                    reference_type=ReferenceTypeEnum.service_booking,
                    reason=f"Booking {new_status.value}"
                )
                
                logger.info(f"Refund processed for booking {booking_id}: {booking.time_credits_used} credits refunded")
                
            except Exception as e:
                logger.error(f"Error processing refund for booking {booking_id}: {str(e)}")
                # Don't fail the status update if refund fails - log and continue
        
        booking.status = new_status
    
    try:
        db.commit()
        db.refresh(booking)
        
        # Get service title
        service_title = service.title if service else "Unknown Service"
        
        # Get booker details (person who made the booking)
        booker = db.query(User).filter(User.user_id == booking.user_id).first()
        booker_name = f"{booker.first_name} {booker.last_name}" if booker else "Unknown"
        
        # Get service provider details (person who created the service)
        if service and service.creator_id:
            service_provider = db.query(User).filter(User.user_id == service.creator_id).first()
            service_provider_name = f"{service_provider.first_name} {service_provider.last_name}" if service_provider else "Unknown"
        else:
            service_provider_name = "Unknown"
        
        response_data = {
            "booking_id": booking.booking_id,
            "service_id": booking.service_id,
            "user_id": booking.user_id,
            "creator_id": service.creator_id,  # Keep for backward compatibility
            "scheduled_datetime": booking.scheduled_datetime,
            "duration_minutes": booking.duration_minutes,
            "message": booking.message,
            "time_credits_used": booking.time_credits_used,
            "status": booking.status,
            "booking_date": booking.booking_date,
            "booker_name": booker_name,
            "service_provider_name": service_provider_name,
            "service_title": service_title
        }
        
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating booking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during booking update: {str(e)}"
        )

@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a booking
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check if the current user is authorized to delete this booking
    if booking.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this booking"
        )
    
    try:
        db.delete(booking)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting booking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during booking deletion: {str(e)}"
        )