"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MapPin,
  Calendar,
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  CheckCircle,
  Shield,
  Star,
  DollarSign,
  Clock,
  X,
  CalendarIcon,
  AlertCircle,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ReportDialog from "@/components/reports/report-dialog"
import { getServiceById, addServiceBooking, checkSufficientCredits } from "@/lib/database-services"
import { initiateServiceChat } from "@/lib/chat-data"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { format, parseISO, set } from "date-fns"

export default function ServiceDetailPage({ initialService = null }) {
  const [service, setService] = useState(initialService)
  const [isLoading, setIsLoading] = useState(!initialService)
  const [isFavorited, setIsFavorited] = useState(false)
  const router = useRouter()
  const { isLoggedIn, currentUser } = useAuth()

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [bookingMessage, setBookingMessage] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    if (initialService) {
      setService(initialService)
      setIsLoading(false)
      return
    }

    // If no initialService is provided, we're in client-side navigation
    // and need to fetch the service data
    const fetchService = async () => {
      try {
        setIsLoading(true)
        // Get the service ID from the URL
        const id = window.location.pathname.split('/').pop()
        if (!id) {
          throw new Error("No service ID found in URL")
        }
        
        const fetchedService = await getServiceById(id)
        setService(fetchedService)
      } catch (error) {
        console.error("Error fetching service:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
  }, [initialService])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Service Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">The service you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service.title,
        text: `Check out this service: ${service.title} by ${service.provider}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleContactProvider = async () => {
    if (!isLoggedIn) {
      alert("Please log in to contact the service provider")
      router.push(`/login?redirect=/services/${service.id}`)
      return
    }

    try {
      // Create or get conversation with the service provider
      const conversation = await initiateServiceChat(
        parseInt(service.id),
        service.title,
        parseInt(service.creator_id)
      )

      // Navigate to the chat page
      router.push(`/chat/${service.creator_id}?conversation_id=${conversation.conversation_id}`)
    } catch (error) {
      console.error("Error initiating chat:", error)
      alert("Failed to start conversation. Please try again.")
    }
  }

  const handleBookNow = () => {
    if (!isLoggedIn) {
      alert("Please log in to book this service")
      router.push(`/login?redirect=/services/${service.id}`)
      return
    }
    setShowBookingModal(true)
  }

  const handleConfirmBooking = async () => {
    if (!isLoggedIn) {
      alert("Please log in to book this service")
      router.push(`/login?redirect=/services/${service.id}`)
      return
    }

    setBookingLoading(true)
    setBookingError("")

    try {
      // Combine date and time into a single datetime
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledDatetime = set(selectedDate, { hours, minutes })
      
      // Calculate time credits based on duration
      const timeCreditsPerHour = parseFloat(service.timeCredits)
      const timeCreditsUsed = (timeCreditsPerHour / 60) * durationMinutes
      
      // Check if user has sufficient credits
      const hasSufficientCredits = await checkSufficientCredits(timeCreditsUsed)
      if (!hasSufficientCredits) {
        setBookingError(`Insufficient credits. You need ${timeCreditsUsed.toFixed(2)} credits for this booking. Please top up your account.`)
        return
      }
      
      const bookingData = {
        service_id: parseInt(service.id),
        scheduled_datetime: scheduledDatetime.toISOString(),
        duration_minutes: durationMinutes,
        message: bookingMessage,
        time_credits_used: timeCreditsUsed
      }

      const result = await addServiceBooking(bookingData)
      
      setBookingSuccess(true)
      
      // Reset form
      setBookingMessage("")
      
      // Close modal after a delay
      setTimeout(() => {
        setShowBookingModal(false)
        setBookingSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error("Error booking service:", error)
      setBookingError(error.message || "Failed to book service. Please try again.")
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-80 h-64 flex-shrink-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                    <img
                      src={
                        service.image ||
                        `/placeholder.svg?height=256&width=320&text=${encodeURIComponent(service.title)}`
                      }
                      alt={service.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          {service.title}
                        </h1>
                        <Badge variant="outline" className="mb-3">
                          {service.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setIsFavorited(!isFavorited)}>
                          <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleShare}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{service.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <Star className="h-5 w-5 mr-2 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                        <span>
                          {service.rating}/5 ({service.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Starting Price</p>
                          <p className="text-2xl font-bold text-blue-600">{service.timeCredits} credits/hour</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Details Tabs */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="skills">Skills & Expertise</TabsTrigger>
                    <TabsTrigger value="provider">About Provider</TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Service Description</h3>
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{service.description}</p>

                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">What's Included:</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Professional consultation
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Personalized guidance
                            </li>
                            <li className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Follow-up support
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Availability:</h4>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {service.availability && service.availability.length > 0 ? (
                              service.availability.map((time, index) => (
                                <li key={index} className="flex items-center">
                                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                                  {time}
                                </li>
                              ))
                            ) : (
                              <li className="flex items-center">
                                <Clock className="h-4 w-4 text-blue-500 mr-2" />
                                Flexible
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills & Expertise</h3>

                      {service.skills && service.skills.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {service.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-300">No specific skills listed for this service.</p>
                      )}

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Specializations:</h4>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          <li>• Expert in {service.category.toLowerCase()}</li>
                          <li>• Years of professional experience</li>
                          <li>• Proven track record</li>
                          <li>• Client satisfaction focused</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="provider" className="mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <Avatar className="h-16 w-16 mr-4">
                          <AvatarImage
                            src={`/placeholder.svg?height=64&width=64&text=${encodeURIComponent(service.provider?.charAt(0) || "P")}`}
                            alt={service.provider}
                          />
                          <AvatarFallback className="text-lg">{service.provider?.charAt(0) || "P"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{service.provider}</h3>
                          <p className="text-gray-600 dark:text-gray-300">TimeNest Member since 2023</p>
                          <div className="flex items-center mt-1">
                            <Shield className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">Verified Provider</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{service.rating}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Average Rating</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{service.totalReviews || 0}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Reviews</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-lg font-bold text-blue-600 break-words">{service.location}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Location</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Service Card */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="h-5 w-5" />
                  Book Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-blue-900">{service.timeCredits} Time Credits per hour</p>
                  <p className="text-sm text-blue-700">Starting price</p>
                </div>

                <Button className="w-full" size="lg" onClick={handleBookNow}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>

                <Button variant="outline" className="w-full" onClick={handleContactProvider}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Provider
                </Button>

                {/* Debug: always show report button temporarily */}
                {isLoggedIn && currentUser && (
                  <Button 
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950" 
                    onClick={() => {
                      console.log("Report button clicked - currentUser:", currentUser);
                      console.log("Service creator_id:", service.creator_id);
                      setShowReportModal(true);
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Service
                  </Button>
                )}

                {!isLoggedIn && (
                  <p className="text-xs text-gray-500 text-center">
                    Join TimeNest to book services and contact providers
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Service Quick Info */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Category:</span>
                  <Badge variant="outline">{service.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Rating:</span>
                  <span className="font-medium">{service.rating}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Reviews:</span>
                  <span className="font-medium">{service.totalReviews || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Location:</span>
                  <span className="font-medium">{service.location}</span>
                </div>
                <Separator />
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Verified Service</span>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Shield className="h-5 w-5" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>• Always communicate through TimeNest platform</p>
                <p>• Verify service details before booking</p>
                <p>• Check provider ratings and reviews</p>
                <p>• Report any suspicious activity</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
            <DialogDescription>
              Select a date, time, and duration to book this service.
            </DialogDescription>
          </DialogHeader>
          
          {bookingSuccess ? (
            <div className="py-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-green-800 dark:text-green-300 font-medium">Booking Successful!</h3>
                </div>
                <p className="text-green-700 dark:text-green-400 mt-2 text-sm">
                  Your booking request has been sent to the service provider. You'll be notified when they respond.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="py-4">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Calendar Column */}
                  <div className="md:w-1/2">
                    <h3 className="text-sm font-medium mb-2">Select Date</h3>
                    <div className="border rounded-md p-2 flex justify-center">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={(date) => date < new Date()}
                        className="mx-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Time and Duration Column */}
                  <div className="md:w-1/2 space-y-4">
                    <div>
                      <Label htmlFor="time" className="text-sm font-medium mb-2 block">Select Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-sm font-medium mb-2 block">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum: 15 minutes, Maximum: 8 hours (480 minutes)
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Service Rate:</span>
                        <span className="font-bold">{service.timeCredits} credits/hour</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Duration:</span>
                        <span className="font-medium">{durationMinutes} minutes</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Cost:</span>
                        <span className="font-bold text-blue-600">
                          {((service.timeCredits / 60) * durationMinutes).toFixed(2)} credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="message" className="text-sm font-medium mb-2 block">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add any specific details or questions for the service provider..."
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Selected date and time: {selectedDate ? format(selectedDate, "PPP") : "None"} at {selectedTime}
                  </p>
                </div>

                {bookingError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>{bookingError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? "Processing..." : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={service.creator_id}
        serviceId={service.service_id || service.id}
        serviceName={service.title}
        reportType="service"
      />
    </div>
  )
}