"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, Search, Filter, X, Grid, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import ServiceRequestCard from "./service-request-card"
import ServiceRequestListItem from "./service-request-list-item"
import LocationAutocomplete from "../location-autocomplete"
import { filterServiceRequests, sortServiceRequests, getServiceRequestCategories } from "@/lib/service-requests-data"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function ServiceRequestsPage({ initialRequests = [] }) {
  const router = useRouter()
  const { currentUser } = useAuth()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(false)
  const [filteredRequests, setFilteredRequests] = useState(initialRequests)

  // Filter states
  const [budgetRange, setBudgetRange] = useState([0, 10])
  const [location, setLocation] = useState("any")
  const [urgency, setUrgency] = useState("any")
  const [availability, setAvailability] = useState([])
  const [sortBy, setSortBy] = useState("newest")

  // Categories from backend
  const categories = ["all", ...getServiceRequestCategories()]

  // Filter out current user's requests
  useEffect(() => {
    if (initialRequests && currentUser) {
      // Filter out requests created by the current user
      const requestsExcludingCurrentUser = initialRequests.filter(request => {
        // Check if the request was created by the current user
        if (request.creator_id && currentUser.user_id) {
          return request.creator_id !== currentUser.user_id;
        }
        return true; // Keep the request if we can't determine ownership
      });
      
      setFilteredRequests(requestsExcludingCurrentUser);
    }
  }, [initialRequests, currentUser]);

  // Apply filters
  useEffect(() => {
    setIsLoading(true)

    const timer = setTimeout(async () => {
      try {
        // Prepare filters for backend
        const filters = {
          search: searchQuery,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          urgency: urgency !== "any" ? urgency.toLowerCase() : undefined,
          location: location !== "any" ? location : undefined,
        }

        // Fetch filtered requests from backend
        let filtered = await filterServiceRequests(filters)

        // Filter out current user's requests if user is logged in
        if (currentUser) {
          filtered = filtered.filter(request => {
            // Check if the request was created by the current user
            if (request.creator_id && currentUser.user_id) {
              return request.creator_id !== currentUser.user_id;
            }
            return true; // Keep the request if we can't determine ownership
          });
        }

        // Apply budget range filter (frontend-only for now)
        filtered = filtered.filter((request) => 
          request.budget >= budgetRange[0] && request.budget <= budgetRange[1]
        )

        // Apply availability filter (frontend-only for now)
        if (availability.length > 0) {
          filtered = filtered.filter((request) =>
            availability.some((day) =>
              request.availability && request.availability.some((requestDay) => 
                requestDay.toLowerCase().includes(day.toLowerCase())
              )
            )
          )
        }

        // Apply sorting
        const sorted = sortServiceRequests(filtered, sortBy)
        setFilteredRequests(sorted)
      } catch (error) {
        console.error("Error filtering requests:", error)
        // Keep the current filtered requests on error
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, budgetRange, location, urgency, availability, sortBy, initialRequests, currentUser])

  // Update URL with search params
  const updateSearchParams = (query, category) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category && category !== "all") params.set("category", category)

    const newUrl = `/requests${params.toString() ? `?${params.toString()}` : ""}`
    router.push(newUrl, { scroll: false })
  }

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault()
    updateSearchParams(searchQuery, selectedCategory)
  }

  // Handle category change
  const handleCategoryChange = (value) => {
    setSelectedCategory(value)
    updateSearchParams(searchQuery, value)
  }

  // Handle availability checkbox change
  const handleAvailabilityChange = (day) => {
    setAvailability((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setBudgetRange([0, 10])
    setLocation("any")
    setUrgency("any")
    setAvailability([])
    setSelectedCategory("all")
    updateSearchParams(searchQuery, "")
  }

  const getUrgencyColor = (urgencyLevel) => {
    switch (urgencyLevel) {
      case "Urgent":
        return "bg-red-100 text-red-700"
      case "High":
        return "bg-orange-100 text-orange-700"
      case "Normal":
        return "bg-blue-100 text-blue-700"
      case "Low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Requests</h1>
          <p className="text-gray-600">Find service requests from community members who need your help</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/services">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Services
              </Button>
            </Link>
            <Link href="/list-service">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for service requests..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category, index) => (
                    category !== "all" && (
                      <SelectItem key={index} value={category}>
                        {category}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filter Requests</SheetTitle>
                  <SheetDescription>Refine your search with additional filters</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Budget Range</h3>
                    <div className="px-2">
                      <Slider value={budgetRange} min={0} max={15} step={0.5} onValueChange={setBudgetRange} />
                      <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>{budgetRange[0]} credits</span>
                        <span>{budgetRange[1]} credits</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Location</h3>
                    <LocationAutocomplete
                      name="filter-location"
                      value={location}
                      onChange={(value) => setLocation(value || "any")}
                    />
                    <div className="flex items-center mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 p-0 h-auto"
                        onClick={() => setLocation("any")}
                      >
                        Clear location
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Urgency Level</h3>
                    <Select value={urgency} onValueChange={setUrgency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Urgency</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Preferred Time Slots</h3>
                    <div className="space-y-2">
                      {["Weekdays", "Evenings", "Weekends"].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={availability.includes(day)}
                            onCheckedChange={() => handleAvailabilityChange(day)}
                          />
                          <label htmlFor={day} className="text-sm">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                  <SheetClose asChild>
                    <Button>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <Button type="submit">Search</Button>
          </form>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isLoading ? "Searching..." : `${filteredRequests.length} requests found`}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategory && selectedCategory !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {selectedCategory}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSelectedCategory("all")
                        updateSearchParams(searchQuery, "all")
                      }}
                    />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setSearchQuery("")
                        updateSearchParams("", selectedCategory)
                      }}
                    />
                  </Badge>
                )}
                {location && location !== "any" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {location}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setLocation("any")} />
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="deadline">Deadline Soon</SelectItem>
                  <SelectItem value="budget-high">Highest Budget</SelectItem>
                  <SelectItem value="budget-low">Lowest Budget</SelectItem>
                  <SelectItem value="urgent">Most Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters to find what you're looking for</p>
              <Button onClick={resetFilters}>Clear all filters</Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((request) => (
                <ServiceRequestCard key={request.id} request={request} getUrgencyColor={getUrgencyColor} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <ServiceRequestListItem key={request.id} request={request} getUrgencyColor={getUrgencyColor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}