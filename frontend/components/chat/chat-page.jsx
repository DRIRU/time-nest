"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getUserById } from "@/lib/users-data"
import { getServiceRequestById } from "@/lib/service-requests-data"

export default function ChatPage({ userId }) {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef(null)

  // Get context from URL parameters
  const context = searchParams.get("context")
  const contextId = searchParams.get("id")
  const contextTitle = searchParams.get("title")

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        setLoading(true)

        // First try to get user directly
        let userData = getUserById(userId)

        // If user not found and we have a request context, try to get user from request
        if (!userData && context === "request" && contextId) {
          const request = getServiceRequestById(contextId)
          if (request && request.user) {
            userData = request.user
          }
        }

        if (userData) {
          setUser(userData)

          // Initialize with some sample messages
          setMessages([
            {
              id: 1,
              senderId: userData.id || userId,
              senderName: userData.name || "User",
              message: "Hi! I saw your interest in my service request. Let's discuss the details.",
              timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
              isCurrentUser: false,
            },
            {
              id: 2,
              senderId: "current-user",
              senderName: "You",
              message:
                "Hello! Yes, I'd love to help with your request. Can you tell me more about what you're looking for?",
              timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
              isCurrentUser: true,
            },
          ])
        }
      } catch (error) {
        console.error("Error loading chat:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndMessages()
  }, [userId, context, contextId])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        senderId: "current-user",
        senderName: "You",
        message: newMessage,
        timestamp: new Date(),
        isCurrentUser: true,
      }

      setMessages([...messages, message])
      setNewMessage("")

      // Simulate a response after 2 seconds
      setTimeout(() => {
        const response = {
          id: messages.length + 2,
          senderId: user?.id || userId,
          senderName: user?.name || "User",
          message: "Thanks for your message! I'll get back to you soon.",
          timestamp: new Date(),
          isCurrentUser: false,
        }
        setMessages((prev) => [...prev, response])
      }, 2000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
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
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
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
                  <p className="text-sm text-green-600">Online</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Context Banner */}
            {context && contextTitle && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border-border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{context === "request" ? "Service Request: " : "Service: "}</span>
                  {decodeURIComponent(contextTitle)}
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
                  <p className="text-sm">{message.message}</p>
                  <p
                    className={`text-xs mt-1 ${message.isCurrentUser ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <div className="border-t bg-card p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
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
