"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  Edit, 
  Trash, 
  Plus, 
  Search,
  Calendar,
  Clock,
  AlertCircle,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { getAllServiceRequests } from "@/lib/service-requests-data"
import DashboardSidebar from "./dashboard-sidebar"
import Link from "next/link"

export default function MyRequestsPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard/my-requests")
      return
    }

    const fetchRequests = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const allRequests = await getAllServiceRequests()
        
        // Filter requests created by the current user
        const myRequests = allRequests.filter(request => 
          request.creator_id === parseInt(currentUser?.user_id)
        )
        
        setRequests(myRequests)
        setFilteredRequests(myRequests)
      } catch (error) {
        console.error("Error fetching requests:", error)
        setError("Failed to load requests. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [isLoggedIn, router, currentUser])

  useEffect(() => {
    // Filter requests based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = requests.filter(request => 
        request.title.toLowerCase().includes(term) ||
        request.description.toLowerCase().includes(term) ||
        request.category.toLowerCase().includes(term)
      )
      setFilteredRequests(filtered)
    } else {
      setFilteredRequests(requests)
    }
  }, [searchTerm, requests])

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Urgent":
        return "bg-red-100 text-red-700"
      case "High":
        return "bg-orange-100 text-orange-700"
      case "Normal":
        return "bg-blue-100 text-blue-700"
      case "Low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (!isLoggedIn) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <DashboardSidebar />
        
        <div className="flex-1 p-8 md:ml-64">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Requests</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage the service requests you've posted on TimeNest
                </p>
              </div>
              <Link href="/list-service">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Post New Request
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your requests..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Requests List */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No requests match your search" : "You haven't posted any service requests yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? "Try a different search term or clear your search" 
                    : "Post a request to find someone with the skills you need"}
                </p>
                <Link href="/list-service">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-video relative">
                      <img
                        src={request.image || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(request.title)}`}
                        alt={request.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2">{request.budget} credits</Badge>
                      <Badge className={`absolute top-2 left-2 ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{request.title}</CardTitle>
                      <Badge variant="outline" className="w-fit mt-1">{request.category}</Badge>
                    </CardHeader>
                    <CardContent className="pb-2 flex-grow">
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                        {request.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{request.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2 border-t">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/requests/${request.id}`}>
                          View
                        </Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}