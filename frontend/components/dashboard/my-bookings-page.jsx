"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  DollarSign,
  MessageSquare,
  Filter,
  Search,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { getServiceBookings, updateServiceBookingStatus } from "@/lib/database-services"
import DashboardSidebar from "./dashboard-sidebar"

export default function MyBookingsPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser, loading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [processingBookingId, setProcessingBookingId] = useState(null)

  useEffect(() => {
    if (loading) return;
    
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard/my-bookings")
      return
    }

    fetchBookings()
  }, [isLoggedIn, router, loading])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getServiceBookings()
      console.log("Fetched bookings:", data)
      setBookings(data)
      setFilteredBookings(data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setError("Failed to load bookings. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = [...bookings]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.service_title?.toLowerCase().includes(term) ||
        booking.booker_name?.toLowerCase().includes(term) ||
        booking.service_provider_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filter based on the active tab
    if (activeTab === "received") {
      // Bookings I received = I am the service provider (creator_id matches my user_id)
      filtered = filtered.filter(booking => parseInt(booking.creator_id) === parseInt(currentUser?.user_id))
    } else if (activeTab === "sent") {
      // Bookings I made = I am the booker (user_id matches my user_id)
      filtered = filtered.filter(booking => parseInt(booking.user_id) === parseInt(currentUser?.user_id))
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, activeTab, currentUser])

  const handleAcceptBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)
      await updateServiceBookingStatus(bookingId, "confirmed")
      await fetchBookings()
      alert("Booking accepted successfully!")
    } catch (error) {
      console.error("Error accepting booking:", error)
      alert(`Failed to accept booking: ${error.message}`)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleRejectBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)
      await updateServiceBookingStatus(bookingId, "rejected")
      await fetchBookings()
      alert("Booking rejected successfully!")
    } catch (error) {
      console.error("Error rejecting booking:", error)
      alert(`Failed to reject booking: ${error.message}`)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)
      await updateServiceBookingStatus(bookingId, "cancelled")
      await fetchBookings()
      alert("Booking cancelled successfully!")
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert(`Failed to cancel booking: ${error.message}`)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const handleCompleteBooking = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId)
      await updateServiceBookingStatus(bookingId, "completed")
      await fetchBookings()
      alert("Booking marked as completed!")
    } catch (error) {
      console.error("Error completing booking:", error)
      alert(`Failed to complete booking: ${error.message}`)
    } finally {
      setProcessingBookingId(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDateTime = (dateTimeString) => {
    try {
      const date = parseISO(dateTimeString)
      return format(date, "PPP 'at' p")
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateTimeString
    }
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
        
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your service bookings and appointments
              </p>
            </div>

            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchBookings}>Refresh</Button>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Bookings</TabsTrigger>
                <TabsTrigger value="sent">Bookings I Made</TabsTrigger>
                <TabsTrigger value="received">Bookings I Received</TabsTrigger>
              </TabsList>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {activeTab === "sent" 
                    ? "You haven't booked any services yet." 
                    : activeTab === "received" 
                      ? "You haven't received any booking requests yet."
                      : "No bookings match your search criteria."}
                </p>
                <Button onClick={() => router.push("/services")}>Browse Services</Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredBookings.map((booking) => {
                  const isProvider = parseInt(booking.creator_id) === parseInt(currentUser?.user_id);
                  const isPending = booking.status === "pending";
                  const isConfirmed = booking.status === "confirmed";
                  const isCompleted = booking.status === "completed";
                  const isCancelled = booking.status === "cancelled" || booking.status === "rejected";
                  
                  return (
                    <Card key={booking.booking_id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 dark:bg-gray-800 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl">{booking.service_title}</CardTitle>
                            <CardDescription>
                              Booking #{booking.booking_id} • {getStatusBadge(booking.status)}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {isProvider && isPending && (
                              <>
                                <Button 
                                  onClick={() => handleAcceptBooking(booking.booking_id)}
                                  disabled={processingBookingId === booking.booking_id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleRejectBooking(booking.booking_id)}
                                  disabled={processingBookingId === booking.booking_id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {!isProvider && isPending && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleCancelBooking(booking.booking_id)}
                                disabled={processingBookingId === booking.booking_id}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            )}
                            {isConfirmed && (
                              <Button 
                                onClick={() => handleCompleteBooking(booking.booking_id)}
                                disabled={processingBookingId === booking.booking_id}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Booking Details</h3>
                            <div className="space-y-3">
                              <div className="flex items-start">
                                <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                                <div>
                                  <p className="font-medium">Scheduled Date & Time</p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {formatDateTime(booking.scheduled_datetime)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                                <div>
                                  <p className="font-medium">Duration</p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {booking.duration_minutes} minutes
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <DollarSign className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                                <div>
                                  <p className="font-medium">Time Credits</p>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {booking.time_credits_used} credits
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                              {isProvider ? "Customer" : "Service Provider"}
                            </h3>
                            <div className="flex items-start mb-4">
                              <User className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium">
                                  {isProvider ? booking.booker_name : booking.service_provider_name}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  Booking made on {formatDateTime(booking.booking_date)}
                                </p>
                              </div>
                            </div>
                            
                            {booking.message && (
                              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <MessageSquare className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Message</p>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                      {booking.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
