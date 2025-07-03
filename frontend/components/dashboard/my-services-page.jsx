"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Clock, 
  Edit, 
  Trash, 
  Plus, 
  Search,
  Calendar,
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { getAllServices } from "@/lib/database-services"
import DashboardSidebar from "./dashboard-sidebar"
import Link from "next/link"

export default function MyServicesPage() {
  const router = useRouter()
  const { isLoggedIn, currentUser } = useAuth()
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/dashboard/my-services")
      return
    }

    const fetchServices = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const allServices = await getAllServices()
        
        // Filter services created by the current user
        const myServices = allServices.filter(service => 
          service.creator_id === parseInt(currentUser?.user_id)
        )
        
        setServices(myServices)
        setFilteredServices(myServices)
      } catch (error) {
        console.error("Error fetching services:", error)
        setError("Failed to load services. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchServices()
  }, [isLoggedIn, router, currentUser])

  useEffect(() => {
    // Filter services based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const filtered = services.filter(service => 
        service.title.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term)
      )
      setFilteredServices(filtered)
    } else {
      setFilteredServices(services)
    }
  }, [searchTerm, services])

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Services</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage the services you've listed on TimeNest
                </p>
              </div>
              <Link href="/list-service">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  List New Service
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your services..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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

            {/* Services List */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No services match your search" : "You haven't listed any services yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? "Try a different search term or clear your search" 
                    : "Share your skills with the community and earn time credits"}
                </p>
                <Link href="/list-service">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    List Your First Service
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-video relative">
                      <img
                        src={service.image || `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(service.title)}`}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2">{service.timeCredits} credits/hr</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <Badge variant="outline" className="w-fit mt-1">{service.category}</Badge>
                    </CardHeader>
                    <CardContent className="pb-2 flex-grow">
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {service.availability && service.availability.length > 0
                            ? service.availability.slice(0, 2).join(", ") + 
                              (service.availability.length > 2 ? "..." : "")
                            : "Flexible"}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2 border-t">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/services/${service.id}`}>
                          View
                        </Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}