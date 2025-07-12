from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
import logging

from ...db.database import get_db
from ...db.models.conversation import Conversation
from ...db.models.message import Message
from ...db.models.user import User
from ...db.models.service import Service
from ...db.models.request import Request
from ...schemas.chat import (
    ConversationCreate, ConversationResponse, MessageCreate, 
    MessageResponse, MessageUpdate, ChatListResponse, ChatListItem
)
from .users import get_current_user_dependency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/conversations", response_model=ChatListResponse)
def get_user_conversations(
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """
    Get all conversations for the current user
    """
    try:
        # Get conversations where the user is a participant
        conversations_query = db.query(Conversation).filter(
            and_(
                or_(
                    Conversation.user1_id == current_user.user_id,
                    Conversation.user2_id == current_user.user_id
                ),
                Conversation.is_active == True
            )
        ).order_by(desc(Conversation.updated_at))
        
        total_count = conversations_query.count()
        conversations = conversations_query.offset(skip).limit(limit).all()
        
        # Build response with additional user and message info
        chat_list = []
        total_unread = 0
        
        for conv in conversations:
            # Get the other user's info
            other_user_id = conv.get_other_user_id(current_user.user_id)
            other_user = db.query(User).filter(User.user_id == other_user_id).first()
            
            if not other_user:
                continue
                
            # Get the last message
            last_message = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(desc(Message.created_at)).first()
            
            # Get unread count for this conversation
            unread_count = db.query(Message).filter(
                and_(
                    Message.conversation_id == conv.id,
                    Message.sender_id != current_user.user_id,
                    Message.status != 'read'
                )
            ).count()
            
            total_unread += unread_count
            
            chat_item = ChatListItem(
                conversation_id=conv.id,
                other_user_id=other_user.user_id,
                other_user_name=f"{other_user.first_name} {other_user.last_name}",
                other_user_avatar=f"/placeholder.svg?height=40&width=40&text={other_user.first_name[0]}{other_user.last_name[0]}",
                last_message_content=last_message.content if last_message else "No messages yet",
                last_message_at=last_message.created_at if last_message else conv.created_at,
                unread_count=unread_count,
                conversation_type=conv.conversation_type,
                context_title=conv.context_title
            )
            chat_list.append(chat_item)
        
        return ChatListResponse(
            conversations=chat_list,
            total_count=total_count,
            unread_total=total_unread
        )
        
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversations: {str(e)}"
        )

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conversation_data: ConversationCreate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Create a new conversation or return existing one
    """
    try:
        # Check if conversation already exists between these users
        existing_conv = db.query(Conversation).filter(
            and_(
                or_(
                    and_(
                        Conversation.user1_id == current_user.user_id,
                        Conversation.user2_id == conversation_data.user2_id
                    ),
                    and_(
                        Conversation.user1_id == conversation_data.user2_id,
                        Conversation.user2_id == current_user.user_id
                    )
                ),
                Conversation.conversation_type == conversation_data.conversation_type,
                Conversation.context_id == conversation_data.context_id
            )
        ).first()
        
        if existing_conv:
            # Reactivate if it was deactivated
            if not existing_conv.is_active:
                existing_conv.is_active = True
                db.commit()
            
            # Get other user info
            other_user_id = existing_conv.get_other_user_id(current_user.user_id)
            other_user = db.query(User).filter(User.user_id == other_user_id).first()
            
            response_data = ConversationResponse(
                conversation_id=existing_conv.id,
                user1_id=existing_conv.user1_id,
                user2_id=existing_conv.user2_id,
                conversation_type=existing_conv.conversation_type,
                context_id=existing_conv.context_id,
                context_title=existing_conv.context_title,
                created_at=existing_conv.created_at,
                updated_at=existing_conv.updated_at or existing_conv.created_at,
                is_active=existing_conv.is_active,
                last_message_at=existing_conv.last_message_at,
                other_user_id=other_user.user_id if other_user else None,
                other_user_name=f"{other_user.first_name} {other_user.last_name}" if other_user else None,
                other_user_avatar=f"/placeholder.svg?height=40&width=40&text={other_user.first_name[0]}{other_user.last_name[0]}" if other_user else None
            )
            return response_data
        
        # Verify the other user exists
        other_user = db.query(User).filter(User.user_id == conversation_data.user2_id).first()
        if not other_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get context title if provided
        context_title = conversation_data.context_title
        if not context_title and conversation_data.context_id:
            if conversation_data.conversation_type == "service":
                service = db.query(Service).filter(Service.service_id == conversation_data.context_id).first()
                context_title = service.title if service else None
            elif conversation_data.conversation_type == "request":
                request = db.query(Request).filter(Request.request_id == conversation_data.context_id).first()
                context_title = request.title if request else None
        
        # Create new conversation
        new_conversation = Conversation(
            user1_id=current_user.user_id,
            user2_id=conversation_data.user2_id,
            conversation_type=conversation_data.conversation_type,
            context_id=conversation_data.context_id,
            context_title=context_title
        )
        
        db.add(new_conversation)
        db.commit()
        db.refresh(new_conversation)
        
        response_data = ConversationResponse(
            conversation_id=new_conversation.id,
            user1_id=new_conversation.user1_id,
            user2_id=new_conversation.user2_id,
            conversation_type=new_conversation.conversation_type,
            context_id=new_conversation.context_id,
            context_title=new_conversation.context_title,
            created_at=new_conversation.created_at,
            updated_at=new_conversation.updated_at or new_conversation.created_at,
            is_active=new_conversation.is_active,
            last_message_at=new_conversation.last_message_at,
            other_user_id=other_user.user_id,
            other_user_name=f"{other_user.first_name} {other_user.last_name}",
            other_user_avatar=f"/placeholder.svg?height=40&width=40&text={other_user.first_name[0]}{other_user.last_name[0]}"
        )
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating conversation: {str(e)}"
        )

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(
    conversation_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """
    Get messages for a specific conversation
    """
    try:
        # Verify user is part of this conversation
        conversation = db.query(Conversation).filter(
            and_(
                Conversation.id == conversation_id,
                or_(
                    Conversation.user1_id == current_user.user_id,
                    Conversation.user2_id == current_user.user_id
                )
            )
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        # Get messages
        messages = db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == False
            )
        ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
        
        # Reverse to get chronological order
        messages.reverse()
        
        # Build response with sender info
        response_messages = []
        for msg in messages:
            sender = db.query(User).filter(User.user_id == msg.sender_id).first()
            
            message_response = MessageResponse(
                message_id=msg.id,
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                content=msg.content,
                message_type=msg.message_type,
                created_at=msg.created_at,
                updated_at=msg.updated_at,
                status=msg.status,
                is_edited=msg.is_edited,
                is_deleted=msg.is_deleted,
                file_url=msg.file_url,
                file_name=msg.file_name,
                file_size=msg.file_size,
                latitude=msg.latitude,
                longitude=msg.longitude,
                location_address=msg.location_address,
                sender_name=f"{sender.first_name} {sender.last_name}" if sender else "Unknown",
                sender_avatar=f"/placeholder.svg?height=40&width=40&text={sender.first_name[0]}{sender.last_name[0]}" if sender else None,
                is_current_user=msg.sender_id == current_user.user_id
            )
            response_messages.append(message_response)
        
        # Mark messages as read
        db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user.user_id,
                Message.status != 'read'
            )
        ).update({Message.status: 'read'})
        
        db.commit()
        
        return response_messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving messages: {str(e)}"
        )

@router.post("/messages", response_model=MessageResponse)
def send_message(
    message_data: MessageCreate,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Send a message in a conversation
    """
    try:
        # Verify user is part of the conversation
        conversation = db.query(Conversation).filter(
            and_(
                Conversation.id == message_data.conversation_id,
                or_(
                    Conversation.user1_id == current_user.user_id,
                    Conversation.user2_id == current_user.user_id
                )
            )
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        # Create the message
        new_message = Message(
            conversation_id=message_data.conversation_id,
            sender_id=current_user.user_id,
            content=message_data.content,
            message_type=message_data.message_type,
            latitude=message_data.latitude,
            longitude=message_data.longitude,
            location_address=message_data.location_address
        )
        
        db.add(new_message)
        
        # Update conversation last message info
        conversation.last_message_id = new_message.id
        conversation.last_message_at = new_message.created_at
        conversation.updated_at = new_message.created_at
        
        db.commit()
        db.refresh(new_message)
        
        # Build response
        sender = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        response_message = MessageResponse(
            message_id=new_message.id,
            conversation_id=new_message.conversation_id,
            sender_id=new_message.sender_id,
            content=new_message.content,
            message_type=new_message.message_type,
            created_at=new_message.created_at,
            updated_at=new_message.updated_at,
            status=new_message.status,
            is_edited=new_message.is_edited,
            is_deleted=new_message.is_deleted,
            file_url=new_message.file_url,
            file_name=new_message.file_name,
            file_size=new_message.file_size,
            latitude=new_message.latitude,
            longitude=new_message.longitude,
            location_address=new_message.location_address,
            sender_name=f"{sender.first_name} {sender.last_name}" if sender else "Unknown",
            sender_avatar=f"/placeholder.svg?height=40&width=40&text={sender.first_name[0]}{sender.last_name[0]}" if sender else None,
            is_current_user=True
        )
        
        return response_message
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending message: {str(e)}"
        )

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: int,
    current_user = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific conversation
    """
    try:
        # Verify user is part of this conversation
        conversation = db.query(Conversation).filter(
            and_(
                Conversation.id == conversation_id,
                or_(
                    Conversation.user1_id == current_user.user_id,
                    Conversation.user2_id == current_user.user_id
                )
            )
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        # Get other user info
        other_user_id = conversation.get_other_user_id(current_user.user_id)
        other_user = db.query(User).filter(User.user_id == other_user_id).first()
        
        # Get unread count
        unread_count = db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != current_user.user_id,
                Message.status != 'read'
            )
        ).count()
        
        response_data = ConversationResponse(
            conversation_id=conversation.id,
            user1_id=conversation.user1_id,
            user2_id=conversation.user2_id,
            conversation_type=conversation.conversation_type,
            context_id=conversation.context_id,
            context_title=conversation.context_title,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at or conversation.created_at,
            is_active=conversation.is_active,
            last_message_at=conversation.last_message_at,
            other_user_id=other_user.user_id if other_user else None,
            other_user_name=f"{other_user.first_name} {other_user.last_name}" if other_user else None,
            other_user_avatar=f"/placeholder.svg?height=40&width=40&text={other_user.first_name[0]}{other_user.last_name[0]}" if other_user else None,
            unread_count=unread_count
        )
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation: {str(e)}"
        )
