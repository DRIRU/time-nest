"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  AlertCircle
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from "recharts"
import { getPendingReports, getFlaggedContent, getModeratorStats, getModeratorActivity, updateReportStatus, moderateContent, isModeratorAuthenticated, getStoredModeratorData, logoutModerator } from "@/lib/moderator-data"
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
        
        setStats(statsData)
        setPendingReports(reportsData)
        setFlaggedContent(contentData)
        setRecentActivity(Array.isArray(activityData) ? activityData : [])

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
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
                              Submitted: {new Date(report.submittedAt).toLocaleString()}
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
            {/* User Management */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Monitor user behavior and take moderation actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-2" />
                      Search Users
                    </Button>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
                
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>User management interface would go here</p>
                  <p className="text-sm">Features: Search, suspend, ban, view history, etc.</p>
                </div>
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
    </div>
  )
}
