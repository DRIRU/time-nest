from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from ...db.database import get_db
from ...db.models.report import Report
from ...db.models.user import User
from ...db.models.service import Service
from ...db.models.request import Request
from ...db.models.admin import Admin
from ...schemas.report import ReportCreate, ReportResponse, ReportUpdate, ReportSummary, ReportStats
from .users import get_current_user_dependency, get_current_admin_dependency

router = APIRouter(tags=["reports"])

@router.get("/test")
async def test_reports():
    """Test endpoint to verify reports router is working"""
    return {"message": "Reports router is working!"}

@router.post("/", response_model=ReportResponse)
async def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Create a new report"""
    
    # Validate that either service_id or request_id is provided, but not both
    if not report_data.reported_service_id and not report_data.reported_request_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either reported_service_id or reported_request_id must be provided"
        )
    
    if report_data.reported_service_id and report_data.reported_request_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot report both a service and request in the same report"
        )
    
    # Validate that the reported service/request exists
    reported_user_id = report_data.reported_user_id  # Use the provided user ID as fallback
    
    if report_data.reported_service_id:
        try:
            service_id = int(report_data.reported_service_id)
            service = db.query(Service).filter(Service.service_id == service_id).first()
            if service:
                # If service exists, use its creator as the reported user
                reported_user_id = service.creator_id
            # If service doesn't exist, we'll still allow the report but log it
            else:
                print(f"Warning: Service ID {service_id} not found in database, using provided user ID")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid service ID format: {report_data.reported_service_id}"
            )
        
    if report_data.reported_request_id:
        try:
            request_id = int(report_data.reported_request_id)
            request_obj = db.query(Request).filter(Request.request_id == request_id).first()
            if request_obj:
                # If request exists, use its creator as the reported user
                reported_user_id = request_obj.creator_id
            # If request doesn't exist, we'll still allow the report but log it
            else:
                print(f"Warning: Request ID {request_id} not found in database, using provided user ID")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request ID format: {report_data.reported_request_id}"
            )
    
    # Validate that the reported user exists
    reported_user = db.query(User).filter(User.user_id == reported_user_id).first()
    if not reported_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reported user with ID {reported_user_id} not found"
        )
    
    # Check if user is trying to report themselves
    if current_user.user_id == reported_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report yourself"
        )
    
    # Create the report
    db_report = Report(
        reporter_id=current_user.user_id,
        reported_user_id=reported_user_id,
        reported_service_id=report_data.reported_service_id,
        reported_request_id=report_data.reported_request_id,
        report_type=report_data.report_type,
        category=report_data.category,
        title=report_data.title,
        description=report_data.description
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return await get_report_with_details(db_report.report_id, db)

@router.get("/", response_model=List[ReportResponse])
async def get_reports(
    status_filter: Optional[str] = None,
    report_type: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get reports (admin only or user's own reports)"""
    
    query = db.query(Report)
    
    # For regular users, only show their own reports
    if not is_admin(current_user):
        query = query.filter(
            or_(
                Report.reporter_id == current_user.user_id,
                Report.reported_user_id == current_user.user_id
            )
        )
    
    # Apply filters
    if status_filter:
        query = query.filter(Report.status == status_filter)
    if report_type:
        query = query.filter(Report.report_type == report_type)
    if category:
        query = query.filter(Report.category == category)
    
    # Order by creation date (newest first)
    query = query.order_by(desc(Report.created_at))
    
    # Apply pagination
    reports = query.offset(offset).limit(limit).all()
    
    # Get detailed information for each report
    detailed_reports = []
    for report in reports:
        detailed_report = await get_report_with_details(report.report_id, db)
        detailed_reports.append(detailed_report)
    
    return detailed_reports

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get a specific report"""
    
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check permissions
    if not is_admin(current_user) and report.reporter_id != current_user.user_id and report.reported_user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this report"
        )
    
    return await get_report_with_details(report_id, db)

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    report_update: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Update a report (admin only)"""
    
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update reports"
        )
    
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Update fields
    for field, value in report_update.dict(exclude_unset=True).items():
        setattr(report, field, value)
    
    # Set resolved_at when status changes to resolved or dismissed
    if report_update.status in ['resolved', 'dismissed'] and not report.resolved_at:
        report.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(report)
    
    return await get_report_with_details(report_id, db)

