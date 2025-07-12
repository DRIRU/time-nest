// This file handles chat-related API interactions with the backend

/**
 * Get all conversations for the current user
 * @param {Object} options Optional parameters
 * @param {number} options.skip Number of conversations to skip
 * @param {number} options.limit Maximum number of conversations to return
 * @returns {Promise<Object>} Chat list response
 */
export async function getUserConversations(options = {}) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const queryParams = new URLSearchParams();
    if (options.skip) queryParams.append("skip", options.skip);
    if (options.limit) queryParams.append("limit", options.limit);

    const url = `http://localhost:8000/api/v1/chat/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch conversations");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
}

/**
 * Create a new conversation or get existing one
 * @param {Object} conversationData Conversation data
 * @param {number} conversationData.user2_id Other user's ID
 * @param {string} conversationData.conversation_type Type of conversation (service, request, general)
 * @param {number} conversationData.context_id Service ID or Request ID
 * @param {string} conversationData.context_title Service title or Request title
 * @returns {Promise<Object>} Conversation response
 */
export async function createOrGetConversation(conversationData) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch("http://localhost:8000/api/v1/chat/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(conversationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to create conversation";
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

/**
 * Get conversation details
 * @param {number} conversationId Conversation ID
 * @returns {Promise<Object>} Conversation details
 */
export async function getConversation(conversationId) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch(`http://localhost:8000/api/v1/chat/conversations/${conversationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch conversation");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
}

/**
 * Get messages for a conversation
 * @param {number} conversationId Conversation ID
 * @param {Object} options Optional parameters
 * @param {number} options.skip Number of messages to skip
 * @param {number} options.limit Maximum number of messages to return
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(conversationId, options = {}) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const queryParams = new URLSearchParams();
    if (options.skip) queryParams.append("skip", options.skip);
    if (options.limit) queryParams.append("limit", options.limit);

    const url = `http://localhost:8000/api/v1/chat/conversations/${conversationId}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch messages");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

/**
 * Send a message in a conversation
 * @param {Object} messageData Message data
 * @param {number} messageData.conversation_id Conversation ID
 * @param {string} messageData.content Message content
 * @param {string} messageData.message_type Message type (text, image, file, system)
 * @returns {Promise<Object>} Sent message response
 */
export async function sendMessage(messageData) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch("http://localhost:8000/api/v1/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to send message";
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Helper function to initiate a chat from service detail page
 * @param {number} serviceId Service ID
 * @param {string} serviceTitle Service title
 * @param {number} providerId Service provider's user ID
 * @returns {Promise<Object>} Conversation response
 */
export async function initiateServiceChat(serviceId, serviceTitle, providerId) {
  try {
    const conversationData = {
      user2_id: providerId,
      conversation_type: "service",
      context_id: serviceId,
      context_title: serviceTitle
    };

    const conversation = await createOrGetConversation(conversationData);
    return conversation;
  } catch (error) {
    console.error("Error initiating service chat:", error);
    throw error;
  }
}

/**
 * Helper function to initiate a chat from request detail page
 * @param {number} requestId Request ID
 * @param {string} requestTitle Request title
 * @param {number} requesterId Request creator's user ID
 * @returns {Promise<Object>} Conversation response
 */
export async function initiateRequestChat(requestId, requestTitle, requesterId) {
  try {
    const conversationData = {
      user2_id: requesterId,
      conversation_type: "request",
      context_id: requestId,
      context_title: requestTitle
    };

    const conversation = await createOrGetConversation(conversationData);
    return conversation;
  } catch (error) {
    console.error("Error initiating request chat:", error);
    throw error;
  }
}

/**
 * Helper function to format chat messages for display
 * @param {Array} messages Array of message objects
 * @param {number} currentUserId Current user's ID
 * @returns {Array} Formatted messages
 */
export function formatMessages(messages, currentUserId) {
  return messages.map(message => ({
    id: message.message_id,
    content: message.content,
    timestamp: message.created_at, // Keep as ISO string to avoid hydration issues
    isCurrentUser: message.sender_id === currentUserId,
    senderName: message.sender_name,
    senderAvatar: message.sender_avatar,
    messageType: message.message_type,
    status: message.status,
    isEdited: message.is_edited,
    latitude: message.latitude,
    longitude: message.longitude,
    locationAddress: message.location_address
  }));
}

/**
 * Helper function to format conversation list for display
 * @param {Array} conversations Array of conversation objects
 * @returns {Array} Formatted conversations
 */
export function formatConversations(conversations) {
  return conversations.map(conv => ({
    id: conv.conversation_id,
    user: {
      id: conv.other_user_id,
      name: conv.other_user_name,
      avatar: conv.other_user_avatar
    },
    lastMessage: conv.last_message_content,
    timestamp: conv.last_message_at ? formatTimestamp(conv.last_message_at) : "No messages",
    unread: conv.unread_count,
    context: conv.context_title || `${conv.conversation_type} conversation`,
    type: conv.conversation_type
  }));
}

/**
 * Format timestamp for display in conversations list
 * @param {string} timestamp ISO timestamp string
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    // Show time if it's today - use consistent format
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } else if (diffInHours < 168) {
    // Show day of week if it's this week - use consistent format
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  } else {
    // Show date if it's older - use consistent format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}
