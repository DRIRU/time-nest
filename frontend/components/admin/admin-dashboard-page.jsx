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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  DollarSign,
  Activity,
  Eye,
  UserPlus,
  FileText,
  LogOut,
  Home,
  Award,
  TrendingDown,
  PieChart,
  Search,
  X
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from "recharts"
import { getOverviewStats } from "@/lib/service-requests-data"
import { getAllModeratorApplications, updateModeratorApplicationStatus } from "@/lib/moderator-data"
import { getRecentUsersAdmin } from "@/lib/users-data"
import { getTransactionData, getUserActivityData, getWeeklyReportsData, getReportStats, getServicesBookingsData, getRequestsProposalsData, getSystemHealth } from "@/lib/reports-data"
import Link from "next/link"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const [stats, setStats] = useState({
    users: {},
    services: {},
    requests: {},
    platform: {},
    modRequests: {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    }
  })
  const [modApplications, setModApplications] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [processingRequestId, setProcessingRequestId] = useState(null)

  // Real report data state
  const [transactionData, setTransactionData] = useState([])
  const [userActivityData, setUserActivityData] = useState([])
  const [weeklyReportsData, setWeeklyReportsData] = useState([])
  const [servicesBookingsData, setServicesBookingsData] = useState([])
  const [requestsProposalsData, setRequestsProposalsData] = useState([])
  const [systemHealthData, setSystemHealthData] = useState({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    database_status: "Unknown",
    api_response_time: 0,
    uptime_percent: 0
  })
  const [reportStats, setReportStats] = useState({
    totalTransactions: 0,
    totalReports: 0,
    activeUsers: 0
  })

  // Date range state for reports
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0], // 6 months ago
    endDate: new Date().toISOString().split('T')[0] // today
  })
  const [isLoadingReports, setIsLoadingReports] = useState(false)

  // Modal and search state for moderator applications
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, pending, approved, rejected

  useEffect(() => {
    // Check admin authentication only
    const adminAuth = localStorage.getItem("adminAuth")
    const adminUserData = localStorage.getItem("adminUser")

    if (!adminAuth || adminAuth !== "true") {
      router.push("/admin/login")
      return
    }

    if (adminUserData) {
      setAdminUser(JSON.parse(adminUserData))
    }
  }, [router]);

  // Set up auto-refresh for system health data
  useEffect(() => {
    if (!adminUser) return;

    // Refresh system health every 30 seconds
    const interval = setInterval(() => {
      refreshSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [adminUser]);

  // Separate useEffect for loading data that depends on adminUser being set
  useEffect(() => {
    // Only proceed if adminUser is available
    if (!adminUser) return;
    
    async function loadStats() {
      try {
        const overviewStats = await getOverviewStats()
        console.log("overviewStats is", overviewStats)
        
        // Fetch moderator applications
        let applications = []; 
        try {
          applications = await getAllModeratorApplications(adminUser.accessToken);
          if (Array.isArray(applications)) {
            setModApplications(applications);
          
            // Calculate stats
            const pendingCount = applications.filter(app => app.status === "pending").length;
            const approvedCount = applications.filter(app => app.status === "approved").length;
            const rejectedCount = applications.filter(app => app.status === "rejected").length;
          
            setStats({
              users: { total_users: overviewStats?.total_users || 0 },
              services: { 
                total_services: overviewStats?.total_services || 0,
                completed_services: overviewStats?.completed_services || 0
              },
              requests: { 
                total_requests: overviewStats?.total_requests || 0,
                total_credits_exchanged: overviewStats?.total_credits_exchanged || 0
              },
              platform: {
                totalTransactions: overviewStats?.completed_services || 0,
                totalCreditsExchanged: overviewStats?.total_credits_exchanged || 0,
                averageRating: 4.5,
                activeUsers: overviewStats?.total_users || 0,
                systemUptime: "99.9%",
              },
              modRequests: {
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                total: applications.length
              }
            });
          } else {
            console.error("Applications is not an array:", applications);
            setModApplications([]);
          }
        } catch (error) {
          console.error("Error fetching moderator applications:", error);
          // Set default modRequests stats if fetching fails
          setStats({
            users: { total_users: overviewStats?.total_users || 0 },
            services: { 
              total_services: overviewStats?.total_services || 0,
              completed_services: overviewStats?.completed_services || 0
            },
            requests: { 
              total_requests: overviewStats?.total_requests || 0,
              total_credits_exchanged: overviewStats?.total_credits_exchanged || 0
            },
            platform: {
              totalTransactions: overviewStats?.completed_services || 0,
              totalCreditsExchanged: overviewStats?.total_credits_exchanged || 0,
              averageRating: 4.5,
              activeUsers: overviewStats?.total_users || 0,
              systemUptime: "99.9%",
            },
            modRequests: {
              pending: 0,
              approved: 0,
              rejected: 0,
              total: 0
            }
          });
        }
        
        // Fetch recent users
        try {
          const recent = await getRecentUsersAdmin(adminUser.accessToken, 3);
          setRecentUsers(Array.isArray(recent) ? recent : (recent?.users || []));
        } catch (error) {
          console.error("Error fetching recent users:", error);
          setRecentUsers([]);
        }

        // Fetch report data with the current date range
        try {
          const [transactionData, activityData, weeklyData, servicesBookings, requestsProposals, reportStatsData, systemHealth] = await Promise.all([
            getTransactionData(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getUserActivityData(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getWeeklyReportsData(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getServicesBookingsData(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getRequestsProposalsData(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getReportStats(adminUser.accessToken, null, dateRange.startDate, dateRange.endDate),
            getSystemHealth(adminUser.accessToken)
          ]);
          
          setTransactionData(transactionData);
          setUserActivityData(activityData);
          setWeeklyReportsData(weeklyData);
          setServicesBookingsData(servicesBookings);
          setRequestsProposalsData(requestsProposals);
          setReportStats(reportStatsData);
          setSystemHealthData(systemHealth);
        } catch (error) {
          console.error("Error fetching report data:", error);
          // Keep default empty states
        }
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [adminUser]); // This effect depends on adminUser
  
  // Function to load report data with date range
  const loadReportData = async (startDate, endDate) => {
    if (!adminUser) return;
    
    setIsLoadingReports(true);
    try {
      const [transactionData, activityData, weeklyData, servicesBookings, requestsProposals, reportStatsData] = await Promise.all([
        getTransactionData(adminUser.accessToken, null, startDate, endDate),
        getUserActivityData(adminUser.accessToken, null, startDate, endDate),
        getWeeklyReportsData(adminUser.accessToken, null, startDate, endDate),
        getServicesBookingsData(adminUser.accessToken, null, startDate, endDate),
        getRequestsProposalsData(adminUser.accessToken, null, startDate, endDate),
        getReportStats(adminUser.accessToken, null, startDate, endDate)
      ]);
      
      console.log('=== FRONTEND CHART DATA RECEIVED ===');
      console.log('Transaction Data:', transactionData);
      console.log('User Activity Data:', activityData);
      console.log('Weekly Reports Data:', weeklyData);
      console.log('Services Bookings Data:', servicesBookings);
      console.log('Requests Proposals Data:', requestsProposals);
      console.log('Report Stats Data:', reportStatsData);
      console.log('Date Range:', { startDate, endDate });
      console.log('====================================');
      
      setTransactionData(transactionData);
      setUserActivityData(activityData);
      setWeeklyReportsData(weeklyData);
      setServicesBookingsData(servicesBookings);
      setRequestsProposalsData(requestsProposals);
      setReportStats(reportStatsData);
    } catch (error) {
      console.error("Error fetching report data with date range:", error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Function to refresh system health data
  const refreshSystemHealth = async () => {
    if (!adminUser) return;
    
    try {
      const systemHealth = await getSystemHealth(adminUser.accessToken);
      setSystemHealthData(systemHealth);
    } catch (error) {
      console.error("Error refreshing system health:", error);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    // Auto-reload data when both dates are set and valid
    if (newDateRange.startDate && newDateRange.endDate && new Date(newDateRange.startDate) <= new Date(newDateRange.endDate)) {
      loadReportData(newDateRange.startDate, newDateRange.endDate);
    }
  };

  // Filter moderator applications based on search term and status
  const filteredModApplications = modApplications.filter(application => {
    const matchesSearch = searchTerm === "" || 
      application.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.experience?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const handleApproveModRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      await updateModeratorApplicationStatus(requestId, "approved", adminUser?.accessToken);
      
      // Update the local state
      setModApplications(prev => 
        prev.map(app => 
          app.request_id === requestId 
            ? {...app, status: "approved", reviewed_at: new Date().toISOString()} 
            : app
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        modRequests: {
          ...prev.modRequests,
          pending: prev.modRequests.pending - 1,
          approved: prev.modRequests.approved + 1,
          total: prev.modRequests.total
        }
      }));
    } catch (error) {
      console.error("Error approving moderator application:", error);
      alert("Failed to approve application: " + error.message);
    } finally {
      setProcessingRequestId(null);
    }
  };
  
  const handleRejectModRequest = async (requestId) => {
    try {
      setProcessingRequestId(requestId);
      await updateModeratorApplicationStatus(requestId, "rejected", adminUser?.accessToken);
      
      // Update the local state
      setModApplications(prev => 
        prev.map(app => 
          app.request_id === requestId 
            ? {...app, status: "rejected", reviewed_at: new Date().toISOString()} 
            : app
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        modRequests: {
          ...prev.modRequests,
          pending: prev.modRequests.pending - 1,
          rejected: prev.modRequests.rejected + 1,
          total: prev.modRequests.total
        }
      }));
    } catch (error) {
      console.error("Error rejecting moderator application:", error);
      alert("Failed to reject application: " + error.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    localStorage.removeItem("adminUser")
    router.push("/admin/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const quickStats = [
    {
      title: "Total Users",
      value: stats.users?.total_users || 0, 
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Services",
      value: stats.services?.total_services || 0,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Service Requests",
      value: stats.requests?.total_requests || 0,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Credits Exchanged",
      value: stats.requests?.total_credits_exchanged || 0,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
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
                <Clock className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">TimeNest Admin</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {adminUser?.name || "Admin"}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage the TimeNest platform
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
</div>        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3  ">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger> 
            {/* <TabsTrigger value="system">System</TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Health */}
              {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">System Uptime</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {systemHealthData.uptime_percent}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database Status</span>
                    <Badge 
                      variant="secondary" 
                      className={
                        systemHealthData.database_status === "Connected" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {systemHealthData.database_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users (24h)</span>
                    <span className="font-medium">{stats.platform.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
                    <Badge 
                      variant="secondary" 
                      className={
                        systemHealthData.api_response_time < 200 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {systemHealthData.api_response_time}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{stats.platform.averageRating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}

              {/* Recent Activity */}
              {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">No recent activity</span>
                      <span className="text-xs text-gray-500">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Quick Actions */}
            {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-sm">Verify Users</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Eye className="h-6 w-6" />
                    <span className="text-sm">Review Services</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Moderate Content</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">System Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card> */}
            
            {/* Moderator Applications */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Moderator Applications
                </CardTitle>
                <CardDescription>
                  Review and manage moderator applications from community members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="flex gap-4">
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg min-w-20">
                      <p className="text-xl font-bold text-yellow-600">{stats.modRequests.pending}</p>
                      <p className="text-xs text-yellow-700">Pending</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-20">
                      <p className="text-xl font-bold text-green-600">{stats.modRequests.approved}</p>
                      <p className="text-xs text-green-700">Approved</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg min-w-20">
                      <p className="text-xl font-bold text-red-600">{stats.modRequests.rejected}</p>
                      <p className="text-xs text-red-700">Rejected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                    View All
                  </Button>
                </div>
                
                {modApplications.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No applications yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      When users apply to become moderators, their applications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modApplications
                      .filter(app => app.status === "pending")
                      .slice(0, 3)
                      .map(application => (
                        <div key={application.request_id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{application.user_name}</h4>
                              <p className="text-sm text-gray-500">
                                Applied on {new Date(application.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                            {application.reason}
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejectModRequest(application.request_id)}
                              disabled={processingRequestId === application.request_id}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveModRequest(application.request_id)}
                              disabled={processingRequestId === application.request_id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Moderator Applications Modal */}
            <Dialog 
              open={isModalOpen} 
              onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) {
                  // Reset search and filters when modal closes
                  setSearchTerm("");
                  setStatusFilter("all");
                }
              }}
            >
              <DialogContent className="max-w-4xl max-h-[80vh] w-[95vw] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    All Moderator Applications ({filteredModApplications.length})
                  </DialogTitle>
                  <DialogDescription>
                    Review and manage all moderator applications from community members
                  </DialogDescription>
                </DialogHeader>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col gap-4 py-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by name, reason, or experience..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                      className="text-xs"
                    >
                      All ({modApplications.length})
                    </Button>
                    <Button
                      variant={statusFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("pending")}
                      className="text-xs"
                    >
                      Pending ({modApplications.filter(app => app.status === "pending").length})
                    </Button>
                    <Button
                      variant={statusFilter === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("approved")}
                      className="text-xs"
                    >
                      Approved ({modApplications.filter(app => app.status === "approved").length})
                    </Button>
                    <Button
                      variant={statusFilter === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("rejected")}
                      className="text-xs"
                    >
                      Rejected ({modApplications.filter(app => app.status === "rejected").length})
                    </Button>
                  </div>
                </div>

                {/* Applications List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredModApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {searchTerm || statusFilter !== "all" ? "No matching applications" : "No applications yet"}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria."
                          : "When users apply to become moderators, their applications will appear here."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 pr-2">
                      {filteredModApplications.map((application) => (
                        <div key={application.request_id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-lg">{application.user_name}</h4>
                              <p className="text-sm text-gray-500">
                                Applied on {new Date(application.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              application.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              application.status === "approved" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {application.status === "pending" ? "Pending" :
                               application.status === "approved" ? "Approved" :
                               "Rejected"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Application:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                {application.reason}
                              </p>
                            </div>
                            
                            {application.experience && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience:</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                  {application.experience}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {application.status === "pending" && (
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRejectModRequest(application.request_id)}
                                disabled={processingRequestId === application.request_id}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                {processingRequestId === application.request_id ? "Processing..." : "Reject"}
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleApproveModRequest(application.request_id)}
                                disabled={processingRequestId === application.request_id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processingRequestId === application.request_id ? "Processing..." : "Approve"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>User Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/admin/users?action=add")}> 
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify Pending Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push("/admin/users")}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All Users
                  </Button>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentUsers.length > 0 ? (
                    <div className="space-y-2">
                      {recentUsers.map((user, index) => (
                        <div key={user.id || index} className="flex items-center justify-between">
                          <span className="text-sm">
                            {user.first_name || user.firstName} {user.last_name || user.lastName}
                          </span>
                          {user.role === "service_provider" && (
                            <Badge variant="secondary" className="text-xs">
                              Provider
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No recent registrations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Moderator Applications Card */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Moderator Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {modApplications.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {modApplications.map(application => (
                      <div key={application.request_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{application.user_name}</h4>
                            <p className="text-sm text-gray-500">
                              Applied on {new Date(application.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={
                            application.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            application.status === "approved" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }>
                            {application.status === "pending" ? "Pending" :
                             application.status === "approved" ? "Approved" :
                             "Rejected"}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Reason:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{application.reason}</p>
                        </div>
                        {application.experience && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Experience:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{application.experience}</p>
                          </div>
                        )}
                        {application.status === "pending" && (
                          <div className="flex justify-end gap-2 mt-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRejectModRequest(application.request_id)}
                              disabled={processingRequestId === application.request_id}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveModRequest(application.request_id)}
                              disabled={processingRequestId === application.request_id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Date Range Filter */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date Range Filter
                </CardTitle>
                <CardDescription>
                  Filter reports data by selecting a custom date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                      End Date
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => loadReportData(dateRange.startDate, dateRange.endDate)}
                    disabled={isLoadingReports || !dateRange.startDate || !dateRange.endDate}
                    className="shrink-0"
                  >
                    {isLoadingReports ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Update Reports
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reports Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                      <p className="text-2xl font-bold">{reportStats.totalTransactions}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Real-time data
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reports Filed</p>
                      <p className="text-2xl font-bold">{reportStats.totalReports}</p>
                      <p className="text-xs text-blue-600 flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        Live data
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-100">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold">{reportStats.activeUsers}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Current total
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction Trends */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Transaction Trends
                  </CardTitle>
                  <CardDescription>Monthly transactions and credits exchanged</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transactionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="transactions" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                          name="Transactions"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="credits" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', r: 4 }}
                          activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: 'white' }}
                          name="Credits"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Service Categories Distribution */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Service Categories
                  </CardTitle>
                  <CardDescription>Distribution of services by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {userActivityData.length > 0 ? (
                    <>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={userActivityData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {userActivityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-4 flex-wrap">
                        {userActivityData.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {item.name}: {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No service data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Reports */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Weekly Reports
                  </CardTitle>
                  <CardDescription>Reports filed this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyReportsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                        <Bar 
                          dataKey="reports" 
                          fill="#ff7c7c" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Services vs Bookings */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Services vs Bookings
                  </CardTitle>
                  <CardDescription>Services listed vs service bookings made over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={servicesBookingsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="servicesListed" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                          name="Services Listed"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="serviceBookings" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                          name="Service Bookings"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Requests vs Proposals */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Requests vs Proposals
                  </CardTitle>
                  <CardDescription>Service requests vs proposals submitted over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={requestsProposalsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#666' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="serviceRequests" 
                          stroke="#2563eb" 
                          strokeWidth={3}
                          dot={{ fill: '#2563eb', r: 4 }}
                          activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: 'white' }}
                          name="Service Requests"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="proposals" 
                          stroke="#16a34a" 
                          strokeWidth={3}
                          dot={{ fill: '#16a34a', r: 4 }}
                          activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2, fill: 'white' }}
                          name="Proposals Submitted"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* System Health Overview */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>Real-time system metrics from your server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              systemHealthData.cpu_usage > 80 ? 'bg-red-600' : 
                              systemHealthData.cpu_usage > 60 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{width: `${systemHealthData.cpu_usage}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{systemHealthData.cpu_usage}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              systemHealthData.memory_usage > 85 ? 'bg-red-600' : 
                              systemHealthData.memory_usage > 70 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{width: `${systemHealthData.memory_usage}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{systemHealthData.memory_usage}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              systemHealthData.disk_usage > 90 ? 'bg-red-600' : 
                              systemHealthData.disk_usage > 75 ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}
                            style={{width: `${systemHealthData.disk_usage}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{systemHealthData.disk_usage}%</span>
                      </div>
                    </div>

                    {/* <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Database Status</span>
                      <Badge 
                        variant="secondary" 
                        className={
                          systemHealthData.database_status === "Connected" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {systemHealthData.database_status === "Connected" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {systemHealthData.database_status}
                      </Badge>
                    </div> */}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
                      <Badge 
                        variant="secondary" 
                        className={
                          systemHealthData.api_response_time < 200 
                            ? "bg-green-100 text-green-800" 
                            : systemHealthData.api_response_time < 500 
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {systemHealthData.api_response_time}ms
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">System Uptime</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Activity className="h-3 w-3 mr-1" />
                        {systemHealthData.uptime_percent}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Last updated: {new Date(systemHealthData.timestamp).toLocaleTimeString()}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={refreshSystemHealth}
                        className="h-6 px-2 text-xs"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  {/* <Button variant="outline" className="w-full mt-4" onClick={refreshSystemHealth}>
                    <Settings className="h-4 w-4 mr-2" />
                    Refresh System Health
                  </Button> */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between"> 
                    <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email Service</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment System</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>System Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start"> 
                    <Settings className="h-4 w-4 mr-2" />
                    System Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    View Logs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </CardContent>
              </Card> */}
            </div>
            
            {/* Moderator Applications Overview */}
            {/* <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Moderator Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Applications</span>
                  <span className="font-medium">{stats.modRequests.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Review</span>
                  <span className="font-medium text-yellow-600">{stats.modRequests.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                  <span className="font-medium text-green-600">{stats.modRequests.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rejected</span>
                  <span className="font-medium text-red-600">{stats.modRequests.rejected}</span>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}