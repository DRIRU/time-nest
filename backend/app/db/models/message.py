from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class MessageType(str, enum.Enum):
    text = 'text'
    image = 'image'
    file = 'file'
    location = 'location'
    system = 'system'

class MessageStatus(str, enum.Enum):
    sent = 'sent'
    delivered = 'delivered'
    read = 'read'

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Message relationships
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Message content
    message_type = Column(SQLEnum(MessageType), default=MessageType.text)
    content = Column(Text, nullable=False)
    
    # Message metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Message status
    status = Column(SQLEnum(MessageStatus), default=MessageStatus.sent)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # File attachments (optional)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(200), nullable=True)
    file_size = Column(Integer, nullable=True)
    
    # Location data (optional)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    location_address = Column(Text, nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", backref="sent_messages")
    
    def __repr__(self):
        return f"<Message(id={self.id}, conversation={self.conversation_id}, sender={self.sender_id})>"
    
    def to_dict(self):
        """Convert message to dictionary for API responses"""
        return {
            'message_id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'message_type': self.message_type.value,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'status': self.status.value,
            'is_edited': self.is_edited,
            'is_deleted': self.is_deleted,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'location_address': self.location_address
        }
