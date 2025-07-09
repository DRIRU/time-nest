"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Award
} from "lucide-react"
import { getServiceOverviewStats } from "@/lib/services-data"
import { getServiceRequestOverviewStats } from "@/lib/service-requests-data"
import { getUserStats } from "@/lib/users-data"
import { getAllModeratorApplications, updateModeratorApplicationStatus } from "@/lib/moderator-data"
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
  const [processingRequestId, setProcessingRequestId] = useState(null)

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

  // Separate useEffect for loading data that depends on adminUser being set
  useEffect(() => {
    // Only proceed if adminUser is available
    if (!adminUser) return;
    
    async function loadStats() {
      try {
        const userStats = getUserStats()
        const serviceStats = getServiceOverviewStats()
        const requestStats = getServiceRequestOverviewStats()
        
        // Fetch moderator applications
        let applications = [];
        try {
          applications = await getAllModeratorApplications(adminUser.accessToken);
          setModApplications(applications);
          
          // Calculate stats
          const pendingCount = applications.filter(app => app.status === "pending").length;
          const approvedCount = applications.filter(app => app.status === "approved").length;
          const rejectedCount = applications.filter(app => app.status === "rejected").length;
          
          setStats({
            users: userStats,
            services: serviceStats,
            requests: requestStats,
            platform: {
              totalTransactions: 1247,
              totalCreditsExchanged: 3892,
              averageRating: 4.6,
              activeUsers: 89,
              monthlyGrowth: 12.5,
              systemUptime: "99.9%",
            },
            modRequests: {
              pending: pendingCount,
              approved: approvedCount,
              rejected: rejectedCount,
              total: applications.length
            }
          });
        } catch (error) {
          console.error("Error fetching moderator applications:", error);
          // Set default modRequests stats if fetching fails
          setStats({
            users: userStats,
            services: serviceStats,
            requests: requestStats,
            platform: {
              totalTransactions: 1247,
              totalCreditsExchanged: 3892,
              averageRating: 4.6,
              activeUsers: 89,
              monthlyGrowth: 12.5,
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
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [adminUser]); // This effect depends on adminUser
  
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
      value: stats.users.totalUsers || 0,
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Active Services",
      value: stats.services.totalServices || 0,
      change: "+8%",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Service Requests",
      value: stats.requests.totalRequests || 0,
      change: "+15%",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Credits Exchanged",
      value: stats.platform.totalCreditsExchanged || 0,
      change: "+23%",
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
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger> 
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Health */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
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
                      {stats.platform.systemUptime}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users (24h)</span>
                    <span className="font-medium">{stats.platform.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{stats.platform.averageRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Growth</span>
                    <span className="font-medium text-green-600">+{stats.platform.monthlyGrowth}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">New user registration: Sarah M.</span>
                      <span className="text-xs text-gray-500">2 min ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Service completed: Web Development</span>
                      <span className="text-xs text-gray-500">15 min ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">New service request: Garden Design</span>
                      <span className="text-xs text-gray-500">1 hour ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Payment processed: 3.5 credits</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
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
            </Card>
            
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
                  <Button variant="outline" size="sm">
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                    <span className="font-medium">{stats.users.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Service Providers</span>
                    <span className="font-medium">{stats.users.serviceProviders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Customers</span>
                    <span className="font-medium">{stats.users.customers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Verified Users</span>
                    <span className="font-medium">{stats.users.verifiedUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Verification Rate</span>
                    <span className="font-medium">{stats.users.verificationRate}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>User Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start"> 
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify Pending Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    User Settings
                  </Button>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2"> 
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sarah Miller</span>
                      <Badge variant="secondary" className="text-xs">Provider</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mike Johnson</span>
                      <Badge variant="outline" className="text-xs">Customer</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Emily Davis</span>
                      <Badge variant="secondary" className="text-xs">Provider</Badge>
                    </div>
                  </div>
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

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Service Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"> 
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Services</span>
                    <span className="font-medium">{stats.services.totalServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Services</span>
                    <span className="font-medium">{stats.services.activeServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Rating</span>
                    <span className="font-medium">{stats.services.averageRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</span>
                    <span className="font-medium">{stats.services.totalReviews}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Service Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"> 
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Requests</span>
                    <span className="font-medium">{stats.requests.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Open Requests</span>
                    <span className="font-medium">{stats.requests.openRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Budget</span>
                    <span className="font-medium">{stats.requests.averageBudget} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className="font-medium">{stats.requests.completionRate}%</span>
                  </div>
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
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email Service</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment System</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
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
              </Card>
            </div>
            
            {/* Moderator Applications Overview */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
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
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}