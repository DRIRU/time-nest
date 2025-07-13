from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Optional
import logging

from ...db.database import get_db
from ...db.models.rating import Rating
from ...db.models.user import User
from ...db.models.service import Service
from ...db.models.serviceBooking import ServiceBooking
from ...schemas.rating import (
    RatingCreate, RatingUpdate, RatingResponse, 
    RatingListResponse, ServiceRatingStats, ProviderRatingStats
)
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=RatingResponse)
def create_rating(
    rating_data: RatingCreate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new rating for a completed service booking
    """
    try:
        logger.info(f"Received rating data: {rating_data.dict()}")
        logger.info(f"Current user: {current_user.user_id}")
        logger.info(f"Creating rating for booking_id: {rating_data.booking_id}, user_id: {current_user.user_id}")
        
        # First, let's check if the booking exists at all
        booking_exists = db.query(ServiceBooking).filter(
            ServiceBooking.booking_id == rating_data.booking_id
        ).first()
        
        if not booking_exists:
            logger.error(f"Booking {rating_data.booking_id} does not exist")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        logger.info(f"Booking found: id={booking_exists.booking_id}, user_id={booking_exists.user_id}, status={booking_exists.status}")
        
        # Check if it belongs to the current user
        if booking_exists.user_id != current_user.user_id:
            logger.error(f"Booking {rating_data.booking_id} belongs to user {booking_exists.user_id}, not {current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This booking does not belong to you"
            )
        
        # Check if it's completed
        if booking_exists.status.value != "completed":
            logger.error(f"Booking {rating_data.booking_id} status is {booking_exists.status.value}, not completed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Booking status is {booking_exists.status.value}, must be completed to rate"
            )
        
        # Use the booking we already fetched
        booking = booking_exists
        
        # Verify the service and provider match the booking
        if booking.service_id != rating_data.service_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service ID doesn't match the booking"
            )
        
        service = db.query(Service).filter(Service.service_id == rating_data.service_id).first()
        if not service or service.creator_id != rating_data.provider_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid service or provider"
            )
        
        # Check if rating already exists for this booking
        existing_rating = db.query(Rating).filter(Rating.booking_id == rating_data.booking_id).first()
        if existing_rating:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating already exists for this booking"
            )
        
        # Create the rating
        new_rating = Rating(
            booking_id=rating_data.booking_id,
            service_id=rating_data.service_id,
            rater_id=current_user.user_id,
            provider_id=rating_data.provider_id,
            rating=rating_data.rating,
            review=rating_data.review
        )
        
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        
        # Get additional info for response
        rater = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        response = RatingResponse(
            rating_id=new_rating.rating_id,
            booking_id=new_rating.booking_id,
            service_id=new_rating.service_id,
            rater_id=new_rating.rater_id,
            provider_id=new_rating.provider_id,
            rating=new_rating.rating,
            review=new_rating.review,
            created_at=new_rating.created_at,
            updated_at=new_rating.updated_at,
            rater_name=f"{rater.first_name} {rater.last_name}" if rater else None,
            service_title=service.title if service else None
        )
        
        logger.info(f"Rating created: {new_rating.rating_id} for booking {new_rating.booking_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating rating: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating rating: {str(e)}"
        )

@router.get("/service/{service_id}", response_model=RatingListResponse)
def get_service_ratings(
    service_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all ratings for a specific service
    """
    try:
        # Verify service exists
        service = db.query(Service).filter(Service.service_id == service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Get ratings with user info
        ratings_query = db.query(Rating, User).join(
            User, Rating.rater_id == User.user_id
        ).filter(Rating.service_id == service_id).order_by(desc(Rating.created_at))
        
        total_count = ratings_query.count()
        ratings_data = ratings_query.offset(skip).limit(limit).all()
        
        # Calculate average rating
        avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.service_id == service_id).scalar()
        
        # Build response
        ratings = []
        for rating, user in ratings_data:
            ratings.append(RatingResponse(
                rating_id=rating.rating_id,
                booking_id=rating.booking_id,
                service_id=rating.service_id,
                rater_id=rating.rater_id,
                provider_id=rating.provider_id,
                rating=rating.rating,
                review=rating.review,
                created_at=rating.created_at,
                updated_at=rating.updated_at,
                rater_name=f"{user.first_name} {user.last_name}",
                service_title=service.title
            ))
        
        return RatingListResponse(
            ratings=ratings,
            total_count=total_count,
            average_rating=float(avg_rating) if avg_rating else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting service ratings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving service ratings: {str(e)}"
        )

@router.get("/provider/{provider_id}", response_model=RatingListResponse)
def get_provider_ratings(
    provider_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all ratings for a specific service provider
    """
    try:
        # Verify provider exists
        provider = db.query(User).filter(User.user_id == provider_id).first()
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider not found"
            )
        
        # Get ratings with user and service info
        ratings_query = db.query(Rating, User, Service).join(
            User, Rating.rater_id == User.user_id
        ).join(
            Service, Rating.service_id == Service.service_id
        ).filter(Rating.provider_id == provider_id).order_by(desc(Rating.created_at))
        
        total_count = ratings_query.count()
        ratings_data = ratings_query.offset(skip).limit(limit).all()
        
        # Calculate average rating
        avg_rating = db.query(func.avg(Rating.rating)).filter(Rating.provider_id == provider_id).scalar()
        
        # Build response
        ratings = []
        for rating, user, service in ratings_data:
            ratings.append(RatingResponse(
                rating_id=rating.rating_id,
                booking_id=rating.booking_id,
                service_id=rating.service_id,
                rater_id=rating.rater_id,
                provider_id=rating.provider_id,
                rating=rating.rating,
                review=rating.review,
                created_at=rating.created_at,
                updated_at=rating.updated_at,
                rater_name=f"{user.first_name} {user.last_name}",
                service_title=service.title
            ))
        
        return RatingListResponse(
            ratings=ratings,
            total_count=total_count,
            average_rating=float(avg_rating) if avg_rating else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting provider ratings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving provider ratings: {str(e)}"
        )

@router.get("/service/{service_id}/stats", response_model=ServiceRatingStats)
def get_service_rating_stats(
    service_id: int,
    db: Session = Depends(get_db)
):
    """
    Get rating statistics for a specific service
    """
    try:
        # Verify service exists
        service = db.query(Service).filter(Service.service_id == service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Get rating statistics
        stats = db.query(
            func.count(Rating.rating_id).label('total_ratings'),
            func.avg(Rating.rating).label('average_rating'),
            func.sum(func.case([(Rating.rating == 5, 1)], else_=0)).label('five_star_count'),
            func.sum(func.case([(Rating.rating == 4, 1)], else_=0)).label('four_star_count'),
            func.sum(func.case([(Rating.rating == 3, 1)], else_=0)).label('three_star_count'),
            func.sum(func.case([(Rating.rating == 2, 1)], else_=0)).label('two_star_count'),
            func.sum(func.case([(Rating.rating == 1, 1)], else_=0)).label('one_star_count')
        ).filter(Rating.service_id == service_id).first()
        
        return ServiceRatingStats(
            service_id=service_id,
            service_title=service.title,
            total_ratings=stats.total_ratings or 0,
            average_rating=float(stats.average_rating) if stats.average_rating else 0.0,
            five_star_count=stats.five_star_count or 0,
            four_star_count=stats.four_star_count or 0,
            three_star_count=stats.three_star_count or 0,
            two_star_count=stats.two_star_count or 0,
            one_star_count=stats.one_star_count or 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting service rating stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving service rating statistics: {str(e)}"
        )

@router.put("/{rating_id}", response_model=RatingResponse)
def update_rating(
    rating_id: int,
    rating_update: RatingUpdate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing rating (only by the rater)
    """
    try:
        # Get the rating
        rating = db.query(Rating).filter(
            and_(
                Rating.rating_id == rating_id,
                Rating.rater_id == current_user.user_id
            )
        ).first()
        
        if not rating:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rating not found or not yours"
            )
        
        # Update fields
        if rating_update.rating is not None:
            rating.rating = rating_update.rating
        if rating_update.review is not None:
            rating.review = rating_update.review
        
        db.commit()
        db.refresh(rating)
        
        # Get additional info for response
        rater = db.query(User).filter(User.user_id == current_user.user_id).first()
        service = db.query(Service).filter(Service.service_id == rating.service_id).first()
        
        response = RatingResponse(
            rating_id=rating.rating_id,
            booking_id=rating.booking_id,
            service_id=rating.service_id,
            rater_id=rating.rater_id,
            provider_id=rating.provider_id,
            rating=rating.rating,
            review=rating.review,
            created_at=rating.created_at,
            updated_at=rating.updated_at,
            rater_name=f"{rater.first_name} {rater.last_name}" if rater else None,
            service_title=service.title if service else None
        )
        
        logger.info(f"Rating updated: {rating.rating_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating rating: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating rating: {str(e)}"
        )

@router.delete("/{rating_id}")
def delete_rating(
    rating_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a rating (only by the rater)
    """
    try:
        # Get the rating
        rating = db.query(Rating).filter(
            and_(
                Rating.rating_id == rating_id,
                Rating.rater_id == current_user.user_id
            )
        ).first()
        
        if not rating:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Rating not found or not yours"
            )
        
        db.delete(rating)
        db.commit()
        
        logger.info(f"Rating deleted: {rating_id}")
        return {"message": "Rating deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting rating: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting rating: {str(e)}"
        )
