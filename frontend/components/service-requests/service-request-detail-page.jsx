"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MapPin,
  Calendar,
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  CheckCircle,
  Shield,
  MessageSquare,
  AlertCircle,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getServiceRequestById } from "@/lib/service-requests-data"

export default function ServiceRequestDetailPage({ id }) {
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        setLoading(true)
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Get the request by ID from external data
        const foundRequest = getServiceRequestById(id)

        if (foundRequest) {
          setRequest(foundRequest)
        } else {
          setError("Service request not found")
        }
      } catch (err) {
        setError("Failed to load service request details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequestDetails()
  }, [id])

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-purple-100 text-purple-800"
      case "Closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: request.title,
        text: `Check out this service request: ${request.title} by ${request.user.name}`,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleContactRequester = () => {
    // Navigate to chat with the requester
    router.push(`/chat/${request.user.id}?context=request&id=${id}&title=${encodeURIComponent(request.title)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Service Requests
            </Button>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-gray-200">{error || "Service request not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Service Requests
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Header */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-80 h-64 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">Service Request</p>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          {request.title}
                        </h1>
                        <Badge variant="outline" className="mb-3">
                          {request.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setIsFavorited(!isFavorited)}>
                          <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleShare}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{request.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="font-medium">{request.urgency} Priority</span>
                        <Badge className={`ml-2 ${getUrgencyColor(request.urgency)}`}>{request.urgency}</Badge>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Budget</p>
                          <p className="text-2xl font-bold text-blue-600">{request.budget} credits/hour</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details Tabs */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="skills">Skills Required</TabsTrigger>
                    <TabsTrigger value="requester">About Requester</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request Description</h3>
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{request.description}</p>

                      {request.additionalNotes && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Additional Notes:</h4>
                          <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{request.additionalNotes}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">What's Expected:</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Professional consultation
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Clear recommendations
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Follow-up support if needed
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 mt-4 text-gray-900 dark:text-white">Deadline:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(request.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Required Skills</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {request.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Looking for someone with:</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <li>• Experience in {request.category.toLowerCase()}</li>
                            <li>• Strong communication skills</li>
                            <li>• Ability to meet deadlines</li>
                            <li>• Professional approach</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="requester" className="mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <Avatar className="h-16 w-16 mr-4">
                          <AvatarImage src={request.user.image || "/placeholder.svg"} alt={request.user.name} />
                          <AvatarFallback className="text-lg">{getInitials(request.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{request.user.name}</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            TimeNest Member since {new Date(request.user.memberSince).toLocaleDateString()}
                          </p>
                          <div className="flex items-center mt-1">
                            <Shield className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">Verified Member</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{request.user.completedProjects}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Projects Completed</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{request.user.rating}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Average Rating</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-lg font-bold text-blue-600 break-words">{request.user.location}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Location</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <MessageCircle className="h-5 w-5" />
                  Submit Proposal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-900">{request.budget} Time Credits per hour</p>
                  <p className="text-sm text-blue-700">Budget for this request</p>
                </div>

                <Button className="w-full" size="lg">
                  Submit Proposal
                </Button>

                <Button variant="outline" className="w-full" onClick={handleContactRequester}>
                  Contact Requester
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Join TimeNest to submit proposals and contact requesters
                </p>
              </CardContent>
            </Card>

            {/* Request Quick Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Priority:</span>
                  <Badge className={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Posted:</span>
                  <span className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Deadline:</span>
                  <span className="font-medium">{new Date(request.deadline).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Verified Request</span>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>• Always communicate through TimeNest platform</p>
                <p>• Verify project requirements before starting</p>
                <p>• Set clear expectations and timelines</p>
                <p>• Report any suspicious activity</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
