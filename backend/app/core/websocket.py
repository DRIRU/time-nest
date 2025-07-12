"""
WebSocket manager for real-time chat functionality
"""

import socketio
import asyncio
import logging
from typing import Dict, Set, Optional
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models.conversation import Conversation
from ..db.models.user import User
from ..core.security import decode_access_token
from sqlalchemy import and_, or_
import threading
import queue

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            async_mode='asgi',
            logger=False,
            engineio_logger=False
        )
        
        # Store active connections: user_id -> set of socket_ids
        self.active_connections: Dict[int, Set[str]] = {}
        
        # Store socket to user mapping: socket_id -> user_id
        self.socket_to_user: Dict[str, int] = {}
        
        # Store user to conversations mapping: user_id -> set of conversation_ids
        self.user_conversations: Dict[int, Set[int]] = {}
        
        # Queue for message broadcasting
        self.message_queue = queue.Queue()
        
        self.setup_event_handlers()
        
        # Start background task to process messages
        self.background_task = None
    
    def setup_event_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            try:
                # Extract token from auth
                token = auth.get('token') if auth else None
                if not token:
                    logger.warning(f"Connection {sid} rejected: No token provided")
                    await self.sio.disconnect(sid)
                    return False
                
                # Decode token to get user info
                try:
                    payload = decode_access_token(token)
                    user_id = payload.get("user_id")
                    
                    if not user_id:
                        logger.warning(f"Connection {sid} rejected: Invalid token")
                        await self.sio.disconnect(sid)
                        return False
                    
                    # Store connection
                    if user_id not in self.active_connections:
                        self.active_connections[user_id] = set()
                    
                    self.active_connections[user_id].add(sid)
                    self.socket_to_user[sid] = user_id
                    
                    # Load user's conversations
                    await self.load_user_conversations(user_id)
                    
                    logger.info(f"User {user_id} connected with socket {sid}")
                    
                    # Join user-specific room
                    await self.sio.enter_room(sid, f"user_{user_id}")
                    
                    # Start background task if not already running
                    if self.background_task is None:
                        self.background_task = asyncio.create_task(self.process_message_queue())
                    
                    # Notify user is online
                    await self.sio.emit('user_status', {
                        'user_id': user_id,
                        'status': 'online'
                    }, room=f"user_{user_id}")
                    
                    return True
                    
                except Exception as e:
                    logger.error(f"Error decoding token for connection {sid}: {e}")
                    await self.sio.disconnect(sid)
                    return False
                    
            except Exception as e:
                logger.error(f"Error handling connection {sid}: {e}")
                await self.sio.disconnect(sid)
                return False
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            try:
                user_id = self.socket_to_user.get(sid)
                if user_id:
                    # Remove from active connections
                    if user_id in self.active_connections:
                        self.active_connections[user_id].discard(sid)
                        if not self.active_connections[user_id]:
                            del self.active_connections[user_id]
                    
                    # Remove socket mapping
                    del self.socket_to_user[sid]
                    
                    # Leave user room
                    await self.sio.leave_room(sid, f"user_{user_id}")
                    
                    # Notify user is offline (if no more connections)
                    if user_id not in self.active_connections:
                        await self.sio.emit('user_status', {
                            'user_id': user_id,
                            'status': 'offline'
                        }, room=f"user_{user_id}")
                    
                    logger.info(f"User {user_id} disconnected from socket {sid}")
                
            except Exception as e:
                logger.error(f"Error handling disconnection {sid}: {e}")
        
        @self.sio.event
        async def join_conversation(sid, data):
            """Handle joining a conversation room"""
            try:
                user_id = self.socket_to_user.get(sid)
                conversation_id = data.get('conversation_id')
                
                if not user_id or not conversation_id:
                    return
                
                # Verify user is part of this conversation
                if await self.verify_user_in_conversation(user_id, conversation_id):
                    await self.sio.enter_room(sid, f"conversation_{conversation_id}")
                    logger.info(f"User {user_id} joined conversation {conversation_id}")
                    
                    # Add to user's conversations
                    if user_id not in self.user_conversations:
                        self.user_conversations[user_id] = set()
                    self.user_conversations[user_id].add(conversation_id)
                
            except Exception as e:
                logger.error(f"Error joining conversation: {e}")
        
        @self.sio.event
        async def leave_conversation(sid, data):
            """Handle leaving a conversation room"""
            try:
                user_id = self.socket_to_user.get(sid)
                conversation_id = data.get('conversation_id')
                
                if not user_id or not conversation_id:
                    return
                
                await self.sio.leave_room(sid, f"conversation_{conversation_id}")
                
                # Remove from user's conversations
                if user_id in self.user_conversations:
                    self.user_conversations[user_id].discard(conversation_id)
                
                logger.info(f"User {user_id} left conversation {conversation_id}")
                
            except Exception as e:
                logger.error(f"Error leaving conversation: {e}")
        
        @self.sio.event
        async def typing_start(sid, data):
            """Handle typing start event"""
            try:
                user_id = self.socket_to_user.get(sid)
                conversation_id = data.get('conversation_id')
                
                if not user_id or not conversation_id:
                    return
                
                # Broadcast typing indicator to conversation room (except sender)
                await self.sio.emit('typing_start', {
                    'user_id': user_id,
                    'conversation_id': conversation_id
                }, room=f"conversation_{conversation_id}", skip_sid=sid)
                
            except Exception as e:
                logger.error(f"Error handling typing start: {e}")
        
        @self.sio.event
        async def typing_stop(sid, data):
            """Handle typing stop event"""
            try:
                user_id = self.socket_to_user.get(sid)
                conversation_id = data.get('conversation_id')
                
                if not user_id or not conversation_id:
                    return
                
                # Broadcast typing stop to conversation room (except sender)
                await self.sio.emit('typing_stop', {
                    'user_id': user_id,
                    'conversation_id': conversation_id
                }, room=f"conversation_{conversation_id}", skip_sid=sid)
                
            except Exception as e:
                logger.error(f"Error handling typing stop: {e}")
    
    async def load_user_conversations(self, user_id: int):
        """Load user's conversations and join rooms"""
        try:
            db = next(get_db())
            conversations = db.query(Conversation).filter(
                and_(
                    or_(
                        Conversation.user1_id == user_id,
                        Conversation.user2_id == user_id
                    ),
                    Conversation.is_active == True
                )
            ).all()
            
            if user_id not in self.user_conversations:
                self.user_conversations[user_id] = set()
            
            for conv in conversations:
                self.user_conversations[user_id].add(conv.id)
                
                # Join all socket connections for this user to conversation rooms
                if user_id in self.active_connections:
                    for sid in self.active_connections[user_id]:
                        await self.sio.enter_room(sid, f"conversation_{conv.id}")
            
            db.close()
            
        except Exception as e:
            logger.error(f"Error loading user conversations: {e}")
    
    async def verify_user_in_conversation(self, user_id: int, conversation_id: int) -> bool:
        """Verify if user is part of a conversation"""
        try:
            db = next(get_db())
            conversation = db.query(Conversation).filter(
                and_(
                    Conversation.id == conversation_id,
                    or_(
                        Conversation.user1_id == user_id,
                        Conversation.user2_id == user_id
                    )
                )
            ).first()
            
            db.close()
            return conversation is not None
            
        except Exception as e:
            logger.error(f"Error verifying user in conversation: {e}")
            return False
    
    async def process_message_queue(self):
        """Background task to process message queue"""
        while True:
            try:
                # Check if there are messages in the queue
                if not self.message_queue.empty():
                    message_data, conversation_id = self.message_queue.get_nowait()
                    await self.broadcast_message(message_data, conversation_id)
                
                # Sleep briefly to avoid busy waiting
                await asyncio.sleep(0.1)
                
            except queue.Empty:
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.error(f"Error processing message queue: {e}")
                await asyncio.sleep(1)

    async def broadcast_message(self, message_data: dict, conversation_id: int):
        """Broadcast new message to conversation participants"""
        try:
            logger.info(f"📢 Broadcasting message to conversation room: conversation_{conversation_id}")
            logger.info(f"🔢 Message data: {message_data}")
            
            # Direct emit to the room
            room_name = f"conversation_{conversation_id}"
            await self.sio.emit('new_message', message_data, room=room_name)
            logger.info(f"✅ Message successfully broadcasted to conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"❌ Error broadcasting message: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
    
    def broadcast_message_sync(self, message_data: dict, conversation_id: int):
        """Synchronous wrapper for broadcast_message"""
        try:
            logger.info(f"🔄 Attempting sync broadcast for conversation {conversation_id}")
            
            # Use Socket.IO's background task to emit the message
            room_name = f"conversation_{conversation_id}"
            
            # This is a synchronous call that Socket.IO handles internally
            self.sio.start_background_task(
                self._emit_message_background,
                message_data,
                room_name
            )
            
            logger.info(f"✅ Message queued for broadcast to conversation {conversation_id}")
            
        except Exception as e:
            logger.error(f"❌ Error in sync broadcast wrapper: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
    
    async def _emit_message_background(self, message_data: dict, room_name: str):
        """Background task to emit message"""
        try:
            logger.info(f"📢 Emitting message to room: {room_name}")
            await self.sio.emit('new_message', message_data, room=room_name)
            logger.info(f"✅ Message successfully emitted to room: {room_name}")
        except Exception as e:
            logger.error(f"❌ Error emitting message: {e}")
    
    async def broadcast_message_status(self, message_id: int, status: str, conversation_id: int):
        """Broadcast message status update (read, delivered, etc.)"""
        try:
            await self.sio.emit('message_status', {
                'message_id': message_id,
                'status': status
            }, room=f"conversation_{conversation_id}")
            
        except Exception as e:
            logger.error(f"Error broadcasting message status: {e}")
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections

    def get_socket_app(self, fastapi_app):
        """Get the Socket.IO ASGI application combined with FastAPI"""
        return socketio.ASGIApp(self.sio, fastapi_app)

# Create global chat manager instance
chat_manager = ChatManager()
