from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import List
import logging

from ...db.database import get_db
from ...db.models.requestProposal import RequestProposal, ProposalStatusEnum
from ...db.models.request import Request
from ...db.models.user import User
from ...schemas.requestProposal import ProposalCreate, ProposalResponse, ProposalUpdate
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(
    proposal_data: ProposalCreate, 
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new proposal for a service request
    """
    try:
        # Check if the request exists
        request = db.query(Request).filter(Request.request_id == proposal_data.request_id).first()
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )
        
        # Check if user is trying to submit a proposal to their own request
        if request.creator_id == current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot submit a proposal to your own request"
            )
        
        # Check if user has already submitted a proposal for this request
        existing_proposal = db.query(RequestProposal).filter(
            RequestProposal.request_id == proposal_data.request_id,
            RequestProposal.proposer_id == current_user.user_id
        ).first()
        
        if existing_proposal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a proposal for this request"
            )
        
        # Create new proposal
        new_proposal = RequestProposal(
            request_id=proposal_data.request_id,
            proposer_id=current_user.user_id,
            proposal_text=proposal_data.proposal_text,
            proposed_credits=proposal_data.proposed_credits,
            status=ProposalStatusEnum.pending
        )

        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)

        # Get proposer name for the response
        proposer = db.query(User).filter(User.user_id == current_user.user_id).first()
        proposer_name = f"{proposer.first_name} {proposer.last_name}" if proposer else "Unknown"
        
        # Create response data
        response_data = {
            "proposal_id": new_proposal.proposal_id,
            "request_id": new_proposal.request_id,
            "proposer_id": new_proposal.proposer_id,
            "proposal_text": new_proposal.proposal_text,
            "proposed_credits": new_proposal.proposed_credits,
            "status": new_proposal.status,
            "submitted_at": new_proposal.submitted_at,
            "response_at": new_proposal.response_at,
            "proposer_name": proposer_name
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
        logger.error(f"Error creating proposal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during proposal creation: {str(e)}"
        )

@router.get("/", response_model=List[ProposalResponse])
def get_proposals(
    request_id: int = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get proposals - either all proposals for the current user's requests,
    or all proposals submitted by the current user
    """
    try:
        query = db.query(RequestProposal)
        
        if request_id:
            # Get proposals for a specific request
            request = db.query(Request).filter(Request.request_id == request_id).first()
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Service request not found"
                )
            
            # Check if user is authorized to view proposals for this request
            if request.creator_id != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to view proposals for this request"
                )
            
            query = query.filter(RequestProposal.request_id == request_id)
        else:
            # Get all proposals where the user is either the request creator or the proposer
            user_requests = db.query(Request).filter(Request.creator_id == current_user.user_id).all()
            request_ids = [request.request_id for request in user_requests]
            
            query = query.filter(
                (RequestProposal.request_id.in_(request_ids)) | 
                (RequestProposal.proposer_id == current_user.user_id)
            )
        
        proposals = query.offset(skip).limit(limit).all()
        
        # Process each proposal to format the response correctly
        response_proposals = []
        for proposal in proposals:
            # Get proposer details
            proposer = db.query(User).filter(User.user_id == proposal.proposer_id).first()
            proposer_name = f"{proposer.first_name} {proposer.last_name}" if proposer else "Unknown"
            
            response_proposals.append({
                "proposal_id": proposal.proposal_id,
                "request_id": proposal.request_id,
                "proposer_id": proposal.proposer_id,
                "proposal_text": proposal.proposal_text,
                "proposed_credits": proposal.proposed_credits,
                "status": proposal.status,
                "submitted_at": proposal.submitted_at,
                "response_at": proposal.response_at,
                "proposer_name": proposer_name
            })
        
        return response_proposals
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching proposals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching proposals: {str(e)}"
        )

@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(
    proposal_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_dependency)
):
    """
    Get a specific proposal by ID
    """
    proposal = db.query(RequestProposal).filter(RequestProposal.proposal_id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Check if the current user is authorized to view this proposal
    request = db.query(Request).filter(Request.request_id == proposal.request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated request not found"
        )
    
    if proposal.proposer_id != current_user.user_id and request.creator_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this proposal"
        )
    
    # Get proposer name
    proposer = db.query(User).filter(User.user_id == proposal.proposer_id).first()
    proposer_name = f"{proposer.first_name} {proposer.last_name}" if proposer else "Unknown"
    
    response_data = {
        "proposal_id": proposal.proposal_id,
        "request_id": proposal.request_id,
        "proposer_id": proposal.proposer_id,
        "proposal_text": proposal.proposal_text,
        "proposed_credits": proposal.proposed_credits,
        "status": proposal.status,
        "submitted_at": proposal.submitted_at,
        "response_at": proposal.response_at,
        "proposer_name": proposer_name
    }
    
    return response_data

@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(
    proposal_id: int,
    proposal_data: ProposalUpdate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Update an existing proposal
    """
    proposal = db.query(RequestProposal).filter(RequestProposal.proposal_id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Get the associated request
    request = db.query(Request).filter(Request.request_id == proposal.request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated request not found"
        )
    
    # Check permissions based on the update type
    if proposal_data.status is not None:
        # Status updates can only be done by the request creator (accept/reject)
        # or by the proposer (withdraw)
        if request.creator_id != current_user.user_id and (
            proposal_data.status != "withdrawn" or proposal.proposer_id != current_user.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this proposal's status"
            )
    else:
        # Content updates can only be done by the proposer
        if proposal.proposer_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this proposal"
            )
    
    # Update fields if provided
    if proposal_data.proposal_text is not None:
        proposal.proposal_text = proposal_data.proposal_text
    if proposal_data.proposed_credits is not None:
        proposal.proposed_credits = proposal_data.proposed_credits
    if proposal_data.status is not None:
        try:
            proposal.status = ProposalStatusEnum(proposal_data.status)
            proposal.response_at = datetime.utcnow()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {proposal_data.status}. Must be one of: {', '.join([e.value for e in ProposalStatusEnum])}"
            )
    
    try:
        db.commit()
        db.refresh(proposal)
        
        # Get proposer name
        proposer = db.query(User).filter(User.user_id == proposal.proposer_id).first()
        proposer_name = f"{proposer.first_name} {proposer.last_name}" if proposer else "Unknown"
        
        response_data = {
            "proposal_id": proposal.proposal_id,
            "request_id": proposal.request_id,
            "proposer_id": proposal.proposer_id,
            "proposal_text": proposal.proposal_text,
            "proposed_credits": proposal.proposed_credits,
            "status": proposal.status,
            "submitted_at": proposal.submitted_at,
            "response_at": proposal.response_at,
            "proposer_name": proposer_name
        }
        
        return response_data
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating proposal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during proposal update: {str(e)}"
        )

@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proposal(
    proposal_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Delete a proposal (only allowed for the proposer)
    """
    proposal = db.query(RequestProposal).filter(RequestProposal.proposal_id == proposal_id).first()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Check if the current user is the proposer
    if proposal.proposer_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this proposal"
        )
    
    try:
        db.delete(proposal)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting proposal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during proposal deletion: {str(e)}"
        )