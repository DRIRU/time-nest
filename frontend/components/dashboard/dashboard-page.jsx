"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  DollarSign, 
  Star, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getServiceBookings } from "@/lib/database-services"
import DashboardSidebar from "./dashboard-sidebar"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser } = useAuth()
  const [stats, setStats] = useState({
    pendingBookings: 0,
    confirmedBookings: 0,
    totalServices: 0,
    totalRequests: 0,
    timeCredits: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard")
      return
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch bookings
        const bookings = await getServiceBookings()
        
        // Calculate stats
        const pendingBookings = bookings.filter(b => b.status === "pending").length
        const confirmedBookings = bookings.filter(b => b.status === "confirmed").length
        
        // Set stats (some are placeholders for now)
        setStats({
          pendingBookings,
          confirmedBookings,
          totalServices: 0, // Placeholder
          totalRequests: 0, // Placeholder
          timeCredits: currentUser?.timeCredits || 0 // Placeholder
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isLoggedIn, router, currentUser])

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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {currentUser?.firstName || "User"}
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Credits</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.timeCredits}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Confirmed Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmedBookings}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    My Services
                  </CardTitle>
                  <CardDescription>Services you've listed</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage the services you've offered to the community.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/my-services" className="w-full">
                    <Button className="w-full">
                      View Services
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    My Bookings
                  </CardTitle>
                  <CardDescription>Manage your bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    View and manage bookings you've made or received.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/my-bookings" className="w-full">
                    <Button className="w-full">
                      View Bookings
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    My Requests
                  </CardTitle>
                  <CardDescription>Service requests you've posted</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage the service requests you've posted.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/dashboard/my-requests" className="w-full">
                    <Button className="w-full">
                      View Requests
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions on TimeNest</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.pendingBookings > 0 ? (
                      <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-300">
                            You have {stats.pendingBookings} pending booking{stats.pendingBookings !== 1 ? 's' : ''}
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                            Please review and respond to these booking requests.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                            onClick={() => router.push("/dashboard/my-bookings")}
                          >
                            View Pending Bookings
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">
                            You're all caught up!
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            No pending bookings to review.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Placeholder for more activity items */}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Your recent activity will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}