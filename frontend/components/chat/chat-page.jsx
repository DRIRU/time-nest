"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Send, Paperclip, Smile, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getUserById } from "@/lib/users-data"
import { getConversation, getConversationMessages, sendMessage, formatMessages } from "@/lib/chat-data"
import { useAuth } from "@/contexts/auth-context"
import { useWebSocket } from "@/contexts/websocket-context"

export default function ChatPage({ userId }) {
  const [user, setUser] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [conversationId, setConversationId] = useState(null)
  const [isLocationSharing, setIsLocationSharing] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef(null)
  const { isLoggedIn, currentUser, loading: authLoading } = useAuth()
  const { 
    socket, 
    isConnected, 
    joinConversation, 
    leaveConversation, 
    sendTypingStart, 
    sendTypingStop, 
    onNewMessage, 
    onTypingStart, 
    onTypingStop,
    removeAllListeners 
  } = useWebSocket()

  // Get conversation ID from URL parameters
  useEffect(() => {
    const loadUrlParams = async () => {
      try {
        const conversationIdParam = searchParams.get("conversation_id")
        if (conversationIdParam) {
          setConversationId(parseInt(conversationIdParam))
        }
      } catch (error) {
        console.error("Error loading URL params:", error)
      }
    }
    
    loadUrlParams()
  }, [searchParams])

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    // Redirect to login if not authenticated
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    // Only proceed if we have authentication
    if (!currentUser) {
      return
    }

    const fetchConversationAndMessages = async () => {
      try {
        setLoading(true)

        if (conversationId) {
          // Get conversation details
          const conversationData = await getConversation(conversationId)
          setConversation(conversationData)

          // Get other user info
          const otherUserId = conversationData.other_user_id
          const userData = getUserById(otherUserId.toString())
          if (userData) {
            setUser({
              id: userData.id,
              name: userData.fullName,
              avatar: userData.avatar,
              image: userData.avatar
            })
          } else {
            // Fallback to conversation data
            setUser({
              id: conversationData.other_user_id,
              name: conversationData.other_user_name,
              avatar: conversationData.other_user_avatar,
              image: conversationData.other_user_avatar
            })
          }

          // Get messages
          const messagesData = await getConversationMessages(conversationId)
          const formattedMessages = formatMessages(messagesData, currentUser.user_id)
          setMessages(formattedMessages)
        } else {
          // Fallback - try to get user directly
          const userData = getUserById(userId)
          if (userData) {
            setUser({
              id: userData.id,
              name: userData.fullName,
              avatar: userData.avatar,
              image: userData.avatar
            })
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error)
        // If we get an auth error, redirect to login
        if (error.message && error.message.includes("Authentication")) {
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchConversationAndMessages()
  }, [conversationId, userId, isLoggedIn, router, currentUser, authLoading])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected || !conversationId) return

    // Join conversation room
    joinConversation(conversationId)

    // Handle new messages
    const handleNewMessage = (messageData) => {
      console.log('📨 Received new message via WebSocket:', messageData)
      
      // Convert WebSocket message to frontend format
      const newMessage = {
        id: messageData.message_id,
        content: messageData.content,
        timestamp: messageData.created_at,
        isCurrentUser: messageData.sender_id === currentUser?.user_id,
        senderName: messageData.sender_name,
        senderAvatar: messageData.sender_avatar,
        messageType: messageData.message_type,
        status: messageData.status,
        latitude: messageData.latitude,
        longitude: messageData.longitude,
        locationAddress: messageData.location_address
      }

      console.log('💬 Formatted message:', newMessage)

      // Only add message if it's not from current user (to avoid duplicates)
      if (messageData.sender_id !== currentUser?.user_id) {
        console.log('➕ Adding message to state')
        setMessages(prev => [...prev, newMessage])
      } else {
        console.log('👤 Skipping own message to avoid duplicate')
      }
    }

    // Handle typing indicators
    const handleTypingStart = (data) => {
      if (data.conversation_id === conversationId && data.user_id !== currentUser?.user_id) {
        setTypingUsers(prev => new Set([...prev, data.user_id]))
      }
    }

    const handleTypingStop = (data) => {
      if (data.conversation_id === conversationId && data.user_id !== currentUser?.user_id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.user_id)
          return newSet
        })
      }
    }

    // Set up event listeners
    onNewMessage(handleNewMessage)
    onTypingStart(handleTypingStart)
    onTypingStop(handleTypingStop)

    // Cleanup function
    return () => {
      leaveConversation(conversationId)
      removeAllListeners()
    }
  }, [isConnected, conversationId, currentUser?.user_id, joinConversation, leaveConversation, onNewMessage, onTypingStart, onTypingStop, removeAllListeners])

  const handleSendMessage = async () => {
    if (newMessage.trim() && conversationId) {
      try {
        const messageData = {
          conversation_id: conversationId,
          content: newMessage.trim(),
          message_type: "text"
        }

        // Send message to backend
        const sentMessage = await sendMessage(messageData)
        
        // Add message to local state
        const formattedMessage = {
          id: sentMessage.message_id,
          content: sentMessage.content,
          timestamp: sentMessage.created_at, // Keep as ISO string to match other messages
          isCurrentUser: sentMessage.is_current_user,
          senderName: sentMessage.sender_name,
          senderAvatar: sentMessage.sender_avatar,
          messageType: sentMessage.message_type,
          status: sentMessage.status,
          latitude: sentMessage.latitude,
          longitude: sentMessage.longitude,
          locationAddress: sentMessage.location_address
        }

        setMessages(prev => [...prev, formattedMessage])
        setNewMessage("")
      } catch (error) {
        console.error("Error sending message:", error)
        alert("Failed to send message. Please try again.")
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  // Typing indicator logic
  const typingTimeoutRef = useRef(null)
  
  const handleInputChange = (e) => {
    const value = e.target.value
    setNewMessage(value)
    
    // Send typing start if not already typing
    if (!isTyping && value.trim() && conversationId) {
      setIsTyping(true)
      sendTypingStart(conversationId)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && conversationId) {
        setIsTyping(false)
        sendTypingStop(conversationId)
      }
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping && conversationId) {
      setIsTyping(false)
      sendTypingStop(conversationId)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleLocationShare = async () => {
    if (!conversationId || isLocationSharing) return;
    
    setIsLocationSharing(true);
    
    try {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      const messageData = {
        conversation_id: conversationId,
        content: "Location shared",
        message_type: "location",
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        location_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
      
      // Send location message to backend
      const sentMessage = await sendMessage(messageData);
      
      // Add message to local state
      const formattedMessage = {
        id: sentMessage.message_id,
        content: sentMessage.content,
        timestamp: sentMessage.created_at,
        isCurrentUser: sentMessage.is_current_user,
        senderName: sentMessage.sender_name,
        senderAvatar: sentMessage.sender_avatar,
        messageType: sentMessage.message_type,
        status: sentMessage.status,
        latitude: sentMessage.latitude,
        longitude: sentMessage.longitude,
        location_address: sentMessage.location_address
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      
    } catch (error) {
      console.error("Error sharing location:", error);
      if (error.code === 1) {
        alert("Location access denied. Please allow location access to share your location.");
      } else if (error.code === 2) {
        alert("Location information is unavailable.");
      } else if (error.code === 3) {
        alert("Location request timed out.");
      } else {
        alert("Failed to share location. Please try again.");
      }
    } finally {
      setIsLocationSharing(false);
    }
  }

  const handleShareLocation = async () => {
    if (!conversationId) return

    setLocationLoading(true)
    
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.")
        return
      }

      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      })

      const { latitude, longitude } = position.coords

      // Create a simple location address using coordinates
      let locationAddress = `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

      // Send location message
      const messageData = {
        conversation_id: conversationId,
        content: `Location shared: ${locationAddress}`,
        message_type: "location",
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        location_address: locationAddress
      }

      const sentMessage = await sendMessage(messageData)
      
      // Add message to local state
      const formattedMessage = {
        id: sentMessage.message_id,
        content: sentMessage.content,
        timestamp: sentMessage.created_at,
        isCurrentUser: sentMessage.is_current_user,
        senderName: sentMessage.sender_name,
        senderAvatar: sentMessage.sender_avatar,
        messageType: sentMessage.message_type,
        status: sentMessage.status,
        latitude: sentMessage.latitude,
        longitude: sentMessage.longitude,
        locationAddress: sentMessage.location_address
      }

      setMessages(prev => [...prev, formattedMessage])
      
    } catch (error) {
      console.error("Error sharing location:", error)
      if (error.code === error.PERMISSION_DENIED) {
        alert("Location access denied. Please enable location permissions and try again.")
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        alert("Location information is unavailable.")
      } else if (error.code === error.TIMEOUT) {
        alert("Location request timed out.")
      } else {
        alert("Failed to share location. Please try again.")
      }
    } finally {
      setLocationLoading(false)
    }
  }

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    )
  }

  const formatTime = (timestamp) => {
    // Use a consistent format that doesn't depend on locale
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're trying to chat with could not be found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <Card className="h-screen flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || user.image || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-green-600">Online</p>
                    {isConnected && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Real-time</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>


            </div>

            {/* Context Banner */}
            {conversation && conversation.context_title && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">
                    {conversation.conversation_type === "request" ? "Service Request: " : "Service: "}
                  </span>
                  {conversation.context_title}
                </p>
              </div>
            )}
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isCurrentUser ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                  }`}
                >
                  {message.messageType === "location" ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Location Shared</span>
                      </div>
                      <p className="text-sm">
                        {message.latitude && message.longitude
                          ? `${parseFloat(message.latitude).toFixed(6)}, ${parseFloat(message.longitude).toFixed(6)}`
                          : message.content}
                      </p>
                      {message.latitude && message.longitude && (
                        <div className="flex space-x-2">
                          <a
                            href={`https://www.google.com/maps?q=${message.latitude},${message.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs px-2 py-1 rounded ${
                              message.isCurrentUser 
                                ? "bg-blue-500 hover:bg-blue-400 text-white" 
                                : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                            }`}
                          >
                            View on Map
                          </a>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${message.latitude},${message.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs px-2 py-1 rounded ${
                              message.isCurrentUser 
                                ? "bg-blue-500 hover:bg-blue-400 text-white" 
                                : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                            }`}
                          >
                            Get Directions
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${message.isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted text-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <div className="border-t bg-card p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLocationShare}
                disabled={isLocationSharing}
                title="Share Location"
              >
                {isLocationSharing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                ) : (
                  <MapPin className="h-5 w-5" />
                )}
              </Button>

              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onBlur={handleStopTyping}
                  placeholder="Type a message..."
                  className="pr-10"
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
