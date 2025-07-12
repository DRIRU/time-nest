"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Search, Clock, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUserConversations, formatConversations } from "@/lib/chat-data"
import { useAuth } from "@/contexts/auth-context"

export default function MessagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const { isLoggedIn, currentUser, loading: authLoading } = useAuth()

  // Load conversations from backend
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

    const fetchConversations = async () => {
      try {
        setLoading(true)
        const chatData = await getUserConversations()
        const formattedConversations = formatConversations(chatData.conversations)
        setConversations(formattedConversations)
      } catch (err) {
        console.error("Error loading conversations:", err)
        setError("Failed to load conversations. Please try again.")
        // If we get an auth error, redirect to login
        if (err.message && err.message.includes("Authentication")) {
          router.push("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [isLoggedIn, router, authLoading])

  // Mock conversations (fallback)
  const mockConversations = [
    {
      id: "1",
      user: {
        id: "user1",
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "Thanks for your interest in the photography service!",
      timestamp: "30m ago",
      unread: 2,
      context: "Photography Service",
    },
    {
      id: "2",
      user: {
        id: "user2",
        name: "Mike Chen",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "When would be a good time to start the tutoring sessions?",
      timestamp: "2h ago",
      unread: 0,
      context: "Spanish Tutoring Request",
    },
    {
      id: "3",
      user: {
        id: "user3",
        name: "Emily Davis",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      lastMessage: "Perfect! I'll send you the details shortly.",
      timestamp: "1d ago",
      unread: 1,
      context: "Fitness Training",
    },
  ]

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.context.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleConversationClick = (conversation) => {
    router.push(`/chat/${conversation.user.id}?conversation_id=${conversation.id}`)
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Messages</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm border-border mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    Messages
                  </h1>
                  <p className="text-muted-foreground">Your conversations</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="divide-y">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No conversations found</h3>
                <p className="text-muted-foreground">Start chatting with service providers and requesters!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.user.avatar || "/placeholder.svg"} alt={conversation.user.name} />
                      <AvatarFallback>{getInitials(conversation.user.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground truncate">{conversation.user.name}</h4>
                        <div className="flex items-center space-x-2">
                          {conversation.unread > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {conversation.timestamp}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-blue-600 mb-1">{conversation.context}</p>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
