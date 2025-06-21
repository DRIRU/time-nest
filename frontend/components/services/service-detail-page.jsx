"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  Clock,
  Heart,
  Share2,
  Calendar,
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  Shield,
  DollarSign,
} from "lucide-react"

export default function ServiceDetailPage({ service }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const router = useRouter()

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

  const handleContactProvider = () => {
    router.push(
      `/chat/${service.providerId}?context=service&id=${service.id}&title=${encodeURIComponent(service.title)}`,
    )
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
                        `/placeholder.svg?height=256&width=320&query=${encodeURIComponent(service.title) || "/placeholder.svg"}`
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
                        <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>Response time: {service.responseTime || "2-4 hours"}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <Star className="h-5 w-5 mr-2 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                        <span>
                          {service.rating}/5 ({service.reviewCount} reviews)
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
                          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Response Time:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {service.responseTime || "2-4 hours"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills & Expertise</h3>

                      {service.skills && service.skills.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {service.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
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
                            src={`/placeholder.svg?height=64&width=64&query=${encodeURIComponent(service.provider)}`}
                            alt={service.provider}
                          />
                          <AvatarFallback className="text-lg">{service.provider.charAt(0)}</AvatarFallback>
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
                          <p className="text-2xl font-bold text-blue-600">{service.reviewCount}</p>
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

                <Button className="w-full" size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>

                <Button variant="outline" className="w-full" onClick={handleContactProvider}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Provider
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Join TimeNest to book services and contact providers
                </p>
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
                  <span className="font-medium">{service.reviewCount}</span>
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
    </div>
  )
}
