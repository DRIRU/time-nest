"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Shield, 
  Settings,
  BarChart3,
  UserCheck,
  MessageSquare,
  Calendar,
  Activity,
  Eye,
  FileText,
  LogOut,
  Home,
  Award,
  Flag,
  Search,
  Filter,
  Ban,
  Check,
  X,
  MessageCircle,
  User,
  AlertCircle,
  UserMinus,
  UserX,
  UserPlus,
  History,
  Info,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Play,
  Archive
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from "recharts"
import { getPendingReports, getFlaggedContent, getModeratorStats, getModeratorActivity, updateReportStatus, moderateContent, isModeratorAuthenticated, getStoredModeratorData, logoutModerator, getModeratorUsers, getModeratorRecentUsers, getModeratorServices, getModeratorRequests, moderateService, moderateRequest, getAllReports, getSuspendedUsers } from "@/lib/moderator-data"
import { getServiceById } from "@/lib/services-data"

// Utility function to get current time in Indian timezone
const getCurrentISTTime = () => {
  // Get current UTC time and convert to IST
  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const istOffset = 5.5 // IST is UTC+5:30
  const istTime = new Date(utc + (istOffset * 3600000))
  
  return istTime.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) + ' IST'
}

// Utility function to format dates in Indian timezone
const formatDateIST = (dateString, options = {}) => {
  if (!dateString) return 'N/A'
  
  try {
    // Parse the input date
    const inputDate = new Date(dateString)
    
    // Check if it's a valid date
    if (isNaN(inputDate.getTime())) {
      console.error('Invalid date:', dateString)
      return 'Invalid Date'
    }
    
    // Convert to IST manually
    const utc = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000)
    const istOffset = 5.5 // IST is UTC+5:30
    const istTime = new Date(utc + (istOffset * 3600000))
    
    // Format in Indian style
    const formatted = istTime.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
    
    return formatted + ' IST'
    
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString)
    return 'Invalid Date'
  }
}

