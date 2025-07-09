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
  Send,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getServiceRequestById, submitProposal, getProposalsForRequest } from "@/lib/service-requests-data"
import { useAuth } from "@/contexts/auth-context"

export default function ServiceRequestDetailPage({ id, initialRequest = null }) {
  const [request, setRequest] = useState(initialRequest)
  const [loading, setLoading] = useState(!initialRequest)
  const [error, setError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const router = useRouter()
  const { isLoggedIn, currentUser } = useAuth()
  
  // Proposal modal state
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalText, setProposalText] = useState("")
  const [proposedCredits, setProposedCredits] = useState("")
  const [proposalLoading, setProposalLoading] = useState(false)
  const [proposalError, setProposalError] = useState("")
  const [proposalSuccess, setProposalSuccess] = useState(false)
  
  // Proposals state
  const [proposals, setProposals] = useState([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [proposalsError, setProposalsError] = useState("")
  const [hasSubmittedProposal, setHasSubmittedProposal] = useState(false)

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (initialRequest) {
        setRequest(initialRequest)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const fetchedRequest = await getServiceRequestById(id)

        if (fetchedRequest) {
          setRequest(fetchedRequest)
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
  }, [id, initialRequest])
  
  // Fetch proposals if user is logged in and request is loaded
  useEffect(() => {
    if (!isLoggedIn || !request || !currentUser) return;
    
    const fetchProposals = async () => {
      try {
        setProposalsLoading(true)
        setProposalsError("")
        
        // Only fetch proposals if the user is the request creator
        if (parseInt(request.creator_id) === parseInt(currentUser.user_id)) {
          const fetchedProposals = await getProposalsForRequest(request.id)
          setProposals(fetchedProposals)
        } else {
          // Check if the current user has already submitted a proposal
          const fetchedProposals = await getProposalsForRequest(request.id)
          const userProposal = fetchedProposals.find(
            p => parseInt(p.proposer_id) === parseInt(currentUser.user_id)
          )
          setHasSubmittedProposal(!!userProposal)
        }
      } catch (err) {
        // If the error is 403 Forbidden, it means the user is not the request creator
        if (err.message.includes("403")) {
          // This is expected for non-creators, so we don't show an error
        } else {
          setProposalsError("Failed to load proposals")
          console.error(err)
        }
      } finally {
        setProposalsLoading(false)
      }
    }
    
    fetchProposals()
  }, [isLoggedIn, request, currentUser])

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Urgent":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Normal":
        return "bg-blue-100 text-blue-800"
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
    if (!name || typeof name !== "string") return "U"
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
        text: `Check out this service request: ${request.title} by ${request.requester}`,
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
  
  const handleSubmitProposal = async () => {
    if (!isLoggedIn) {
      alert("Please log in to submit a proposal")
      router.push(`/login?redirect=/requests/${id}`)
      return
    }
    
    // Check if this is the user's own request
    if (parseInt(request.creator_id) === parseInt(currentUser.user_id)) {
      alert("You cannot submit a proposal to your own request")
      return
    }
    
    // Check if user has already submitted a proposal
    if (hasSubmittedProposal) {
      alert("You have already submitted a proposal for this request")
      return
    }
    
    setShowProposalModal(true)
  }
  
  const handleConfirmProposal = async () => {
    // Validate inputs
    if (!proposalText.trim()) {
      setProposalError("Please enter a proposal description")
      return
    }
    
    if (!proposedCredits || parseFloat(proposedCredits) <= 0) {
      setProposalError("Please enter a valid credit amount")
      return
    }
    
    setProposalLoading(true)
    setProposalError("")
    
    try {
      const proposalData = {
        request_id: parseInt(request.id),
        proposal_text: proposalText.trim(),
        proposed_credits: parseFloat(proposedCredits)
      }
      
      await submitProposal(proposalData)
      
      setProposalSuccess(true)
      setHasSubmittedProposal(true)
      
      // Reset form
      setProposalText("")
      setProposedCredits("")
      
      // Close modal after a delay
      setTimeout(() => {
        setShowProposalModal(false)
        setProposalSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error("Error submitting proposal:", error)
      setProposalError(error.message || "Failed to submit proposal. Please try again.")
    } finally {
      setProposalLoading(false)
    }
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
                          <p className="text-2xl font-bold text-blue-600">{request.budget} credits</p>
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
                          {request.skills && request.skills.length > 0 ? (
                            request.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-gray-500">No specific skills required</p>
                          )}
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
                            TimeNest Member since {new Date(request.user.memberSince || "2023-01-01").toLocaleDateString()}
                          </p>
                          <div className="flex items-center mt-1">
                            <Shield className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">Verified Member</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{request.user.completedProjects || 0}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Projects Completed</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{request.user.rating || 0}</p>
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
            
            {/* Proposals Section - Only visible to the request creator */}
            {isLoggedIn && parseInt(request.creator_id) === parseInt(currentUser?.user_id) && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MessageSquare className="h-5 w-5" />
                    Proposals ({proposals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposalsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : proposalsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{proposalsError}</AlertDescription>
                    </Alert>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No proposals yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        When service providers submit proposals, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal.proposal_id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage 
                                  src={`/placeholder.svg?height=40&width=40&text=${getInitials(proposal.proposer_name)}`} 
                                  alt={proposal.proposer_name} 
                                />
                                <AvatarFallback>{getInitials(proposal.proposer_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">{proposal.proposer_name}</h4>
                                <p className="text-sm text-gray-500">
                                  Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge>
                              {proposal.proposed_credits} credits
                            </Badge>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4">{proposal.proposal_text}</p>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/chat/${proposal.proposer_id}`)}
                            >
                              Message
                            </Button>
                            <Button size="sm">
                              Accept Proposal
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                  <p className="font-semibold text-blue-900">{request.budget} Time Credits</p>
                  <p className="text-sm text-blue-700">Budget for this request</p>
                </div>

                {isLoggedIn && parseInt(request.creator_id) === parseInt(currentUser?.user_id) ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is your own request. You cannot submit a proposal to your own request.
                    </AlertDescription>
                  </Alert>
                ) : hasSubmittedProposal ? (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You have already submitted a proposal for this request.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button className="w-full" onClick={handleSubmitProposal}>
                    Submit Proposal
                  </Button>
                )}

                <Button variant="outline" className="w-full" onClick={handleContactRequester}>
                  Contact Requester
                </Button>

                {!isLoggedIn && (
                  <p className="text-xs text-gray-500 text-center">
                    Join TimeNest to submit proposals and contact requesters
                  </p>
                )}
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
      
      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Submit Proposal</DialogTitle>
            <DialogDescription>
              Describe how you can help with this request and propose your price.
            </DialogDescription>
          </DialogHeader>
          
          {proposalSuccess ? (
            <div className="py-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-green-800 dark:text-green-300 font-medium">Proposal Submitted Successfully!</h3>
                </div>
                <p className="text-green-700 dark:text-green-400 mt-2 text-sm">
                  Your proposal has been sent to the requester. They will review it and get back to you if interested.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="proposedCredits" className="text-sm font-medium mb-2 block">Your Proposed Price (Credits)</Label>
                  <Input
                    id="proposedCredits"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={proposedCredits}
                    onChange={(e) => setProposedCredits(e.target.value)}
                    className="w-full"
                    placeholder="Enter your price in time credits"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The requester's budget is {request.budget} credits
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="proposalText" className="text-sm font-medium mb-2 block">Proposal Details</Label>
                  <Textarea
                    id="proposalText"
                    placeholder="Describe how you can help with this request, your experience, approach, and timeline..."
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    className="resize-none"
                    rows={6}
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Tips for a Great Proposal:</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Be specific about your experience and qualifications</li>
                    <li>• Explain your approach to the request</li>
                    <li>• Mention your availability and timeline</li>
                    <li>• Address any specific requirements mentioned in the request</li>
                  </ul>
                </div>

                {proposalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{proposalError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProposalModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmProposal} disabled={proposalLoading}>
                  {proposalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Proposal
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
