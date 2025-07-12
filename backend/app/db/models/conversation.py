from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base

class ConversationType(str, enum.Enum):
    service = 'service'
    request = 'request'
    general = 'general'

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Participants
    user1_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    # Context information
    conversation_type = Column(SQLEnum(ConversationType), default=ConversationType.general)
    context_id = Column(Integer, nullable=True)  # Service ID or Request ID
    context_title = Column(String(200), nullable=True)  # Service title or Request title
    
    # Conversation metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Last message info for quick access
    last_message_id = Column(Integer, nullable=True)
    last_message_at = Column(DateTime, nullable=True)
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id], backref="conversations_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], backref="conversations_as_user2")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, users={self.user1_id}-{self.user2_id}, type={self.conversation_type})>"
    
    def get_other_user_id(self, current_user_id):
        """Get the other participant's user ID"""
        return self.user2_id if self.user1_id == current_user_id else self.user1_id
    
    def involves_user(self, user_id):
        """Check if a user is part of this conversation"""
        return self.user1_id == user_id or self.user2_id == user_id
