"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Search, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MessagesList() {
  const [conversations, setConversations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Mock conversations data
    const mockConversations = [
      {
        id: "1",
        user: {
          id: "user1",
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        lastMessage: "Thanks for your interest in the photography service!",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        unread: 2,
        context: "Photography Service",
        type: "service",
      },
      {
        id: "2",
        user: {
          id: "user2",
          name: "Mike Chen",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        lastMessage: "When would be a good time to start the tutoring sessions?",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        unread: 0,
        context: "Spanish Tutoring Request",
        type: "request",
      },
      {
        id: "3",
        user: {
          id: "user3",
          name: "Emily Davis",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        lastMessage: "Perfect! I'll send you the details shortly.",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        unread: 1,
        context: "Fitness Training",
        type: "service",
      },
      {
        id: "4",
        user: {
          id: "user4",
          name: "David Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        lastMessage: "Great! Looking forward to working with you.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        unread: 0,
        context: "Plumbing Service",
        type: "service",
      },
    ]

    setConversations(mockConversations)
    setLoading(false)
  }, [])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.context.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatTime = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}m ago`
    } else if (hours < 24) {
      return `${hours}h ago`
    } else {
      return `${days}d ago`
    }
  }

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleConversationClick = (conversation) => {
    router.push(
      `/chat/${conversation.user.id}?context=${conversation.type}&title=${encodeURIComponent(conversation.context)}`,
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Messages
            </CardTitle>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500">Start chatting with service providers and requesters!</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={conversation.user.avatar || "/placeholder.svg"}
                          alt={conversation.user.name}
                        />
                        <AvatarFallback>{getInitials(conversation.user.name)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{conversation.user.name}</h4>
                          <div className="flex items-center space-x-2">
                            {conversation.unread > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(conversation.timestamp)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-blue-600 mb-1">{conversation.context}</p>
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
