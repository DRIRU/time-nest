"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, X, Grid, List } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"

export default function ServicesPageClient({ initialServices, searchParams }) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const { currentUser } = useAuth()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [initialParamsLoaded, setInitialParamsLoaded] = useState(false)

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5])
  const [location, setLocation] = useState("any")
  const [rating, setRating] = useState("any")
  const [availability, setAvailability] = useState([])
  const [filteredServices, setFilteredServices] = useState(initialServices || [])

  // Load categories on mount
  useEffect(() => {
    setCategories(getCategories())
  }, [])

  // Load initial search params
  useEffect(() => {
    const loadInitialParams = async () => {
      try {
        // Get search params safely
        const q = urlSearchParams.get("q") || ""
        const category = urlSearchParams.get("category") || "all"
        
        setSearchQuery(q)
        setSelectedCategory(category)
        setInitialParamsLoaded(true)
      } catch (error) {
        console.error("Error loading search params:", error)
        setInitialParamsLoaded(true)
      }
    }

    loadInitialParams()
  }, [urlSearchParams])

  // Filter out current user's services
  useEffect(() => {
    if (initialServices && currentUser) {
      // Filter out services created by the current user
      const servicesExcludingCurrentUser = initialServices.filter(service => {
        // Check if the service was created by the current user
        if (service.creator_id && currentUser.user_id) {
          return service.creator_id !== currentUser.user_id;
        }
        return true; // Keep the service if we can't determine ownership
      });
      
      setFilteredServices(servicesExcludingCurrentUser);
    }
  }, [initialServices, currentUser]);

  // Apply search and filters
  useEffect(() => {
    // Only apply filters after initial params are loaded
    if (!initialParamsLoaded) return

    setIsLoading(true)

    // Simulate API call delay
    const timer = setTimeout(async () => {
      try {
        const filters = {
        search: searchQuery,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        minCredits: priceRange[0],
        maxCredits: priceRange[1],
        location: location !== "any" ? location : undefined,
        minRating: rating !== "any" ? Number.parseInt(rating) : undefined,
        availability: availability,
      }
        
        let results = await filterServices(filters)
        
        // Filter out current user's services if user is logged in
        if (currentUser) {
          results = results.filter(service => {
            // Check if the service was created by the current user
            if (service.creator_id && currentUser.user_id) {
              return service.creator_id !== currentUser.user_id;
            }
            return true; // Keep the service if we can't determine ownership
          });
        }
        
        setFilteredServices(results)
        setIsLoading(false)
      } catch (error) {
        console.error("Error filtering services:", error)
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, priceRange, location, rating, availability, initialParamsLoaded, currentUser])

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
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Services</h1>
          <p className="text-gray-400">Find services offered by TimeNest community members using time credits</p>
        </div>

        {/* Search and Filter Bar - Matching requests page style */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for services..."
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
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
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                </SelectContent>
              </Select>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="local">Local Only</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-gray-800 border-gray-700">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filter Services</SheetTitle>
                    <SheetDescription className="text-gray-400">
                      Refine your search with additional filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-white">Time Credits</h3>
                      <div className="px-2">
                        <Slider value={priceRange} min={0} max={5} step={0.5} onValueChange={setPriceRange} />
                        <div className="flex justify-between mt-2 text-sm text-gray-400">
                          <span>{priceRange[0]} credits</span>
                          <span>{priceRange[1]} credits</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-white">Availability</h3>
                      <div className="space-y-2">
                        {["Weekdays", "Evenings", "Weekends"].map((day) => (
                          <div key={day} className="flex items-center space-x-2">
                            <Checkbox
                              id={day}
                              checked={availability.includes(day)}
                              onCheckedChange={() => handleAvailabilityChange(day)}
                            />
                            <label htmlFor={day} className="text-sm text-gray-300">
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <SheetFooter>
                    <Button variant="outline" onClick={resetFilters} className="bg-gray-700 border-gray-600 text-white">
                      Reset Filters
                    </Button>
                    <SheetClose asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">Apply Filters</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </form>
        </div>

        {/* Results Header - Matching requests page style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isLoading ? "Searching..." : `${filteredServices.length} services found`}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategory && selectedCategory !== "all" && (
                <Badge variant="outline" className="flex items-center gap-1 border-gray-600 text-gray-300">
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
                <Badge variant="outline" className="flex items-center gap-1 border-gray-600 text-gray-300">
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="recommended">
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
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
            <div className="flex border border-gray-600 rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-l-none bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
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
              <div key={i} className="bg-gray-800 animate-pulse rounded-lg h-64"></div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No services found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search or filters to find what you're looking for</p>
            <Button onClick={resetFilters} className="bg-blue-600 hover:bg-blue-700">
              Clear all filters
            </Button>
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
  )
}
