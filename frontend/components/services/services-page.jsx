"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Clock, Search, Filter, X, Grid, List } from "lucide-react"
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
import ServiceCard from "./service-card"
import ServiceListItem from "./service-list-item"
import { filterServices, getCategories } from "@/lib/database-services"
import LocationAutocomplete from "../location-autocomplete"
import { useAuth } from "@/contexts/auth-context"

export default function ServicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUser } = useAuth()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [initialParamsLoaded, setInitialParamsLoaded] = useState(false)

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5])
  const [location, setLocation] = useState("any")
  const [rating, setRating] = useState("any")
  const [availability, setAvailability] = useState([])
  const [filteredServices, setFilteredServices] = useState([])

  // Load categories on mount
  useEffect(() => {
    setCategories(getCategories())
  }, [])

  // Load initial search params
  useEffect(() => {
    const loadInitialParams = async () => {
      try {
        // Get search params safely
        const q = searchParams.get("q") || ""
        const category = searchParams.get("category") || "all"

        setSearchQuery(q)
        setSelectedCategory(category)
        setInitialParamsLoaded(true)
      } catch (error) {
        console.error("Error loading search params:", error)
        setInitialParamsLoaded(true)
      }
    }

    loadInitialParams()
  }, [searchParams])

  // Apply search and filters
  useEffect(() => {
    // Only apply filters after initial params are loaded
    if (!initialParamsLoaded) return

    setIsLoading(true)

    // Simulate API call delay
    const timer = setTimeout(() => {
      const filters = {
        search: searchQuery,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        minCredits: priceRange[0],
        maxCredits: priceRange[1],
        location: location !== "any" ? location : undefined,
        minRating: rating !== "any" ? Number.parseInt(rating) : undefined,
        availability: availability,
      }

      let results = filterServices(filters)
      
      // Filter out current user's services if user is logged in
      if (currentUser) {
        results = results.filter(service => {
          const isCurrentUserService = 
            service.creator_id === currentUser.user_id ||
            service.creator_id === currentUser.userId ||
            service.providerId === currentUser.user_id ||
            service.providerId === currentUser.userId;
          
          return !isCurrentUserService;
        });
      }
      
      setFilteredServices(results)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, priceRange, location, rating, availability, initialParamsLoaded, currentUser])

  // Filter out current user's services from initial load
  useEffect(() => {
    if (currentUser) {
      // Apply the filter to exclude current user's services
      const timer = setTimeout(() => {
        const filters = {
          search: searchQuery,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          minCredits: priceRange[0],
          maxCredits: priceRange[1],
          location: location !== "any" ? location : undefined,
          minRating: rating !== "any" ? Number.parseInt(rating) : undefined,
          availability: availability,
        }

        let results = filterServices(filters)
        
        // Filter out current user's services
        results = results.filter(service => {
          // Check if the service was created by the current user
          if (service.creator_id && currentUser.user_id) {
            return service.creator_id !== currentUser.user_id;
          }
          return true; // Keep the service if we can't determine ownership
        });
        
        setFilteredServices(results)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [currentUser])

  // Update URL with search params
  const updateSearchParams = (query, category) => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category && category !== "all") params.set("category", category)

    const newUrl = `/services${params.toString() ? `?${params.toString()}` : ""}`
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
    setPriceRange([0, 5])
    setLocation("any")
    setRating("any")
    setAvailability([])
    setSelectedCategory("all")
    updateSearchParams(searchQuery, "")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">TimeNest</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/services" className="text-blue-600 font-medium">
                Browse Services
              </Link>
              <Link href="/requests" className="text-gray-700 hover:text-blue-600 transition-colors">
                Service Requests
              </Link>
              <Link href="/#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors">
                How It Works
              </Link>
              <Link href="/list-service" className="text-gray-700 hover:text-blue-600 transition-colors">
                List Service
              </Link>
              <Link
                href="/#support"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = "/#support"
                }}
              >
                Support
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Join Community</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Services</h1>
          <p className="text-gray-600">Find services offered by TimeNest community members using time credits</p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/requests">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Service Requests
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
                placeholder="Search for services..."
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
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
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
                  <SheetTitle>Filter Services</SheetTitle>
                  <SheetDescription>Refine your search with additional filters</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Time Credits</h3>
                    <div className="px-2">
                      <Slider value={priceRange} min={0} max={5} step={0.5} onValueChange={setPriceRange} />
                      <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>{priceRange[0]} credits</span>
                        <span>{priceRange[1]} credits</span>
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
                    <h3 className="text-sm font-medium">Minimum Rating</h3>
                    <Select value={rating} onValueChange={setRating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Rating</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Availability</h3>
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
                {isLoading ? "Searching..." : `${filteredServices.length} services found`}
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
              <Select defaultValue="recommended">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating-high">Highest Rating</SelectItem>
                  <SelectItem value="credits-low">Lowest Credits</SelectItem>
                  <SelectItem value="credits-high">Highest Credits</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
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
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters to find what you're looking for</p>
              <Button onClick={resetFilters}>Clear all filters</Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <ServiceListItem key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
