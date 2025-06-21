"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import ServiceRequestCard from "./service-request-card"
import ServiceRequestListItem from "./service-request-list-item"
import {
  getAllServiceRequests,
  getServiceRequestCategories,
  filterServiceRequests,
  sortServiceRequests,
} from "@/lib/service-requests-data"

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedUrgency, setSelectedUrgency] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Simulate API call
    const fetchRequests = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const allRequests = getAllServiceRequests()
      setRequests(allRequests)
      setFilteredRequests(allRequests)
      setLoading(false)
    }

    fetchRequests()
  }, [])

  useEffect(() => {
    // Filter requests based on current filters
    const filtered = filterServiceRequests({
      searchTerm,
      category: selectedCategory,
      urgency: selectedUrgency,
      location: selectedLocation,
    })

    // Sort the filtered requests
    const sorted = sortServiceRequests(filtered, sortBy)
    setFilteredRequests(sorted)
  }, [requests, searchTerm, selectedCategory, selectedUrgency, selectedLocation, sortBy])

  const categories = ["all", ...getServiceRequestCategories()]
  const urgencyLevels = ["all", "High", "Medium", "Low"]
  const locationTypes = ["all", "remote", "local"]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Service Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find requests from TimeNest community members looking for services
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search service requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((urgency) => (
                      <SelectItem key={urgency} value={urgency}>
                        {urgency === "all" ? "All Urgency" : urgency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location === "all" ? "All Locations" : location === "remote" ? "Remote" : "Local Only"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex flex-wrap gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="budget-high">Budget: High to Low</SelectItem>
                      <SelectItem value="budget-low">Budget: Low to High</SelectItem>
                      <SelectItem value="deadline">Deadline: Soonest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""} found
            </h2>
            {searchTerm && <p className="text-gray-600 dark:text-gray-400">Showing results for "{searchTerm}"</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Results */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <Search className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No requests found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or browse all available requests.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                  setSelectedUrgency("all")
                  setSelectedLocation("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredRequests.map((request) =>
              viewMode === "grid" ? (
                <ServiceRequestCard key={request.id} request={request} />
              ) : (
                <ServiceRequestListItem key={request.id} request={request} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