@router.get("/stats/summary", response_model=ReportSummary)
async def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get report summary statistics (admin only)"""
    
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view report statistics"
        )
    
    total_reports = db.query(Report).count()
    pending_reports = db.query(Report).filter(Report.status == 'pending').count()
    under_review_reports = db.query(Report).filter(Report.status == 'under_review').count()
    resolved_reports = db.query(Report).filter(Report.status == 'resolved').count()
    dismissed_reports = db.query(Report).filter(Report.status == 'dismissed').count()
    escalated_reports = db.query(Report).filter(Report.status == 'escalated').count()
    
    return ReportSummary(
        total_reports=total_reports,
        pending_reports=pending_reports,
        under_review_reports=under_review_reports,
        resolved_reports=resolved_reports,
        dismissed_reports=dismissed_reports,
        escalated_reports=escalated_reports
    )

@router.get("/user/{user_id}/stats", response_model=ReportStats)
async def get_user_report_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dependency)
):
    """Get report statistics for a specific user"""
    
    # Users can only view their own stats, admins can view any user's stats
    if not is_admin(current_user) and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own report statistics"
        )
    
    reports_made_count = db.query(Report).filter(Report.reporter_id == user_id).count()
    reports_received_count = db.query(Report).filter(Report.reported_user_id == user_id).count()
    
    # Get recent reports (last 5)
    recent_reports_made = db.query(Report).filter(Report.reporter_id == user_id).order_by(desc(Report.created_at)).limit(5).all()
    recent_reports_received = db.query(Report).filter(Report.reported_user_id == user_id).order_by(desc(Report.created_at)).limit(5).all()
    
    # Convert to detailed responses
    detailed_made = [await get_report_with_details(r.report_id, db) for r in recent_reports_made]
    detailed_received = [await get_report_with_details(r.report_id, db) for r in recent_reports_received]
    
    return ReportStats(
        user_id=user_id,
        reports_made_count=reports_made_count,
        reports_received_count=reports_received_count,
        recent_reports_made=detailed_made,
        recent_reports_received=detailed_received
    )

@router.get("/stats/weekly")
async def get_weekly_reports_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_dependency)
):
    """Get weekly reports statistics for admin dashboard charts"""
    
    # Admin check is now handled by get_current_admin_dependency
    
    from datetime import datetime, timedelta
    
    # If no date range provided, use last 7 days
    if not start_date or not end_date:
        end_date_obj = datetime.now()
        start_date_obj = end_date_obj - timedelta(days=6)  # 7 days total including today
    else:
        try:
            start_date_obj = datetime.fromisoformat(start_date)
            end_date_obj = datetime.fromisoformat(end_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    # Generate the weekly data based on the actual date range
    weekly_data = []
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    # Instead of forcing a single week, let's count reports by day of week within the date range
    day_counts = {day: 0 for day in days}
    
    # Get all reports within the date range
    reports_in_range = db.query(Report).filter(
        Report.created_at >= start_date_obj,
        Report.created_at <= end_date_obj + timedelta(days=1)  # Include end date
    ).all()
    
    # Count reports by day of week
    for report in reports_in_range:
        day_of_week = report.created_at.strftime('%a')  # Get day abbreviation (Mon, Tue, etc.)
        if day_of_week in day_counts:
            day_counts[day_of_week] += 1
    
    # Create the response data
    for day in days:
        weekly_data.append({
            'day': day,
            'reports': day_counts[day]
        })
    
    return {
        'weekly_reports': weekly_data,
        'date_range': {
            'start_date': start_date_obj.strftime('%Y-%m-%d'),
            'end_date': end_date_obj.strftime('%Y-%m-%d')
        }
    }

@router.get("/stats/summary")
async def get_reports_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_dependency)
):
    """Get basic reports statistics (total count, etc.)"""
    
    from datetime import datetime, timedelta
    
    # If no date range provided, get all reports
    if start_date and end_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date)
            end_date_obj = datetime.fromisoformat(end_date)
            
            total_reports = db.query(Report).filter(
                Report.created_at >= start_date_obj,
                Report.created_at <= end_date_obj + timedelta(days=1)
            ).count()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        total_reports = db.query(Report).count()
    
    # Get status breakdown
    pending_reports = db.query(Report).filter(Report.status == 'pending').count()
    under_review_reports = db.query(Report).filter(Report.status == 'under_review').count()
    resolved_reports = db.query(Report).filter(Report.status == 'resolved').count()
    dismissed_reports = db.query(Report).filter(Report.status == 'dismissed').count()
    escalated_reports = db.query(Report).filter(Report.status == 'escalated').count()
    
    return {
        'total_reports': total_reports,
        'pending_reports': pending_reports,
        'under_review_reports': under_review_reports,
        'resolved_reports': resolved_reports,
        'dismissed_reports': dismissed_reports,
        'escalated_reports': escalated_reports,
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        } if start_date and end_date else None
    }

# Helper functions
async def get_report_with_details(report_id: int, db: Session) -> ReportResponse:
    """Get a report with all related details"""
    
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        return None
    
    # Get related data
    reporter = db.query(User).filter(User.user_id == report.reporter_id).first()
    reported_user = db.query(User).filter(User.user_id == report.reported_user_id).first()
    
    service_title = None
    request_title = None
    
    if report.reported_service_id:
        service = db.query(Service).filter(Service.service_id == report.reported_service_id).first()
        service_title = service.title if service else None
    
    if report.reported_request_id:
        request_obj = db.query(Request).filter(Request.request_id == report.reported_request_id).first()
        request_title = request_obj.title if request_obj else None
    
    return ReportResponse(
        report_id=report.report_id,
        reporter_id=report.reporter_id,
        reported_service_id=report.reported_service_id,
        reported_request_id=report.reported_request_id,
        reported_user_id=report.reported_user_id,
        report_type=report.report_type,
        category=report.category,
        title=report.title,
        description=report.description,
        status=report.status,
        assigned_admin_id=report.assigned_admin_id,
        admin_notes=report.admin_notes,
        resolution=report.resolution,
        created_at=report.created_at,
        updated_at=report.updated_at,
        resolved_at=report.resolved_at,
        reporter_name=f"{reporter.first_name} {reporter.last_name}" if reporter else None,
        reported_user_name=f"{reported_user.first_name} {reported_user.last_name}" if reported_user else None,
        service_title=service_title,
        request_title=request_title
    )

def is_admin(user: User) -> bool:
    """Check if user is an admin"""
    # Check if user email is in the admin list
    # You can expand this logic based on your admin system
    admin_emails = ["admin@timenest.com", "admin@example.com"]
    return user.email in admin_emails if user and user.email else False