// Utility function to format dates in Indian timezone (date only)
const formatDateOnlyIST = (dateString) => {
  return formatDateIST(dateString, {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}
import Link from "next/link"

export default function ModeratorDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [moderatorUser, setModeratorUser] = useState(null)
  const [stats, setStats] = useState({
    reports: {
      pending: 0,
      under_review: 0,
      resolved: 0,
      total: 0
    },
    users: {
      flagged: 0,
      suspended: 0,
      total: 0
    },
    content: {
      services: 0,
      comments: 0,
      flagged: 0
    }
  })
  
  // Sample data for demonstration
  const [pendingReports, setPendingReports] = useState([])
  const [underReviewReports, setUnderReviewReports] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [flaggedContent, setFlaggedContent] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  
  // Content management state
  const [showContentSearch, setShowContentSearch] = useState(false)
  const [allServices, setAllServices] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [filteredContent, setFilteredContent] = useState([])
  const [contentSearchTerm, setContentSearchTerm] = useState("")
  const [contentTypeFilter, setContentTypeFilter] = useState("all")
  const [contentStatusFilter, setContentStatusFilter] = useState("all")
  const [contentSortBy, setContentSortBy] = useState("newest")
  const [contentLoading, setContentLoading] = useState(false)
  const [processingContentId, setProcessingContentId] = useState(null)
  
  // User management state
  const [flaggedUsers, setFlaggedUsers] = useState([])
  const [suspendedUsers, setSuspendedUsers] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [processingUserId, setProcessingUserId] = useState(null)
  
  // User search and view state
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Date range state for reports
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // 1 month ago
    endDate: new Date().toISOString().split('T')[0] // today
  })
  const [isLoadingReports, setIsLoadingReports] = useState(false)

  // Investigation modal state
  const [showInvestigationModal, setShowInvestigationModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [investigationNotes, setInvestigationNotes] = useState("")
  const [isInvestigating, setIsInvestigating] = useState(false)

  useEffect(() => {
    // Check moderator authentication using the utility functions
    if (!isModeratorAuthenticated()) {
      router.push("/moderator/login")
      return
    }

    const moderatorData = getStoredModeratorData()
    if (moderatorData) {
      setModeratorUser(moderatorData)
    }
  }, [router])

  // Load moderator dashboard data
  useEffect(() => {
    if (!moderatorUser) return

    async function loadModeratorStats() {
      try {
        // Load stats and data using the moderator data functions
        const [statsData, reportsData, underReviewData, contentData, activityData, suspendedServices, suspendedRequests, allServicesData, allRequestsData] = await Promise.all([
          getModeratorStats(moderatorUser.accessToken),
          getPendingReports(moderatorUser.accessToken),
          getAllReports({ status: 'under_review' }),
          getFlaggedContent(moderatorUser.accessToken),
          getModeratorActivity(moderatorUser.accessToken, 5),
          getModeratorServices({ status: 'suspended' }),
          getModeratorRequests({ status: 'suspended' }),
          getModeratorServices(), // Get all services for total count
          getModeratorRequests()  // Get all requests for total count
        ])
        
        console.log("Loaded moderator data:", { statsData, reportsData, underReviewData, contentData, activityData, suspendedServices, suspendedRequests, allServicesData, allRequestsData })
        
        // Debug: Log suspended services and requests structure
        if (suspendedServices && suspendedServices.length > 0) {
          console.log("Sample suspended service:", suspendedServices[0])
        }
        if (suspendedRequests && suspendedRequests.length > 0) {
          console.log("Sample suspended request:", suspendedRequests[0])
        }
        
        // Ensure all reports have proper IDs
        const validReports = (Array.isArray(reportsData) ? reportsData : []).map((report, index) => ({
          ...report,
          id: report.id || report.report_id || `report-${index}`,
          type: report.report_type || report.type || "Unknown",
          severity: report.severity || "Medium",
          reportedUser: report.reported_user_name || report.reported_user?.username || "Unknown User",
          reportedBy: report.reporter_name || report.reporter?.username || "System",
          reason: report.category || "No reason specified",
          description: report.description || "No description provided",
          timestamp: report.created_at || new Date().toISOString(),
          status: report.status || "pending",
          admin_notes: report.admin_notes || null,
          updated_at: report.updated_at || null
        }))

        // Process under review reports
        const validUnderReviewReports = (Array.isArray(underReviewData) ? underReviewData : []).map((report, index) => ({
          ...report,
          id: report.id || report.report_id || `under-review-${index}`,
          type: report.report_type || report.type || "Unknown",
          severity: report.severity || "Medium",
          reportedUser: report.reported_user_name || report.reported_user?.username || "Unknown User",
          reportedBy: report.reporter_name || report.reporter?.username || "System",
          reason: report.category || "No reason specified",
          description: report.description || "No description provided",
          timestamp: report.created_at || new Date().toISOString(),
          status: report.status || "under_review",
          reviewStarted: report.review_started || report.updated_at || new Date().toISOString(),
          admin_notes: report.admin_notes || null,
          updated_at: report.updated_at || null
        }))

        // Ensure all content has proper IDs
        const validContent = (Array.isArray(contentData) ? contentData : []).map((item, index) => ({
          ...item,
          id: item.id || `content-${index}`,
          type: item.type || "Content",
          title: item.title || "Unknown Content",
          author: item.author || "Unknown User",
          flaggedBy: item.flaggedBy || "System",
          reason: item.reason || "No reason specified",
          timestamp: item.timestamp || new Date().toISOString(),
          status: item.status || "pending"
        }))

        // Process suspended services
        const validSuspendedServices = (Array.isArray(suspendedServices) ? suspendedServices : []).map((service, index) => ({
          id: service.id || `suspended-service-${index}`,
          type: "Service",
          title: service.title || service.service_name || service.name || "Unknown Service",
          content: service.description || "No description",
          author: service.creator_name || service.provider_name || service.provider?.username || service.provider?.name || service.user?.username || service.user?.name || service.username || "Unknown Provider",
          flaggedBy: "Moderator",
          timestamp: service.suspended_at || service.updated_at || service.created_at || new Date().toISOString(),
          status: "suspended",
          originalId: service.id,
          serviceData: service
        }))

        // Process suspended requests
        const validSuspendedRequests = (Array.isArray(suspendedRequests) ? suspendedRequests : []).map((request, index) => ({
          id: request.id || `suspended-request-${index}`,
          type: "Request",
          title: request.title || request.service_title || request.name || "Unknown Request",
          content: request.description || "No description",
          author: request.creator_name || request.requester_name || request.requester?.username || request.requester?.name || request.user?.username || request.user?.name || request.username || "Unknown Requester",
          flaggedBy: "Moderator",
          timestamp: request.suspended_at || request.updated_at || request.created_at || new Date().toISOString(),
          status: "suspended",
          originalId: request.id,
          requestData: request
        }))

        // Combine all suspended content
        const allSuspendedContent = [...validContent, ...validSuspendedServices, ...validSuspendedRequests]

        // Ensure all activities have proper IDs
        const validActivity = (Array.isArray(activityData) ? activityData : []).map((act, index) => ({
          ...act,
          id: act.id || `activity-${index}`,
          action: act.action || "Unknown Action",
          description: act.description || "No description",
          timestamp: act.timestamp || new Date().toISOString(),
          moderator: act.moderator || "Unknown Moderator"
        }))
        
        // Set user data - load from real API with proper error handling
        try {
          // Try to load recent users using moderator permissions
          // Use moderator-specific function for recent users
          let recentUsersData = null
          
          try {
            // Use the new moderator-specific function
            recentUsersData = await getModeratorRecentUsers(moderatorUser?.accessToken)
          } catch (error) {
            console.log("Error loading recent users data:", error)
            
            // Alternative: Get user information from reports data
            // Extract unique user information from existing reports
            const usersFromReports = []
            const userEmails = new Set()
            
            validReports.forEach(report => {
              if (report.reportedUser && report.reportedUser !== "Unknown User" && !userEmails.has(report.reportedUser)) {
                userEmails.add(report.reportedUser)
                usersFromReports.push({
                  id: `user-${usersFromReports.length + 1}`,
                  username: report.reportedUser,
                  first_name: report.reportedUser.split(' ')[0] || report.reportedUser,
                  last_name: report.reportedUser.split(' ').slice(1).join(' ') || '',
                  email: `${report.reportedUser.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  joinedDate: report.timestamp || new Date().toISOString(),
                  role: "service_provider" // Default assumption
                })
              }
              
              if (report.reportedBy && report.reportedBy !== "System" && !userEmails.has(report.reportedBy)) {
                userEmails.add(report.reportedBy)
                usersFromReports.push({
                  id: `user-${usersFromReports.length + 1}`,
                  username: report.reportedBy,
                  first_name: report.reportedBy.split(' ')[0] || report.reportedBy,
                  last_name: report.reportedBy.split(' ').slice(1).join(' ') || '',
                  email: `${report.reportedBy.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  joinedDate: report.timestamp || new Date().toISOString(),
                  role: "service_seeker" // Default assumption
                })
              }
            })
            
            recentUsersData = { users: usersFromReports.slice(0, 5) }
          }
          
          const transformedRecentUsers = (recentUsersData?.users || recentUsersData || [])
            .slice(0, 5) // Get latest 5 users
            .map(user => ({
              id: user.id || user.user_id,
              username: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              joinedDate: user.date_joined || user.created_at || user.createdAt || user.joinDate,
              role: user.role
            }))
          
          setRecentUsers(transformedRecentUsers)
          
          // For flagged users, we'll get users who have been reported
          // Since there's no direct flagged users endpoint, we'll derive this from reports
          const flaggedUsersFromReports = []
          
          // Get unique reported users from pending reports
          const reportedUserIds = new Set()
          validReports.forEach(report => {
            if (report.reportedUser && report.reportedUser !== "Unknown User") {
              reportedUserIds.add(report.reportedUser)
            }
          })
          
          // Create flagged users list from reported users
          Array.from(reportedUserIds).forEach((username, index) => {
            const relatedReports = validReports.filter(r => r.reportedUser === username)
            flaggedUsersFromReports.push({
              id: `flagged-${index + 1}`,
              username: username,
              email: `${username.toLowerCase().replace(' ', '.')}@example.com`,
              flaggedReason: relatedReports[0]?.reason || "Multiple reports",
              flaggedDate: relatedReports[0]?.timestamp || new Date().toISOString(),
              reportCount: relatedReports.length,
              status: "flagged"
            })
          })
          
          setFlaggedUsers(flaggedUsersFromReports)
          
          // Load suspended users from the backend
          try {
            const suspendedUsersResponse = await getSuspendedUsers({ status: 'Suspended' })
            const suspendedUsersData = suspendedUsersResponse?.users || []
            setSuspendedUsers(suspendedUsersData)
            console.log(`Loaded ${suspendedUsersData?.length || 0} suspended users`)
            
            // Also load total users count
            const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
            const allUsersData = allUsersResponse?.users || []
            const totalUsersCount = allUsersResponse?.total_count || allUsersData?.length || 0
            console.log(`=== DASHBOARD DEBUG: Loaded ${totalUsersCount} total users ===`)
            console.log("All users data:", allUsersData?.slice(0, 3)) // Log first 3 users
            
            // Update stats with actual suspended users count and total users count
            console.log("=== DASHBOARD DEBUG: Setting stats ===")
            console.log("Suspended count:", suspendedUsersData?.length || 0)
            console.log("Total count:", totalUsersCount)
            
            setStats(prev => {
              const newStats = {
                ...prev,
                users: {
                  ...prev.users,
                  suspended: suspendedUsersData?.length || 0,
                  total: totalUsersCount
                }
              }
              console.log("=== DASHBOARD DEBUG: New stats being set ===", newStats)
              return newStats
            })
          } catch (suspendedError) {
            console.error("Error loading suspended users:", suspendedError)
            setSuspendedUsers([])
            
            // Try to get total users count even if suspended users failed
            try {
              const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
              const totalUsersCount = allUsersResponse?.total_count || allUsersResponse?.users?.length || 0
              
              // Set suspended count to 0 on error, but update total count
              setStats(prev => ({
                ...prev,
                users: {
                  ...prev.users,
                  suspended: 0,
                  total: totalUsersCount
                }
              }))
            } catch (totalUsersError) {
              console.error("Error loading total users count:", totalUsersError)
              // Set both counts to 0 on complete failure
              setStats(prev => ({
                ...prev,
                users: {
                  ...prev.users,
                  suspended: 0,
                  total: 0
                }
              }))
            }
          }
          
          console.log(`Loaded ${transformedRecentUsers.length} recent users and ${flaggedUsersFromReports.length} flagged users`)
          
        } catch (userError) {
          console.error("Error loading user data:", userError)
          
          // Fallback to mock data for user-specific data
          setFlaggedUsers([
            {
              id: 1,
              username: "problematic_user",
              email: "user1@example.com",
              flaggedReason: "Multiple spam reports",
              flaggedDate: new Date(Date.now() - 86400000).toISOString(),
              reportCount: 3,
              status: "flagged"
            }
          ])

          // Try to load suspended users even in error case
          try {
            const suspendedUsersResponse = await getSuspendedUsers({ status: 'Suspended' })
            const suspendedUsersData = suspendedUsersResponse?.users || []
            setSuspendedUsers(suspendedUsersData)
            
            // Also load total users count
            const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
            const totalUsersCount = allUsersResponse?.total_count || allUsersResponse?.users?.length || 0
            
            // Update stats with actual suspended users count and total count
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                suspended: suspendedUsersData?.length || 0,
                total: totalUsersCount
              }
            }))
          } catch (suspendedError) {
            console.error("Error loading suspended users in fallback:", suspendedError)
            setSuspendedUsers([])
            
            // Try to get total users count even if suspended users failed
            try {
              const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
              const totalUsersCount = allUsersResponse?.total_count || allUsersResponse?.users?.length || 0
              
              // Set suspended count to 0 on error, but update total count
              setStats(prev => ({
                ...prev,
                users: {
                  ...prev.users,
                  suspended: 0,
                  total: totalUsersCount
                }
              }))
            } catch (totalUsersError) {
              console.error("Error loading total users count in fallback:", totalUsersError)
              // Set both counts to 0 on complete failure
              setStats(prev => ({
                ...prev,
                users: {
                  ...prev.users,
                  suspended: 0,
                  total: 0
                }
              }))
            }
          }
          setRecentUsers([
            {
              id: 2,
              username: "test_user",
              email: "test@example.com",
              joinedDate: new Date().toISOString(),
              role: "service_seeker"
            }
          ])
        }
        
        setStats(statsData)
        setPendingReports(validReports)
        setUnderReviewReports(validUnderReviewReports)
        setFlaggedContent(allSuspendedContent)
        setRecentActivity(validActivity)

        // Set all services and requests for Quick Stats
        setAllServices(Array.isArray(allServicesData) ? allServicesData : [])
        setAllRequests(Array.isArray(allRequestsData) ? allRequestsData : [])

        // Update stats to include actual under review count and suspended content
        setStats(prev => ({
          ...prev,
          reports: {
            ...prev.reports,
            under_review: validUnderReviewReports.length,
            pending: validReports.length,
            total: prev.reports.total || (validReports.length + validUnderReviewReports.length + prev.reports.resolved)
          },
          content: {
            ...prev.content,
            flagged: allSuspendedContent.length,
            services: (Array.isArray(allServicesData) ? allServicesData.length : 0),
            comments: (Array.isArray(allRequestsData) ? allRequestsData.length : 0)
          }
        }))

      } catch (error) {
        console.error("Error loading moderator stats:", error)
        // Fallback to sample data if API calls fail
        setStats({
          reports: {
            pending: 3,
            resolved: 12,
            total: 15
          },
          users: {
            flagged: 2,
            suspended: 1,
            total: 156
          },
          content: {
            services: 45,
            comments: 128,
            flagged: 5
          }
        })
        
        // Fallback activity data
        setRecentActivity([
          {
            id: 1,
            action: "System Started",
            description: "Moderator dashboard initialized",
            timestamp: new Date().toISOString(),
            moderator: "System"
          }
        ])

        // Fallback user data
        setFlaggedUsers([
          {
            id: 1,
            username: "fallback_user",
            email: "fallback@example.com",
            flaggedReason: "Test data",
            flaggedDate: new Date().toISOString(),
            reportCount: 1,
            status: "flagged"
          }
        ])

        // Try to load suspended users even in final fallback
        try {
          const suspendedUsersResponse = await getSuspendedUsers({ status: 'Suspended' })
          const suspendedUsersData = suspendedUsersResponse?.users || []
          setSuspendedUsers(suspendedUsersData)
          
          // Also load total users count
          const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
          const totalUsersCount = allUsersResponse?.total_count || allUsersResponse?.users?.length || 0
          
          // Update stats with actual suspended users count and total count
          setStats(prev => ({
            ...prev,
            users: {
              ...prev.users,
              suspended: suspendedUsersData?.length || 0,
              total: totalUsersCount
            }
          }))
        } catch (suspendedError) {
          console.error("Error loading suspended users in final fallback:", suspendedError)
          setSuspendedUsers([])
          
          // Try to get total users count even if suspended users failed
          try {
            const allUsersResponse = await getSuspendedUsers({}) // No status filter = all users
            const totalUsersCount = allUsersResponse?.total_count || allUsersResponse?.users?.length || 0
            
            // Set suspended count to 0 on error, but update total count
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                suspended: 0,
                total: totalUsersCount
              }
            }))
          } catch (totalUsersError) {
            console.error("Error loading total users count in final fallback:", totalUsersError)
            // Set both counts to 0 on complete failure
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                suspended: 0,
                total: 0
              }
            }))
          }
        }
        setRecentUsers([
          {
            id: 2,
            username: "test_user",
            email: "test@example.com",
            joinedDate: new Date().toISOString(),
            role: "service_seeker"
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadModeratorStats()
  }, [moderatorUser])

  const handleReportAction = async (reportId, action, notes = "") => {
    try {
      // Use the actual API function with notes
      await updateReportStatus(reportId, action, notes)
      
      // Update local state
      setPendingReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: action }
            : report
        ).filter(report => report.status === "pending")
      )

      // Update stats - handle both pending and under review reports
      setStats(prev => {
        // Check if this is a pending report or under review report
        const isPendingReport = pendingReports.some(r => r.id === reportId)
        const isUnderReviewReport = underReviewReports.some(r => r.id === reportId)
        
        let updatedStats = { ...prev.reports }
        
        if (isPendingReport) {
          updatedStats.pending = prev.reports.pending - 1
        } else if (isUnderReviewReport) {
          updatedStats.under_review = prev.reports.under_review - 1
        }
        
        if (action === "resolved") {
          updatedStats.resolved = prev.reports.resolved + 1
        }
        
        return {
          ...prev,
          reports: updatedStats
        }
      })

      console.log(`Report ${reportId} ${action} successfully`)

    } catch (error) {
      console.error(`Error ${action} report:`, error)
      alert(`Failed to ${action} report: ${error.message}`)
    }
  }

  const handleInvestigateReport = async (report) => {
    try {
      setIsInvestigating(true)
      
      // Update report status to under_review
      await updateReportStatus(report.id, "under_review", moderatorUser?.accessToken)
      
      // Update local state to reflect status change and remove from pending list
      setPendingReports(prev => 
        prev.filter(r => r.id !== report.id)
      )

      // Add to under review list (check if not already exists)
      const underReviewReport = {...report, status: "under_review", reviewStarted: new Date().toISOString()}
      setUnderReviewReports(prev => {
        // Check if report already exists in under review list
        const exists = prev.some(r => r.id === underReviewReport.id)
        if (exists) {
          return prev // Don't add duplicate
        }
        return [...prev, underReviewReport]
      })

      // Update stats to reflect one less pending report and one more under review
      setStats(prev => ({
        ...prev,
        reports: {
          ...prev.reports,
          pending: prev.reports.pending - 1,
          under_review: prev.reports.under_review + 1
        }
      }))

      // Fetch service details if report is about a service
      let serviceDetails = null
      if (report.reported_service_id) {
        try {
          serviceDetails = await getServiceById(report.reported_service_id)
        } catch (error) {
          console.warn(`Failed to fetch service details for service ID ${report.reported_service_id}:`, error)
        }
      }

      // Set selected report, service, and show modal
      setSelectedReport(underReviewReport)
      setSelectedService(serviceDetails)
      setShowInvestigationModal(true)
      
      console.log(`Report ${report.id} status changed to under_review`)

    } catch (error) {
      console.error(`Error updating report status:`, error)
      alert(`Failed to update report status: ${error.message}`)
    } finally {
      setIsInvestigating(false)
    }
  }

  const handleContentAction = async (contentId, action) => {
    try {
      // Find the content item to determine its type
      const contentItem = flaggedContent.find(item => item.originalId === contentId || item.id === contentId)
      
      if (!contentItem) {
        throw new Error("Content not found")
      }

      let apiResponse
      
      // Handle different content types and actions
      if (contentItem.type === "Service") {
        // Use service moderation API
        if (action === "unsuspend") {
          apiResponse = await moderateService(contentId, "activate", moderatorUser?.accessToken)
        } else if (action === "permanently_remove") {
          apiResponse = await moderateService(contentId, "delete", moderatorUser?.accessToken)
        }
      } else if (contentItem.type === "Request") {
        // Use request moderation API
        if (action === "unsuspend") {
          apiResponse = await moderateRequest(contentId, "activate", moderatorUser?.accessToken)
        } else if (action === "permanently_remove") {
          apiResponse = await moderateRequest(contentId, "delete", moderatorUser?.accessToken)
        }
      } else {
        // For other content types, use the original moderateContent function
        apiResponse = await moderateContent(contentId, action, moderatorUser?.accessToken)
      }
      
      // Update local state - remove the item from suspended content
      setFlaggedContent(prev => 
        prev.filter(content => content.originalId !== contentId && content.id !== contentId)
      )

      // Update stats
      setStats(prev => ({
        ...prev,
        content: {
          ...prev.content,
          flagged: prev.content.flagged - 1
        }
      }))

      console.log(`Content ${contentId} ${action} successfully`)

    } catch (error) {
      console.error(`Error ${action} content:`, error)
      alert(`Failed to ${action} content: ${error.message}`)
    }
  }

  const handleUserAction = async (userId, action) => {
    if (processingUserId === userId) return
    
    setProcessingUserId(userId)
    try {
      // Use real API call for user moderation actions
      // This endpoint may need to be implemented on the backend
      const response = await fetch(`http://localhost:8000/api/v1/moderators/users/${userId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${moderatorUser?.accessToken}`
        },
        body: JSON.stringify({
          action: action,
          reason: `Moderator action: ${action}`,
          moderator_id: moderatorUser?.user_id || moderatorUser?.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`User ${userId} ${action}ed successfully:`, result)
        
        // Update local state based on action
        if (action === 'suspend') {
          setFlaggedUsers(prev => prev.filter(user => user.id !== userId))
          // Refresh suspended users list from backend
          try {
            const updatedSuspendedUsersResponse = await getSuspendedUsers({ status: 'Suspended' })
            const updatedSuspendedUsers = updatedSuspendedUsersResponse?.users || []
            setSuspendedUsers(updatedSuspendedUsers)
            
            // Update stats with actual count
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                flagged: prev.users.flagged - 1,
                suspended: updatedSuspendedUsers?.length || 0
              }
            }))
          } catch (refreshError) {
            console.error("Error refreshing suspended users:", refreshError)
          }
        } else if (action === 'unsuspend') {
          // Refresh suspended users list from backend
          try {
            const updatedSuspendedUsersResponse = await getSuspendedUsers({ status: 'Suspended' })
            const updatedSuspendedUsers = updatedSuspendedUsersResponse?.users || []
            setSuspendedUsers(updatedSuspendedUsers)
            
            // Update stats with actual count
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                suspended: updatedSuspendedUsers?.length || 0
              }
            }))
          } catch (refreshError) {
            console.error("Error refreshing suspended users:", refreshError)
          }
        } else if (action === 'activate') {
          // User status changed from deactivated to active - no specific local state updates needed
          console.log(`User ${userId} activated successfully`)
        } else if (action === 'deactivate') {
          // User status changed from active to deactivated - no specific local state updates needed
          console.log(`User ${userId} deactivated successfully`)
        } else if (action === 'unflag' || action === 'flag') {
          if (action === 'unflag') {
            setFlaggedUsers(prev => prev.filter(user => user.id !== userId))
            setStats(prev => ({
              ...prev,
              users: {
                ...prev.users,
                flagged: prev.users.flagged - 1
              }
            }))
          }
        }
        
        // Refresh user lists if the search dialog is open
        if (showUserSearch && allUsers.length > 0) {
          await loadAllUsers()
        }
        
      } else {
        // Handle HTTP error responses
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to ${action} user`)
      }

    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      
      // Check if it's a network error or API not implemented
      if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        alert(`Unable to connect to server. ${action} action will be applied locally for now.`)
        
        // Apply local state changes as fallback
        if (action === 'suspend') {
          setFlaggedUsers(prev => prev.filter(user => user.id !== userId))
          const userToSuspend = flaggedUsers.find(user => user.id === userId)
          if (userToSuspend) {
            setSuspendedUsers(prev => [...prev, {
              ...userToSuspend,
              status: "suspended",
              suspendedReason: "Moderator action (offline)",
              suspendedDate: new Date().toISOString(),
              suspendedBy: moderatorUser?.email || "Moderator"
            }])
          }
        } else if (action === 'unsuspend') {
          setSuspendedUsers(prev => prev.filter(user => user.id !== userId))
        } else if (action === 'activate' || action === 'deactivate') {
          console.log(`${action} action applied locally for user ${userId}`)
        } else if (action === 'unflag') {
          setFlaggedUsers(prev => prev.filter(user => user.id !== userId))
        }
      } else {
        alert(`Failed to ${action} user: ${error.message}`)
      }
    } finally {
      setProcessingUserId(null)
    }
  }

  // User search and management functions
  const loadAllUsers = async () => {
    setSearchLoading(true)
    try {
      // Use moderator-specific user function first, fallback to admin if needed
      let usersData = null
      
      try {
        // Try the new moderator-specific function
        const searchParams = {
          search: searchTerm,
          role: statusFilter === 'providers' ? 'service_provider' : 
                statusFilter === 'seekers' ? 'service_seeker' : 
                statusFilter === 'all' ? undefined : undefined,
          status: statusFilter === 'verified' ? 'verified' : 
                  statusFilter === 'unverified' ? 'unverified' : 
                  statusFilter === 'flagged' ? 'flagged' :
                  statusFilter === 'all' ? undefined : undefined,
          limit: 100
        }
        
        console.log("Loading users with moderator token:", moderatorUser?.accessToken ? "Token available" : "No token")
        console.log("Search params:", searchParams)
        
        usersData = await getModeratorUsers(moderatorUser?.accessToken, searchParams)
        console.log("Successfully loaded users using moderator endpoint:", usersData)
        
      } catch (moderatorError) {
        console.log("Moderator users function failed, trying admin endpoint:", moderatorError)
        
        try {
          // Fallback to admin endpoint
          const searchParams = {
            search: searchTerm,
            role: statusFilter === 'providers' ? 'service_provider' : 
                  statusFilter === 'seekers' ? 'service_seeker' : 
                  statusFilter === 'all' ? undefined : undefined,
            status: statusFilter === 'verified' ? 'verified' : 
                    statusFilter === 'unverified' ? 'unverified' : 
                    statusFilter === 'all' ? undefined : undefined,
            limit: 100
          }
          
          usersData = await getModeratorUsers(moderatorUser?.accessToken, searchParams)
          
        } catch (error) {
          console.log("Error loading users data, creating user list from available data")
          
          // Create a user list from reports data and any other available information
          const usersFromReports = []
          const userMap = new Map()
          
          // Get users from pending reports
          pendingReports.forEach(report => {
            if (report.reportedUser && report.reportedUser !== "Unknown User") {
              const userId = `reported-${report.reportedUser.replace(/\s+/g, '-')}`
              if (!userMap.has(userId)) {
                userMap.set(userId, {
                  id: userId,
                  first_name: report.reportedUser.split(' ')[0] || report.reportedUser,
                  last_name: report.reportedUser.split(' ').slice(1).join(' ') || '',
                  email: `${report.reportedUser.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  phone_number: null,
                  location: "Location not available",
                  role: "service_provider", // Default
                  isVerified: false, // Default
                  created_at: report.timestamp || new Date().toISOString(),
                  profile: {
                    rating: null,
                    reviewCount: 0,
                    bio: "User information from reports"
                  }
                })
              }
            }
            
            if (report.reportedBy && report.reportedBy !== "System") {
              const userId = `reporter-${report.reportedBy.replace(/\s+/g, '-')}`
              if (!userMap.has(userId)) {
                userMap.set(userId, {
                  id: userId,
                  first_name: report.reportedBy.split(' ')[0] || report.reportedBy,
                  last_name: report.reportedBy.split(' ').slice(1).join(' ') || '',
                  email: `${report.reportedBy.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                  phone_number: null,
                  location: "Location not available",
                  role: "service_seeker", // Default
                  isVerified: false, // Default
                  created_at: report.timestamp || new Date().toISOString(),
                  profile: {
                    rating: null,
                    reviewCount: 0,
                    bio: "User information from reports"
                  }
                })
              }
            }
          })
          
          // Add some sample users if we don't have enough data
          if (userMap.size < 3) {
            const sampleUsers = [
              {
                id: "sample-1",
                first_name: "John",
                last_name: "Doe",
                email: "john.doe@example.com",
                phone_number: "+1234567890",
                location: "New York, NY",
                role: "service_provider",
                isVerified: true,
                created_at: "2024-01-15T10:00:00Z",
                profile: {
                  rating: 4.8,
                  reviewCount: 25,
                  bio: "Professional handyman"
                }
              },
              {
                id: "sample-2",
                first_name: "Jane",
                last_name: "Smith",
                email: "jane.smith@example.com",
                phone_number: "+1987654321",
                location: "Los Angeles, CA",
                role: "service_seeker",
                isVerified: false,
                created_at: "2024-02-20T14:30:00Z",
                profile: {
                  rating: null,
                  reviewCount: 0,
                  bio: null
                }
              }
            ]
            
            sampleUsers.forEach(user => {
              userMap.set(user.id, user)
            })
          }
          
          usersData = { users: Array.from(userMap.values()) }
        }
      }
      
      // Transform the data to ensure consistent format
      const transformedUsers = (usersData?.users || usersData || []).map(user => ({
        id: user.id || user.user_id,
        first_name: user.first_name || user.firstName,
        last_name: user.last_name || user.lastName,
        email: user.email,
        phone_number: user.phone_number || user.phone,
        location: user.location?.city ? `${user.location.city}, ${user.location.state}` : user.location,
        role: user.role,
        status: user.status || 'Active', // Use status instead of isVerified
        date_joined: user.date_joined || user.created_at || user.createdAt || user.joinDate, // Use date_joined field
        profile: {
          rating: user.profile?.rating || user.rating,
          reviewCount: user.profile?.reviewCount || user.review_count || 0,
          bio: user.profile?.bio || user.bio,
          skills: user.profile?.skills || user.skills || []
        }
      }))
      
      setAllUsers(transformedUsers)
      setFilteredUsers(transformedUsers)
      
      if (usersData?.note) {
        console.log("Note:", usersData.note)
      }
      
      console.log(`Loaded ${transformedUsers.length} users for moderation`)
      
    } catch (error) {
      console.error("Error loading users:", error)
      
      // Final fallback to mock data if everything fails
      const mockUsers = [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone_number: "+1234567890",
          location: "New York, NY",
          role: "service_provider",
          isVerified: true,
          created_at: "2024-01-15T10:00:00Z",
          profile: {
            rating: 4.8,
            reviewCount: 25,
            bio: "Professional handyman with 10 years experience"
          }
        },
        {
          id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@example.com",
          phone_number: "+1987654321",
          location: "Los Angeles, CA",
          role: "service_seeker",
          isVerified: false,
          created_at: "2024-02-20T14:30:00Z",
          profile: {
            rating: null,
            reviewCount: 0
          }
        }
      ]
      
      setAllUsers(mockUsers)
      setFilteredUsers(mockUsers)
      
      // Show user-friendly error message
      console.log("Using sample data due to connectivity issues")
      
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchUsers = () => {
    setShowUserSearch(true)
    if (allUsers.length === 0) {
      loadAllUsers()
    }
  }

  const filterAndSortUsers = () => {
    let filtered = [...allUsers]

    // Apply search filter (this is now handled by the API, but we keep it for client-side refinement)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone_number?.includes(term) ||
        user.location?.toLowerCase().includes(term)
      )
    }

    // Apply status filter (also handled by API, but kept for client-side refinement)
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case "active":
            return user.status === "Active"
          case "suspended":
            return user.status === "Suspended"
          case "deactivated":
            return user.status === "Deactivated"
          case "providers":
            return user.role === "service_provider"
          case "seekers":
            return user.role === "service_seeker"
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date_joined) - new Date(a.date_joined)
        case "oldest":
          return new Date(a.date_joined) - new Date(b.date_joined)
        case "name":
          return (a.first_name || "").localeCompare(b.first_name || "")
        case "email":
          return (a.email || "").localeCompare(b.email || "")
        case "rating":
          return (b.profile?.rating || 0) - (a.profile?.rating || 0)
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }

  // Trigger API reload when search term or filter changes (debounced)
  useEffect(() => {
    if (!showUserSearch || !moderatorUser) return
    
    const timeoutId = setTimeout(() => {
      if (allUsers.length === 0 || searchTerm !== '' || statusFilter !== 'all') {
        loadAllUsers() // This will trigger a new API call with current filters
      } else {
        filterAndSortUsers() // Just filter/sort existing data
      }
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter])

  // Filter users when sort changes (no need for API call)
  useEffect(() => {
    if (allUsers.length > 0) {
      filterAndSortUsers()
    }
  }, [sortBy, allUsers])

  // Content management functions
  const loadAllContent = async () => {
    setContentLoading(true)
    try {
      // Use the new moderator-specific endpoints
      const filters = {
        status: contentStatusFilter !== 'all' ? contentStatusFilter : undefined,
        search: contentSearchTerm || undefined
      }
      
      const [servicesData, requestsData] = await Promise.all([
        getModeratorServices(filters),
        getModeratorRequests(filters)
      ])

      // Transform services (data should already be in the right format from the API)
      const transformedServices = (servicesData || []).map(service => ({
        id: service.id,
        title: service.title,
        description: service.description,
        provider: service.creator_name || "Unknown Provider",
        provider_id: service.creator_id,
        category: service.category,
        location: service.location,
        status: service.status || "active",
        created_at: service.created_at,
        type: "service"
      }))

      // Transform requests
      const transformedRequests = (requestsData || []).map(request => ({
        id: request.id,
        title: request.title,
        description: request.description,
        requester: request.creator_name || "Unknown Requester",
        requester_id: request.creator_id,
        category: request.category,
        budget: request.budget,
        location: request.location,
        status: request.status || "active",
        created_at: request.created_at,
        type: "request"
      }))

      setAllServices(transformedServices)
      setAllRequests(transformedRequests)
      
      // Combine all content
      const allContent = [...transformedServices, ...transformedRequests]
      setFilteredContent(allContent)

      console.log(`Loaded ${transformedServices.length} services and ${transformedRequests.length} requests`)

    } catch (error) {
      console.error("Error loading content:", error)
      
      // Fallback to mock data
      const mockServices = [
        {
          id: 1,
          title: "House Cleaning Service",
          description: "Professional house cleaning with eco-friendly products",
          provider: "John Smith",
          provider_id: 1,
          category: "Cleaning",
          price: 50,
          location: "New York, NY",
          status: "active",
          created_at: "2024-01-15T10:00:00Z",
          type: "service"
        }
      ]
      
      const mockRequests = [
        {
          id: 1,
          title: "Need a Plumber",
          description: "Kitchen sink is leaking and needs repair",
          requester: "Jane Doe",
          requester_id: 2,
          category: "Plumbing",
          budget: 100,
          location: "Los Angeles, CA",
          status: "open",
          created_at: "2024-02-01T14:00:00Z",
          type: "request"
        }
      ]

      setAllServices(mockServices)
      setAllRequests(mockRequests)
      setFilteredContent([...mockServices, ...mockRequests])
      
    } finally {
      setContentLoading(false)
    }
  }

  const handleSearchContent = () => {
    setShowContentSearch(true)
    if (allServices.length === 0 && allRequests.length === 0) {
      loadAllContent()
    }
  }

  const filterAndSortContent = () => {
    let filtered = [...allServices, ...allRequests]

    // Apply search filter
    if (contentSearchTerm) {
      const term = contentSearchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.provider?.toLowerCase().includes(term) ||
        item.requester?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term)
      )
    }

    // Apply type filter
    if (contentTypeFilter !== "all") {
      filtered = filtered.filter(item => item.type === contentTypeFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (contentSortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at)
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at)
        case "title":
          return (a.title || "").localeCompare(b.title || "")
        case "category":
          return (a.category || "").localeCompare(b.category || "")
        default:
          return 0
      }
    })

    setFilteredContent(filtered)
  }

  const handleContentManagementAction = async (contentId, action, contentType) => {
    if (processingContentId === contentId) return
    
    setProcessingContentId(contentId)
    try {
      let result
      
      if (contentType === 'service') {
        result = await moderateService(contentId, action)
      } else {
        result = await moderateRequest(contentId, action)
      }
      
      if (action === 'delete') {
        // Remove from local state
        if (contentType === 'service') {
          setAllServices(prev => prev.filter(service => service.id !== contentId))
        } else {
          setAllRequests(prev => prev.filter(request => request.id !== contentId))
        }
        setFilteredContent(prev => prev.filter(item => item.id !== contentId))
      } else {
        // Update status in local state
        const newStatus = result.new_status
        if (contentType === 'service') {
          setAllServices(prev => prev.map(service => 
            service.id === contentId ? { ...service, status: newStatus } : service
          ))
        } else {
          setAllRequests(prev => prev.map(request => 
            request.id === contentId ? { ...request, status: newStatus } : request
          ))
        }
        // Refresh filtered content
        filterAndSortContent()
      }

      console.log(`Content ${contentId} ${action}ed successfully`)
        
    } catch (error) {
      console.error(`Error ${action}ing content:`, error)
      alert(`Failed to ${action} content: ${error.message}`)
    } finally {
      setProcessingContentId(null)
    }
  }

  // Content search effect
  useEffect(() => {
    if (!showContentSearch || !moderatorUser) return
    
    const timeoutId = setTimeout(() => {
      if ((allServices.length === 0 && allRequests.length === 0) || contentSearchTerm !== '' || contentTypeFilter !== 'all') {
        loadAllContent()
      } else {
        filterAndSortContent()
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [contentSearchTerm, contentTypeFilter, contentStatusFilter])

  // Content sort effect
  useEffect(() => {
    if (allServices.length > 0 || allRequests.length > 0) {
      filterAndSortContent()
    }
  }, [contentSortBy, allServices, allRequests])

  // Helper functions
  const getUserDisplayName = (user) => {
    if (!user) return "Unknown User"
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Unknown User"
  }

  const getUserStatusBadge = (user) => {
    if (!user) return null
    
    const status = user.status || 'Active'
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case 'deactivated':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Deactivated</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
    }
  }

  const getRoleBadge = (role) => {
    if (role === "service_provider") {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Provider</Badge>
    } else if (role === "service_seeker") {
      return <Badge variant="outline">Seeker</Badge>
    }
    return null
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown"
    return formatDateOnlyIST(dateString)
  }

  const handleLogout = () => {
    logoutModerator()
    router.push("/moderator/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading moderator dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">TimeNest Moderator</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Moderator
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {moderatorUser?.name || "Moderator"}
              </span>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Moderator Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and moderate content, users, and reports on the TimeNest platform
          </p>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Pending Reports */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pending Reports ({pendingReports.length})
                </CardTitle>
                <CardDescription>
                  Reports requiring immediate attention and review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending reports</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReports.map(report => (
                      <div key={report.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {/* <Badge className={
                                report.severity === "High" ? "bg-red-100 text-red-800" :
                                report.severity === "Medium" ? "bg-orange-100 text-orange-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {report.severity}
                              </Badge> */}
                              <span className="font-medium">{report.type}</span>
                              {report.admin_notes && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Has Notes
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reported User:</strong> {report.reportedUser}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reported By:</strong> {report.reportedBy}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {report.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Submitted: {formatDateIST(report.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReportAction(report.id, "dismissed")}
                            className="text-gray-600 border-gray-200 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleInvestigateReport(report)}
                            disabled={isInvestigating}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {isInvestigating ? "Investigating..." : "Investigate"}
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleReportAction(report.id, "resolved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Under Review Reports */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Under Review ({underReviewReports.length})
                </CardTitle>
                <CardDescription>
                  Reports currently being investigated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {underReviewReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports under review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {underReviewReports.map(report => (
                      <div key={report.id} className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-100 text-orange-800">
                                Under Review
                              </Badge>
                              {/* <Badge className={
                                report.severity === "High" ? "bg-red-100 text-red-800" :
                                report.severity === "Medium" ? "bg-orange-100 text-orange-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {report.severity}
                              </Badge> */}
                              <span className="font-medium">{report.type}</span>
                              {report.admin_notes && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Has Notes
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reported User:</strong> {report.reportedUser}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reported By:</strong> {report.reportedBy}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {report.description}
                            </p>
                            <div className="flex gap-4 mt-2">
                              <p className="text-xs text-gray-500">
                                Submitted: {formatDateIST(report.created_at)}
                              </p>
                              {report.reviewStarted && (
                                <p className="text-xs text-orange-600">
                                  Review Started: {formatDateIST(report.reviewStarted)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report)
                              setShowInvestigationModal(true)
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Continue Investigation
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              handleReportAction(report.id, "resolved")
                              setUnderReviewReports(prev => prev.filter(r => r.id !== report.id))
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-blue-600">{stats.reports.total}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-orange-600">{stats.reports.pending}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-purple-600">{stats.reports.under_review}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-green-600">{stats.reports.resolved}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Content Management & Stats */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Content Overview & Management
                </CardTitle>
                <CardDescription>
                  Platform content statistics and management actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Platform Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Services:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{allServices.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Requests:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{allRequests.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Suspended Content:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{flaggedContent.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Management Actions Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Management Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleSearchContent}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search Services & Requests
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suspended Content */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Suspended Content ({flaggedContent.length})
                </CardTitle>
                <CardDescription>
                  Content that has been suspended by moderators and requires review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suspended content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedContent.map(content => (
                      <div key={content.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={
                                content.type === "Service" ? "bg-blue-100 text-blue-800" :
                                content.type === "Request" ? "bg-green-100 text-green-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {content.type}
                              </Badge>
                              <span className="font-medium">
                                {content.title}
                              </span>
                              {content.status === "suspended" && (
                                <Badge variant="destructive" className="ml-2">
                                  Suspended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Author:</strong> {content.author}
                            </p>
                            {content.content && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                <strong>Description:</strong> "{content.content.substring(0, 100)}{content.content.length > 100 ? '...' : ''}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Suspended: {formatDateIST(content.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContentAction(content.originalId || content.id, "unsuspend")}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Unsuspend
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContentAction(content.originalId || content.id, "permanently_remove")}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove Permanently
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Statistics */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-blue-600">{stats.content.services}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Services</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-green-600">{stats.content.comments}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">User Comments</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-red-600">{stats.content.flagged}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Flagged Items</p>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* User Management */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management & Oversight
                </CardTitle>
                <CardDescription>
                  Manage user actions and view suspended accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Moderation Actions Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={handleSearchUsers}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search Users
                      </Button>
                    </div>
                  </div>
                  
                  {/* Suspended Users Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suspended Users</h3>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {suspendedUsers.length} users
                      </Badge>
                    </div>
                    {suspendedUsers.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No suspended users</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {suspendedUsers.map(user => (
                          <div key={user.id} className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    Suspended
                                  </Badge>
                                  <span className="text-sm font-medium">{user.username}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  {user.email}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDateIST(user.suspendedDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleUserAction(user.id, "unsuspend")}
                                disabled={processingUserId === user.id}
                                className="bg-green-600 hover:bg-green-700 h-7 px-2"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Unsuspend
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-blue-600">{stats.users.total}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-red-600">{stats.users.suspended}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* Recent Activity */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Moderation Activity
                </CardTitle>
                <CardDescription>
                  Your recent moderation actions and system activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{activity.action}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDateIST(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Moderation Guidelines */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Moderation Guidelines
                </CardTitle>
                <CardDescription>
                  Quick reference for moderation policies and procedures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Content Policy</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• No inappropriate language</li>
                      <li>• No spam or repetitive content</li>
                      <li>• No misleading information</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">User Conduct</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>• Respectful communication</li>
                      <li>• No harassment or abuse</li>
                      <li>• Honor service commitments</li>
                    </ul>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Guidelines
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Search Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              User Search & Management
            </DialogTitle>
            <DialogDescription>
              Search, view, and moderate users on the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name, email, phone, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="email">Email A-Z</SelectItem>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadAllUsers} disabled={searchLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Users ({filteredUsers.length})
                  {searchLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar} alt={getUserDisplayName(user)} />
                                <AvatarFallback>
                                  {getUserDisplayName(user).split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{getUserDisplayName(user)}</h4>
                                  {getUserStatusBadge(user)}
                                  {getRoleBadge(user.role)}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-2" />
                                    {user.email}
                                  </div>
                                  {user.phone_number && (
                                    <div className="flex items-center">
                                      <Phone className="h-3 w-3 mr-2" />
                                      {user.phone_number}
                                    </div>
                                  )}
                                  {user.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-3 w-3 mr-2" />
                                      {user.location}
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-2" />
                                    Joined: {user.date_joined ? formatDate(user.date_joined) : 'N/A'}
                                  </div>
                                  {user.profile?.rating && (
                                    <div className="flex items-center">
                                      <Star className="h-3 w-3 mr-2 text-yellow-400" />
                                      {user.profile.rating} ({user.profile.reviewCount} reviews)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>User Details</DialogTitle>
                                    <DialogDescription>
                                      Complete information about {getUserDisplayName(selectedUser)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-6">
                                      <div className="flex items-center space-x-4">
                                        <Avatar className="h-16 w-16">
                                          <AvatarImage src={selectedUser.avatar} alt={getUserDisplayName(selectedUser)} />
                                          <AvatarFallback className="text-lg">
                                            {getUserDisplayName(selectedUser).split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <h3 className="text-lg font-semibold">{getUserDisplayName(selectedUser)}</h3>
                                          <div className="flex items-center space-x-2 mt-1">
                                            {getUserStatusBadge(selectedUser)}
                                            {getRoleBadge(selectedUser.role)}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <h4 className="font-medium mb-2">Contact Information</h4>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center">
                                              <Mail className="h-4 w-4 mr-2" />
                                              {selectedUser.email}
                                            </div>
                                            {selectedUser.phone_number && (
                                              <div className="flex items-center">
                                                <Phone className="h-4 w-4 mr-2" />
                                                {selectedUser.phone_number}
                                              </div>
                                            )}
                                            {selectedUser.location && (
                                              <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {selectedUser.location}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="font-medium mb-2">Account Information</h4>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex items-center">
                                              <Calendar className="h-4 w-4 mr-2" />
                                              Joined: {formatDate(selectedUser.created_at)}
                                            </div>
                                            {selectedUser.profile?.rating && (
                                              <div className="flex items-center">
                                                <Star className="h-4 w-4 mr-2" />
                                                Rating: {selectedUser.profile.rating} ({selectedUser.profile.reviewCount} reviews)
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {selectedUser.profile?.bio && (
                                        <div>
                                          <h4 className="font-medium mb-2">Bio</h4>
                                          <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {selectedUser.profile.bio}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <div className="flex gap-1">
                                {user.status?.toLowerCase() === 'suspended' ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUserAction(user.id, 'unsuspend')}
                                    disabled={processingUserId === user.id}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                ) : user.status?.toLowerCase() === 'deactivated' ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUserAction(user.id, 'activate')}
                                    disabled={processingUserId === user.id}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleUserAction(user.id, 'suspend')}
                                    disabled={processingUserId === user.id}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Search Dialog */}
      <Dialog open={showContentSearch} onOpenChange={setShowContentSearch}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Content Search & Management
            </DialogTitle>
            <DialogDescription>
              Search, view, and moderate services and requests on the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search content by title, description, provider, category..."
                      value={contentSearchTerm}
                      onChange={(e) => setContentSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Content</SelectItem>
                      <SelectItem value="service">Services</SelectItem>
                      <SelectItem value="request">Requests</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={contentStatusFilter} onValueChange={setContentStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={contentSortBy} onValueChange={setContentSortBy}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                      <SelectItem value="category">Category A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadAllContent} disabled={contentLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content List */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Content ({filteredContent.length})
                  {contentLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {contentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading content...</span>
                    </div>
                  ) : filteredContent.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No content found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search or filter criteria.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredContent.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={item.type === 'service' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                  {item.type === 'service' ? 'Service' : 'Request'}
                                </Badge>
                                <Badge variant="outline" className={
                                  item.status === 'active' ? 'bg-green-50 text-green-700' :
                                  item.status === 'suspended' ? 'bg-red-50 text-red-700' :
                                  item.status === 'closed' ? 'bg-gray-50 text-gray-700' :
                                  'bg-gray-50 text-gray-700'
                                }>
                                  {item.status}
                                </Badge>
                                <h4 className="font-medium">{item.title}</h4>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <p className="mb-2">{item.description}</p>
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-2" />
                                  {item.type === 'service' ? item.provider : item.requester}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-2" />
                                  {item.location || 'Location not specified'}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2" />
                                  {item.category}
                                </div>
                                {item.type === 'service' && item.price && (
                                  <div className="flex items-center">
                                    <span className="h-3 w-3 mr-2">$</span>
                                    ${item.price}
                                  </div>
                                )}
                                {item.type === 'request' && item.budget && (
                                  <div className="flex items-center">
                                    <span className="h-3 w-3 mr-2">$</span>
                                    Budget: ${item.budget}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2" />
                                  Created: {formatDate(item.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              
                              <div className="flex gap-1">
                                {/* Activate button - show for suspended or closed content */}
                                {(item.status === 'suspended' || item.status === 'closed') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleContentManagementAction(item.id, 'activate', item.type)}
                                    disabled={processingContentId === item.id}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    title="Activate"
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* Suspend button - show for active content */}
                                {item.status === 'active' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleContentManagementAction(item.id, 'suspend', item.type)}
                                    disabled={processingContentId === item.id}
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                    title="Suspend"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* Close button - show for active or suspended content */}
                                {(item.status === 'active' || item.status === 'suspended') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleContentManagementAction(item.id, 'close', item.type)}
                                    disabled={processingContentId === item.id}
                                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                    title="Close"
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* Delete button - always available */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleContentManagementAction(item.id, 'delete', item.type)}
                                  disabled={processingContentId === item.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Investigation Modal */}
      <Dialog open={showInvestigationModal} onOpenChange={(open) => {
        setShowInvestigationModal(open)
        if (!open) {
          setSelectedService(null)
          setInvestigationNotes("")
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Report Investigation
            </DialogTitle>
            <DialogDescription>
              Detailed view of the report for investigation. Status has been updated to "Under Review".
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Report Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Report ID</Label>
                      <p className="text-sm font-mono">{selectedReport.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge className="ml-2 bg-orange-100 text-orange-800">Under Review</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Report Type</Label>
                      <p className="text-sm">{selectedReport.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                      <p className="text-sm">{formatDateIST(selectedReport.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Reporter</Label>
                      <p className="text-sm">{selectedReport.reportedBy}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reported User Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reported User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedReport.reportedUserAvatar} />
                      <AvatarFallback>
                        {selectedReport.reportedUser?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium">{selectedReport.reportedUser}</h3>
                      <p className="text-sm text-gray-600">{selectedReport.reportedUserEmail || 'Email not available'}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="outline">{selectedReport.reportedUserRole || 'User'}</Badge>
                        {selectedReport.reportedUserJoinDate && (
                          <Badge variant="outline">
                            Joined {formatDateOnlyIST(selectedReport.reportedUserJoinDate)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                  </div>
                  
                  {selectedReport.additionalDetails && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Additional Details</Label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedReport.additionalDetails}</p>
                      </div>
                    </div>
                  )}

                  {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Attachments</Label>
                      <div className="mt-1 space-y-2">
                        {selectedReport.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{attachment.name}</span>
                            <Button variant="outline" size="sm" className="ml-auto">
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Details - Only show if report is about a service */}
              {selectedService && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reported Service Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Service Title</Label>
                        <p className="text-sm font-medium">{selectedService.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Provider</Label>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedService.providerImage} />
                            <AvatarFallback>
                              {selectedService.provider?.charAt(0)?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{selectedService.provider}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Category</Label>
                        <Badge variant="outline">{selectedService.category}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Time Credits</Label>
                        <p className="text-sm">{selectedService.timeCredits} credits</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Location</Label>
                        <p className="text-sm">{selectedService.location}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Rating</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{selectedService.rating}</span>
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-500">({selectedService.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Service Description</Label>
                      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm">{selectedService.description}</p>
                      </div>
                    </div>

                    {selectedService.tags && selectedService.tags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedService.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">What's Included</Label>
                        <p className="text-sm text-gray-700">{selectedService.whatIncluded}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Requirements</Label>
                        <p className="text-sm text-gray-700">{selectedService.requirements}</p>
                      </div>
                    </div>

                    {selectedService.availability && selectedService.availability.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Availability</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedService.availability.map((slot, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Investigation Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investigation Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Display existing notes if available */}
                    {selectedReport.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Previous Investigation Notes</Label>
                        <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-100">
                            {selectedReport.admin_notes}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Last updated: {selectedReport.updated_at_display || formatDateIST(selectedReport.updated_at || selectedReport.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="investigation-notes">
                        {selectedReport.admin_notes ? "Add Additional Investigation Notes" : "Add Investigation Notes"}
                      </Label>
                      <textarea
                        id="investigation-notes"
                        className="mt-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Add your investigation findings, actions taken, or notes for future reference..."
                        value={investigationNotes}
                        onChange={(e) => setInvestigationNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    // Combine existing notes with new notes
                    let combinedNotes = investigationNotes
                    if (selectedReport.admin_notes && investigationNotes.trim()) {
                      combinedNotes = selectedReport.admin_notes + '\n\n--- Additional Notes ---\n' + investigationNotes
                    } else if (selectedReport.admin_notes && !investigationNotes.trim()) {
                      combinedNotes = selectedReport.admin_notes
                    }
                    
                    handleReportAction(selectedReport.id, "resolved", combinedNotes)
                    // Remove from under review list
                    setUnderReviewReports(prev => prev.filter(r => r.id !== selectedReport.id))
                    setShowInvestigationModal(false)
                    setInvestigationNotes("")
                    setSelectedService(null)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Combine existing notes with new notes
                    let combinedNotes = investigationNotes
                    if (selectedReport.admin_notes && investigationNotes.trim()) {
                      combinedNotes = selectedReport.admin_notes + '\n\n--- Additional Notes ---\n' + investigationNotes
                    } else if (selectedReport.admin_notes && !investigationNotes.trim()) {
                      combinedNotes = selectedReport.admin_notes
                    }
                    
                    handleReportAction(selectedReport.id, "dismissed", combinedNotes)
                    // Remove from under review list
                    setUnderReviewReports(prev => prev.filter(r => r.id !== selectedReport.id))
                    setShowInvestigationModal(false)
                    setInvestigationNotes("")
                    setSelectedService(null)
                  }}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss Report
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Save investigation notes by updating the report with current status and notes
                    if (investigationNotes.trim() || selectedReport.admin_notes) {
                      try {
                        // Combine existing notes with new notes
                        let combinedNotes = investigationNotes
                        if (selectedReport.admin_notes && investigationNotes.trim()) {
                          combinedNotes = selectedReport.admin_notes + '\n\n--- Additional Notes ---\n' + investigationNotes
                        } else if (selectedReport.admin_notes && !investigationNotes.trim()) {
                          combinedNotes = selectedReport.admin_notes
                        }
                        
                        await updateReportStatus(selectedReport.id, "under_review", combinedNotes)
                        
                        // Update the selected report with the new notes
                        const currentISTTime = getCurrentISTTime()
                        console.log('Current IST time:', currentISTTime)
                        
                        setSelectedReport(prev => ({
                          ...prev,
                          admin_notes: combinedNotes,
                          updated_at: new Date().toISOString(), // Still store UTC for API
                          updated_at_display: currentISTTime // Store IST for display
                        }))
                        
                        console.log("Investigation notes saved successfully")
                      } catch (error) {
                        console.error("Error saving investigation notes:", error)
                        alert("Failed to save investigation notes")
                      }
                    }
                    // Keep report under review, just close modal
                    setShowInvestigationModal(false)
                    setInvestigationNotes("")
                    setSelectedService(null)
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Save & Continue Later
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
