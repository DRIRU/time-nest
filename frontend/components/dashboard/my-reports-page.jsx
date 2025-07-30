"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Flag,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { getUserReports } from "@/lib/reports-data"
import DashboardSidebar from "./dashboard-sidebar"

export default function MyReportsPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser, loading } = useAuth()
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    if (loading) return
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard/my-reports")
      return
    }

    fetchUserReports()
  }, [isLoggedIn, router, currentUser, loading])

  const fetchUserReports = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log("Fetching user reports...")
      
      // Get reports from backend API
      const fetchedReports = await getUserReports(
        currentUser?.accessToken,
        () => {
          // Handle token expiration
          console.log("Token expired, redirecting to login")
          router.push("/login?redirect=/dashboard/my-reports")
        },
        {
          // You can add filters here if needed
          limit: 50,
          offset: 0
        }
      )
      
      console.log("Fetched reports:", fetchedReports)
      setReports(fetchedReports)
      setFilteredReports(fetchedReports)
      
    } catch (error) {
      console.error("Error fetching user reports:", error)
      setError("Failed to load your reports. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter reports based on search term, status, and type
  useEffect(() => {
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportedUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportedItem.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(report => report.type === typeFilter)
    }

    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, typeFilter])

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      case "under_review":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Eye className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      case "dismissed":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          Dismissed
        </Badge>
      case "escalated":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Escalated
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getReportTypeLabel = (type) => {
    const typeLabels = {
      service_quality: "Service Quality",
      fraud_scam: "Fraud/Scam",
      inappropriate_content: "Inappropriate Content",
      payment_dispute: "Payment Dispute",
      no_show: "No Show",
      unprofessional_behavior: "Unprofessional Behavior",
      safety_concern: "Safety Concern",
      other: "Other"
    }
    return typeLabels[type] || type
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Reports</h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and track all reports you've submitted
              </p>
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

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Filter Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="service_quality">Service Quality</SelectItem>
                        <SelectItem value="fraud_scam">Fraud/Scam</SelectItem>
                        <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                        <SelectItem value="payment_dispute">Payment Dispute</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                        <SelectItem value="unprofessional_behavior">Unprofessional Behavior</SelectItem>
                        <SelectItem value="safety_concern">Safety Concern</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {reports.length === 0 ? "No reports submitted" : "No reports match your filters"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {reports.length === 0 
                      ? "You haven't submitted any reports yet." 
                      : "Try adjusting your search criteria."}
                  </p>
                  {reports.length === 0 && (
                    <Button onClick={() => router.push("/services")}>
                      Browse Services
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {report.title}
                            </h3>
                            {getStatusBadge(report.status)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(report.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flag className="w-4 h-4" />
                              {getReportTypeLabel(report.type)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {report.reportedUser}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                          {report.description}
                        </p>
                      </div>

                      {report.category === "service" && report.reportedItem && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Related Service: 
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">
                            {report.reportedItem}
                          </span>
                        </div>
                      )}

                      {report.category === "request" && report.reportedItem && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Related Request: 
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">
                            {report.reportedItem}
                          </span>
                        </div>
                      )}

                      {report.status === "resolved" && report.resolution && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                            Resolution:
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            {report.resolution}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Report ID: {report.id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated: {formatDate(report.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
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
