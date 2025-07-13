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
import { getServiceBookings, getProviderRatingStats, getUserCreditBalance } from "@/lib/database-services"
import DashboardSidebar from "./dashboard-sidebar"
import CreditBalanceWidget from "./credit-balance-widget"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser, loading } = useAuth()
  const [stats, setStats] = useState({
    pendingBookings: 0,
    confirmedBookings: 0,
    totalServices: 0,
    totalRequests: 0,
    timeCredits: 0,
    averageRating: 0,
    totalRatings: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Wait for auth to be checked
    if (loading) return;
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard")
      return
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log("Current user in dashboard:", currentUser)
        
        // Fetch bookings
        const bookings = await getServiceBookings()
        
        // Calculate stats
        const pendingBookings = bookings.filter(b => b.status === "pending").length
        const confirmedBookings = bookings.filter(b => b.status === "confirmed").length
        
        // Fetch user rating stats for any user with user_id
        let ratingStats = { average_rating: 0, total_ratings: 0 }
        if (currentUser?.user_id) {
          try {
            console.log("Fetching rating stats for user:", {
              user_id: currentUser.user_id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              role: currentUser.role
            })
            ratingStats = await getProviderRatingStats(currentUser.user_id)
            console.log("Rating stats received:", ratingStats)
          } catch (ratingError) {
            console.error("Error fetching rating stats:", ratingError)
            // Check if it's a 404 (user not found) - this is normal for new users
            if (ratingError.message.includes("Not Found") || ratingError.message.includes("Provider not found")) {
              console.log("User not found in ratings system - using default stats for new user")
              // Use default stats with current user's name
              ratingStats = {
                provider_id: currentUser.user_id,
                provider_name: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : "User",
                total_ratings: 0,
                average_rating: 0.0
              }
            } else {
              console.error("Unexpected error fetching ratings:", ratingError)
              // Use fallback stats
              ratingStats = { average_rating: 0, total_ratings: 0 }
            }
          }
        } else {
          console.log("User ID not available for rating fetch:", {
            user_id: currentUser?.user_id,
            hasCurrentUser: !!currentUser
          })
        }
        
        // Fetch real credit data
        let creditBalance = 0
        try {
          const creditData = await getUserCreditBalance()
          creditBalance = creditData.current_balance || 0
          console.log("Credit balance fetched:", creditBalance)
        } catch (creditError) {
          console.error("Error fetching credit balance:", creditError)
          // Use fallback value
          creditBalance = currentUser?.timeCredits || 0
        }
        
        // Set stats (some are placeholders for now)
        setStats({
          pendingBookings,
          confirmedBookings,
          totalServices: 0, // Placeholder
          totalRequests: 0, // Placeholder
          timeCredits: creditBalance,
          averageRating: ratingStats?.average_rating || 0,
          totalRatings: ratingStats?.total_ratings || 0
        })
        
        console.log("Final stats set:", {
          averageRating: ratingStats?.average_rating || 0,
          totalRatings: ratingStats?.total_ratings || 0
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isLoggedIn, router, currentUser, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

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
              {/* Credit Balance Widget */}
              <CreditBalanceWidget />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Pending Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.pendingBookings}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting Response</p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stats.pendingBookings > 0 
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {stats.pendingBookings > 0 ? "Action Needed" : "All Clear"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Confirmed Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.confirmedBookings}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Services</p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stats.confirmedBookings > 0 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {stats.confirmedBookings > 0 ? "Active" : "None Active"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-purple-500" />
                    Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.totalRatings > 0 ? `From ${stats.totalRatings} review${stats.totalRatings !== 1 ? 's' : ''}` : "No reviews yet"}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stats.averageRating >= 4.0 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : stats.averageRating >= 3.0
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : stats.totalRatings > 0
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {stats.totalRatings === 0 ? "New User" 
                         : stats.averageRating >= 4.0 ? "Excellent"
                         : stats.averageRating >= 3.0 ? "Good"
                         : "Needs Improvement"}
                      </span>
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