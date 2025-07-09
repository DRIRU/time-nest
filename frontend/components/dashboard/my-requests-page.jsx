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
  MapPin,
  MessageSquare,
  CheckCircle,
  XCircle,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { 
  getAllServiceRequests, 
  getProposalsForRequest, 
  submitProposal,
  updateProposal
} from "@/lib/service-requests-data"
import DashboardSidebar from "./dashboard-sidebar"
import Link from "next/link"

export default function MyRequestsPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser, loading } = useAuth()
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [myProposals, setMyProposals] = useState([])
  const [filteredProposals, setFilteredProposals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("posted")
  const [expandedRequestId, setExpandedRequestId] = useState(null)
  const [requestProposals, setRequestProposals] = useState({})
  const [loadingProposals, setLoadingProposals] = useState({})
  const [processingProposalId, setProcessingProposalId] = useState(null)

  useEffect(() => {
    if (loading) return;
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard/my-requests")
      return
    }

    fetchData()
  }, [isLoggedIn, router, currentUser, loading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const allRequests = await getAllServiceRequests()
      const myPostedRequests = allRequests.filter(request => 
        request.creator_id === parseInt(currentUser?.user_id)
      )
      setRequests(myPostedRequests)
      setFilteredRequests(myPostedRequests)
      
      try {
        const allProposals = await getProposalsForRequest()
        const submittedProposals = allProposals.filter(proposal => 
          parseInt(proposal.proposer_id) === parseInt(currentUser?.user_id)
        )
        setMyProposals(submittedProposals)
        setFilteredProposals(submittedProposals)
      } catch (proposalError) {
        console.error("Error fetching proposals:", proposalError)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      setError("Failed to load requests. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "posted") {
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
    } else {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const filtered = myProposals.filter(proposal => 
          proposal.proposal_text.toLowerCase().includes(term)
        )
        setFilteredProposals(filtered)
      } else {
        setFilteredProposals(myProposals)
      }
    }
  }, [searchTerm, requests, myProposals, activeTab])

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
  
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "withdrawn":
        return <Badge className="bg-gray-100 text-gray-800">Withdrawn</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const toggleRequestExpansion = async (requestId) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null)
      return
    }
    
    setExpandedRequestId(requestId)
    
    if (!requestProposals[requestId]) {
      try {
        setLoadingProposals(prev => ({ ...prev, [requestId]: true }))
        const proposals = await getProposalsForRequest(requestId)
        setRequestProposals(prev => ({ ...prev, [requestId]: proposals }))
      } catch (error) {
        console.error(`Error fetching proposals for request ${requestId}:`, error)
      } finally {
        setLoadingProposals(prev => ({ ...prev, [requestId]: false }))
      }
    }
  }
  
  const handleAcceptProposal = async (proposalId) => {
    try {
      setProcessingProposalId(proposalId)
      await updateProposal(proposalId, { status: "accepted" })
      await fetchData()
      setExpandedRequestId(null)
    } catch (error) {
      console.error("Error accepting proposal:", error)
      alert(`Failed to accept proposal: ${error.message}`)
    } finally {
      setProcessingProposalId(null)
    }
  }
  
  const handleRejectProposal = async (proposalId) => {
    try {
      setProcessingProposalId(proposalId)
      await updateProposal(proposalId, { status: "rejected" })
      await fetchData()
    } catch (error) {
      console.error("Error rejecting proposal:", error)
      alert(`Failed to reject proposal: ${error.message}`)
    } finally {
      setProcessingProposalId(null)
    }
  }
  
  const handleWithdrawProposal = async (proposalId) => {
    try {
      setProcessingProposalId(proposalId)
      await updateProposal(proposalId, { status: "withdrawn" })
      await fetchData()
    } catch (error) {
      console.error("Error withdrawing proposal:", error)
      alert(`Failed to withdraw proposal: ${error.message}`)
    } finally {
      setProcessingProposalId(null)
    }
  }
  
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <DashboardSidebar />
        
        <div className="flex-1 p-8 md:ml-64">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Requests</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your service requests and proposals
                </p>
              </div>
              <Link href="/list-service">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Post New Request
                </Button>
              </Link>
            </div>

            <Tabs defaultValue="posted" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posted">My Posted Requests</TabsTrigger>
                <TabsTrigger value="proposals">Proposals I Submitted</TabsTrigger>
              </TabsList>

              {/* Move TabsContent inside Tabs */}
              <TabsContent value="posted" className="mt-0">
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
                  <div className="space-y-6">
                    {filteredRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <CardTitle className="text-xl">{request.title}</CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{request.category}</Badge>
                                <Badge className={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                                <Badge className="bg-blue-100 text-blue-800">{request.budget} credits</Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleRequestExpansion(request.id)}
                                className="flex items-center gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                View Proposals
                                {requestProposals[request.id] && (
                                  <Badge className="ml-1 bg-blue-100 text-blue-800">
                                    {requestProposals[request.id].length}
                                  </Badge>
                                )}
                              </Button>
                              <Link href={`/requests/${request.id}`}>
                                <Button variant="outline" size="sm">View Request</Button>
                              </Link>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {expandedRequestId === request.id && (
                          <CardContent className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Proposals</h3>
                            
                            {loadingProposals[request.id] ? (
                              <div className="flex justify-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                              </div>
                            ) : !requestProposals[request.id] || requestProposals[request.id].length === 0 ? (
                              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No proposals yet</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                  When service providers submit proposals, they'll appear here.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {requestProposals[request.id].map((proposal) => (
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
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-500">
                                              Submitted {new Date(proposal.submitted_at).toLocaleDateString()}
                                            </p>
                                            {getStatusBadge(proposal.status)}
                                          </div>
                                        </div>
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800">
                                        {proposal.proposed_credits} credits
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">{proposal.proposal_text}</p>
                                    
                                    {proposal.status === "pending" && (
                                      <div className="flex justify-end gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => router.push(`/chat/${proposal.proposer_id}`)}
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Message
                                        </Button>
                                        <Button 
                                          size="sm"
                                          onClick={() => handleAcceptProposal(proposal.proposal_id)}
                                          disabled={processingProposalId === proposal.proposal_id}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Accept
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleRejectProposal(proposal.proposal_id)}
                                          disabled={processingProposalId === proposal.proposal_id}
                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                        
                        <CardFooter className="flex justify-between pt-4 border-t">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-600">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="proposals" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm ? "No proposals match your search" : "You haven't submitted any proposals yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {searchTerm 
                        ? "Try a different search term or clear your search" 
                        : "Browse service requests and submit proposals to offer your services"}
                    </p>
                    <Link href="/requests">
                      <Button>
                        <Search className="h-4 w-4 mr-2" />
                        Browse Service Requests
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredProposals.map((proposal) => (
                      <Card key={proposal.proposal_id} className="overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <CardTitle className="text-xl">Proposal for Request #{proposal.request_id}</CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {getStatusBadge(proposal.status)}
                                <Badge className="bg-blue-100 text-blue-800">{proposal.proposed_credits} credits</Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/requests/${proposal.request_id}`}>
                                <Button variant="outline" size="sm">View Request</Button>
                              </Link>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-4">
                          <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Your Proposal</h4>
                              <p className="text-gray-700 dark:text-gray-300">{proposal.proposal_text}</p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Submitted on {new Date(proposal.submitted_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {proposal.status === "pending" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleWithdrawProposal(proposal.proposal_id)}
                                  disabled={processingProposalId === proposal.proposal_id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Withdraw Proposal
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-4 border-t">
                          <div className="w-full">
                            {proposal.status === "accepted" && (
                              <Alert className="bg-green-50 border-green-200 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Your proposal has been accepted! The requester will contact you to discuss next steps.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {proposal.status === "rejected" && (
                              <Alert className="bg-red-50 border-red-200 text-red-800">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Your proposal has been rejected. Don't worry, there are many other opportunities available.
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {proposal.status === "withdrawn" && (
                              <Alert className="bg-gray-50 border-gray-200 text-gray-800">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  You have withdrawn this proposal
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
