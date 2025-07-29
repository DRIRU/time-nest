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
import { getPendingReports, getFlaggedContent, getModeratorStats, getModeratorActivity, updateReportStatus, moderateContent, isModeratorAuthenticated, getStoredModeratorData, logoutModerator, getModeratorUsers, getModeratorRecentUsers, getModeratorServices, getModeratorRequests, moderateService, moderateRequest } from "@/lib/moderator-data"
import Link from "next/link"

export default function ModeratorDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [moderatorUser, setModeratorUser] = useState(null)
  const [stats, setStats] = useState({
    reports: {
      pending: 0,
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
        const [statsData, reportsData, contentData, activityData] = await Promise.all([
          getModeratorStats(moderatorUser.accessToken),
          getPendingReports(moderatorUser.accessToken),
          getFlaggedContent(moderatorUser.accessToken),
          getModeratorActivity(moderatorUser.accessToken, 5)
        ])
        
        console.log("Loaded moderator data:", { statsData, reportsData, contentData, activityData })
        
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
          status: report.status || "pending"
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
          
          // For now, suspended users will be empty as there's no endpoint
          // In a real implementation, this would come from a user status endpoint
          setSuspendedUsers([])
          
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

          setSuspendedUsers([])
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
        setFlaggedContent(validContent)
        setRecentActivity(validActivity)

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

        setSuspendedUsers([])
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

  const handleReportAction = async (reportId, action) => {
    try {
      // Use the actual API function
      await updateReportStatus(reportId, action, moderatorUser?.accessToken)
      
      // Update local state
      setPendingReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: action }
            : report
        ).filter(report => report.status === "pending")
      )

      // Update stats
      setStats(prev => ({
        ...prev,
        reports: {
          ...prev.reports,
          pending: prev.reports.pending - 1,
          resolved: action === "resolved" ? prev.reports.resolved + 1 : prev.reports.resolved
        }
      }))

      console.log(`Report ${reportId} ${action} successfully`)

    } catch (error) {
      console.error(`Error ${action} report:`, error)
      alert(`Failed to ${action} report: ${error.message}`)
    }
  }

  const handleContentAction = async (contentId, action) => {
    try {
      // Use the actual API function
      await moderateContent(contentId, action, moderatorUser?.accessToken)
      
      // Update local state
      setFlaggedContent(prev => 
        prev.filter(content => content.id !== contentId)
      )

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
          const userToSuspend = flaggedUsers.find(user => user.id === userId)
          if (userToSuspend) {
            setSuspendedUsers(prev => [...prev, {
              ...userToSuspend,
              status: "suspended",
              suspendedReason: "Moderator action",
              suspendedDate: new Date().toISOString(),
              suspendedBy: moderatorUser?.email || "Moderator"
            }])
          }
          setStats(prev => ({
            ...prev,
            users: {
              ...prev.users,
              flagged: prev.users.flagged - 1,
              suspended: prev.users.suspended + 1
            }
          }))
        } else if (action === 'unsuspend') {
          setSuspendedUsers(prev => prev.filter(user => user.id !== userId))
          setStats(prev => ({
            ...prev,
            users: {
              ...prev.users,
              suspended: prev.users.suspended - 1
            }
          }))
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
    return new Date(dateString).toLocaleDateString()
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

  const quickStats = [
    {
      title: "Pending Reports",
      value: stats.reports.pending,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Flagged Users",
      value: stats.users.flagged,
      icon: Flag,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Content Reviews",
      value: stats.content.flagged,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Resolved Today",
      value: stats.reports.resolved,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ]

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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                              <Badge className={
                                report.severity === "High" ? "bg-red-100 text-red-800" :
                                report.severity === "Medium" ? "bg-orange-100 text-orange-800" :
                                "bg-yellow-100 text-yellow-800"
                              }>
                                {report.severity}
                              </Badge>
                              <span className="font-medium">{report.type}</span>
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
                              Submitted: {new Date(report.created_at).toLocaleString()}
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
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Investigate
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

            {/* Report Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <h3 className="text-2xl font-bold text-green-600">{stats.reports.resolved}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Content Management Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>
                    Search and manage services and requests on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleSearchContent}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Services & Requests
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter by Category
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    View Content History
                  </Button>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>
                    Overview of platform content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Services:</span>
                    <span className="font-medium">{allServices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requests:</span>
                    <span className="font-medium">{allRequests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Flagged Content:</span>
                    <span className="font-medium text-red-600">{flaggedContent.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flagged Content */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flagged Content ({flaggedContent.length})
                </CardTitle>
                <CardDescription>
                  Content that has been flagged by users and requires moderation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedContent.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No flagged content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedContent.map(content => (
                      <div key={content.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{content.type}</Badge>
                              <span className="font-medium">
                                {content.title || `${content.type} by ${content.author}`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Author:</strong> {content.author}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reason:</strong> {content.reason}
                            </p>
                            {content.content && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                "{content.content}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Flagged: {new Date(content.flaggedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContentAction(content.id, "approved")}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContentAction(content.id, "removed")}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* User Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Moderation Actions</CardTitle>
                  <CardDescription>
                    Quick actions for user moderation and oversight
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleSearchUsers}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter Flagged Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    View Action History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Info className="h-4 w-4 mr-2" />
                    User Reports
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* Flagged Users */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Flagged Users ({flaggedUsers.length})
                </CardTitle>
                <CardDescription>
                  Users that have been flagged and require moderation review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No flagged users</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedUsers.map(user => (
                      <div key={user.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-orange-100 text-orange-800">
                                Flagged
                              </Badge>
                              <span className="font-medium">{user.username}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Email:</strong> {user.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reason:</strong> {user.flaggedReason}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reports:</strong> {user.reportCount} report(s)
                            </p>
                            <p className="text-xs text-gray-500">
                              Flagged: {new Date(user.flaggedDate).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user.id, "unflag")}
                            disabled={processingUserId === user.id}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Clear Flag
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUserAction(user.id, "suspend")}
                            disabled={processingUserId === user.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suspended Users */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  Suspended Users ({suspendedUsers.length})
                </CardTitle>
                <CardDescription>
                  Users currently under suspension
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suspendedUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suspended users</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suspendedUsers.map(user => (
                      <div key={user.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-100 text-red-800">
                                Suspended
                              </Badge>
                              <span className="font-medium">{user.username}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Email:</strong> {user.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Reason:</strong> {user.suspendedReason}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Suspended By:</strong> {user.suspendedBy}
                            </p>
                            <p className="text-xs text-gray-500">
                              Suspended: {new Date(user.suspendedDate).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleUserAction(user.id, "unsuspend")}
                            disabled={processingUserId === user.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unsuspend
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
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
                    <h3 className="text-2xl font-bold text-orange-600">{stats.users.flagged}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Flagged Users</p>
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
              </Card>
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
                              {new Date(activity.timestamp).toLocaleString()}
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
    </div>
  )
}
