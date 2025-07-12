# Chat Feature Implementation - TimeNest

## Overview

This document provides a comprehensive implementation plan for the chat feature in the TimeNest application. The chat feature allows users to communicate with service providers and service requesters in real-time.

## Architecture

### 1. Database Schema

#### 1.1 Conversations Table
```sql
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    conversation_type ENUM('service', 'request', 'general') DEFAULT 'general',
    context_id INT NULL,
    context_title VARCHAR(200) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_message_id INT NULL,
    last_message_at DATETIME NULL,
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user1_id (user1_id),
    INDEX idx_user2_id (user2_id),
    INDEX idx_conversation_type (conversation_type),
    INDEX idx_updated_at (updated_at)
);
```

#### 1.2 Messages Table
```sql
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    file_url VARCHAR(500) NULL,
    file_name VARCHAR(200) NULL,
    file_size INT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);
```

### 2. Backend Implementation

#### 2.1 Database Models
- **Conversation Model**: Located at `backend/app/db/models/conversation.py`
- **Message Model**: Located at `backend/app/db/models/message.py`

#### 2.2 API Schemas
- **Chat Schemas**: Located at `backend/app/schemas/chat.py`
- Includes request/response models for conversations and messages

#### 2.3 API Endpoints
- **Chat Endpoints**: Located at `backend/app/api/endpoints/chat.py`
- RESTful API endpoints for chat operations

##### Available Endpoints:
1. `GET /api/v1/chat/conversations` - Get user's conversations
2. `POST /api/v1/chat/conversations` - Create new conversation
3. `GET /api/v1/chat/conversations/{id}` - Get conversation details
4. `GET /api/v1/chat/conversations/{id}/messages` - Get conversation messages
5. `POST /api/v1/chat/messages` - Send a message

### 3. Frontend Implementation

#### 3.1 API Integration
- **Chat Data Layer**: Located at `frontend/lib/chat-data.js`
- Functions for interacting with chat API endpoints

#### 3.2 Components
- **Chat Page**: `frontend/components/chat/chat-page.jsx`
- **Messages Page**: `frontend/components/messages/messages-page.jsx`
- **Service Detail Integration**: Updated to initiate chats

#### 3.3 Routing
- Chat routes: `/chat/{userId}?conversation_id={id}`
- Messages list: `/messages`

## Implementation Steps

### Phase 1: Database Setup
1. Create database models (✅ Completed)
2. Add models to SQLAlchemy Base
3. Run database migrations

### Phase 2: Backend API
1. Create API schemas (✅ Completed)
2. Implement API endpoints (✅ Completed)
3. Add authentication and authorization
4. Test API endpoints

### Phase 3: Frontend Integration
1. Create chat API functions (✅ Completed)
2. Update chat components (✅ Completed)
3. Integrate with service detail pages (✅ Completed)
4. Update messages page (✅ Completed)

### Phase 4: Testing and Optimization
1. Test chat functionality end-to-end
2. Optimize database queries
3. Add error handling and loading states
4. Performance testing

## Key Features

### 1. Context-Aware Conversations
- Conversations can be linked to services or requests
- Context information is preserved and displayed
- Easy navigation between chat and related content

### 2. Real-time Messaging
- Messages are sent and received in real-time
- Message status tracking (sent, delivered, read)
- Typing indicators (future enhancement)

### 3. User Experience
- Intuitive chat interface
- Message history and pagination
- Unread message counters
- Search functionality for conversations

### 4. Security and Privacy
- Authentication required for all chat operations
- Users can only access their own conversations
- Message content is properly validated

## Database Migration

To implement the chat feature, you'll need to create the database tables. Here's the migration script:

```sql
-- Create conversations table
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    conversation_type ENUM('service', 'request', 'general') DEFAULT 'general',
    context_id INT NULL,
    context_title VARCHAR(200) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_message_id INT NULL,
    last_message_at DATETIME NULL,
    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user1_id (user1_id),
    INDEX idx_user2_id (user2_id),
    INDEX idx_conversation_type (conversation_type),
    INDEX idx_updated_at (updated_at)
);

-- Create messages table
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    file_url VARCHAR(500) NULL,
    file_name VARCHAR(200) NULL,
    file_size INT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
);
```

## Usage Examples

### 1. Starting a Chat from Service Detail
```javascript
// In service detail page
const handleContactProvider = async () => {
  try {
    const conversation = await initiateServiceChat(
      serviceId,
      serviceTitle,
      providerId
    )
    router.push(`/chat/${providerId}?conversation_id=${conversation.conversation_id}`)
  } catch (error) {
    console.error("Error initiating chat:", error)
  }
}
```

### 2. Sending a Message
```javascript
// In chat page
const handleSendMessage = async () => {
  try {
    const messageData = {
      conversation_id: conversationId,
      content: messageContent,
      message_type: "text"
    }
    
    const sentMessage = await sendMessage(messageData)
    setMessages(prev => [...prev, sentMessage])
  } catch (error) {
    console.error("Error sending message:", error)
  }
}
```

### 3. Loading Conversations
```javascript
// In messages page
const loadConversations = async () => {
  try {
    const chatData = await getUserConversations()
    const formatted = formatConversations(chatData.conversations)
    setConversations(formatted)
  } catch (error) {
    console.error("Error loading conversations:", error)
  }
}
```

## Next Steps

1. **Database Migration**: Create the conversations and messages tables
2. **Backend Testing**: Test all API endpoints with proper authentication
3. **Frontend Testing**: Test the chat interface and message flow
4. **Error Handling**: Add comprehensive error handling and user feedback
5. **Performance**: Optimize queries and add caching where appropriate
6. **Real-time Features**: Consider WebSocket implementation for live messaging

## Future Enhancements

1. **WebSocket Integration**: Real-time messaging without polling
2. **File Attachments**: Support for image and file sharing
3. **Message Reactions**: Emoji reactions to messages
4. **Message Search**: Search within conversation history
5. **Typing Indicators**: Show when other user is typing
6. **Message Encryption**: End-to-end encryption for privacy
7. **Group Conversations**: Multi-user chat support
8. **Message Scheduling**: Schedule messages for later delivery
9. **Chat Bots**: Automated responses for common queries
10. **Push Notifications**: Real-time notifications for new messages

This implementation provides a solid foundation for the chat feature and can be extended with additional functionality as needed.
