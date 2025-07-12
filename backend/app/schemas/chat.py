from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ConversationType(str, Enum):
    service = 'service'
    request = 'request'
    general = 'general'

class MessageType(str, Enum):
    text = 'text'
    image = 'image'
    file = 'file'
    system = 'system'

class MessageStatus(str, Enum):
    sent = 'sent'
    delivered = 'delivered'
    read = 'read'

# Conversation schemas
class ConversationBase(BaseModel):
    conversation_type: ConversationType = ConversationType.general
    context_id: Optional[int] = None
    context_title: Optional[str] = None

class ConversationCreate(ConversationBase):
    user2_id: int = Field(..., description="The other participant's user ID")

class ConversationResponse(ConversationBase):
    conversation_id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    last_message_at: Optional[datetime] = None
    
    # Additional fields for frontend
    other_user_id: Optional[int] = None
    other_user_name: Optional[str] = None
    other_user_avatar: Optional[str] = None
    last_message_content: Optional[str] = None
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Message content")
    message_type: MessageType = MessageType.text

class MessageCreate(MessageBase):
    conversation_id: int = Field(..., description="ID of the conversation")

class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    status: Optional[MessageStatus] = None

class MessageResponse(MessageBase):
    message_id: int
    conversation_id: int
    sender_id: int
    created_at: datetime
    updated_at: datetime
    status: MessageStatus
    is_edited: bool
    is_deleted: bool
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    
    # Additional fields for frontend
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    is_current_user: Optional[bool] = False

    class Config:
        from_attributes = True

# Chat list schemas
class ChatListItem(BaseModel):
    conversation_id: int
    other_user_id: int
    other_user_name: str
    other_user_avatar: Optional[str] = None
    last_message_content: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    conversation_type: ConversationType
    context_title: Optional[str] = None

class ChatListResponse(BaseModel):
    conversations: List[ChatListItem]
    total_count: int
    unread_total: int
