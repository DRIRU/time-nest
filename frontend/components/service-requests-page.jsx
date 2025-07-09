"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import LocationAutocomplete from "./location-autocomplete"

export default function ServiceRequestsPage({ searchParams }) {
  const router = useRouter()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState(searchParams?.q || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.category || "all")
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [filteredRequests, setFilteredRequests] = useState([])

  // Filter states
  const [budgetRange, setBudgetRange] = useState([0, 10])
  const [location, setLocation] = useState("any")
  const [urgency, setUrgency] = useState("any")
  const [availability, setAvailability] = useState([])

  // Mock data for service requests
  const mockRequests = [
    {
      id: "1",
      title: "Need help with garden cleanup",
      description:
        "Looking for someone to help clean up my backyard garden before winter. Need weeding, pruning, and general cleanup. The garden is medium-sized with various plants and some overgrown areas.",
      budget: 4.0,
      location: "Kochi, Kerala",
      category: "Home & Garden",
      requester: "Priya Sharma",
      requesterImage: "/placeholder.svg?height=40&width=40&text=PS",
      deadline: "2024-12-30",
      urgency: "normal",
      image: "/placeholder.svg?height=200&width=300&text=Garden+Cleanup",
      availability: ["Weekend Mornings", "Weekend Afternoons"],
      requirements: "Must have own tools and experience with garden maintenance",
      whatIncluded: "All materials and refreshments provided",
      tags: ["outdoor", "physical-work", "weekend"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      proposals: 3,
    },
    {
      id: "2",
      title: "Web design for small business",
      description:
        "Need a simple website designed for my local bakery. Looking for someone who can create a modern, mobile-friendly design with menu display and contact information.",
      budget: 8.0,
      location: "Thiruvananthapuram, Kerala",
      category: "Tech Support",
      requester: "Ravi Kumar",
      requesterImage: "/placeholder.svg?height=40&width=40&text=RK",
      deadline: "2025-01-15",
      urgency: "low",
      image: "/placeholder.svg?height=200&width=300&text=Web+Design",
      availability: ["Weekday Evenings", "Weekend Afternoons"],
      requirements: "Portfolio of previous web design work required",
      whatIncluded: "Content, images, and hosting details provided",
      tags: ["creative", "online", "business"],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      proposals: 7,
    },
    {
      id: "3",
      title: "Math tutoring for high school student",
      description:
        "My daughter needs help with advanced mathematics for her 12th grade exams. Looking for an experienced tutor who can explain concepts clearly and help with practice problems.",
      budget: 6.0,
      location: "Thrissur, Kerala",
      category: "Tutoring",
      requester: "Meera Nair",
      requesterImage: "/placeholder.svg?height=40&width=40&text=MN",
      deadline: "2025-02-28",
      urgency: "high",
      image: "/placeholder.svg?height=200&width=300&text=Math+Tutoring",
      availability: ["Weekday Evenings"],
      requirements: "Experience teaching high school mathematics",
      whatIncluded: "Study materials and quiet study space provided",
      tags: ["education", "academic", "exam-prep"],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      proposals: 12,
    },
    {
      id: "4",
      title: "Photography for wedding event",
      description:
        "Looking for a professional photographer for our small wedding ceremony. Need someone who can capture candid moments and provide edited photos within a week.",
      budget: 12.0,
      location: "Kozhikode, Kerala",
      category: "Photography",
      requester: "Anjali & Suresh",
      requesterImage: "/placeholder.svg?height=40&width=40&text=AS",
      deadline: "2024-12-28",
      urgency: "urgent",
      image: "/placeholder.svg?height=200&width=300&text=Wedding+Photography",
      availability: ["Weekend Afternoons"],
      requirements: "Professional camera equipment and portfolio required",
      whatIncluded: "Venue access, meal, and specific shot list provided",
      tags: ["professional", "event", "creative"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      proposals: 5,
    },
    {
      id: "5",
      title: "Computer repair and data recovery",
      description:
        "My laptop crashed and won't start. Need someone to diagnose the issue, repair if possible, and recover important documents and photos from the hard drive.",
      budget: 5.0,
      location: "Palakkad, Kerala",
      category: "Tech Support",
      requester: "Arjun Menon",
      requesterImage: "/placeholder.svg?height=40&width=40&text=AM",
      deadline: "2024-12-25",
      urgency: "high",
      image: "/placeholder.svg?height=200&width=300&text=Computer+Repair",
      availability: ["Flexible"],
      requirements: "Experience with laptop repair and data recovery",
      whatIncluded: "Laptop and any necessary cables provided",
      tags: ["technical", "urgent", "data-recovery"],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open",
      proposals: 8,
    },
  ]

  const categories = [
    { id: 1, name: "Home & Garden" },
    { id: 2, name: "Tech Support" },
    { id: 3, name: "Tutoring" },
    { id: 4, name: "Transportation" },
    { id: 5, name: "Cooking" },
    { id: 6, name: "Childcare" },
    { id: 7, name: "Repairs" },
    { id: 8, name: "Health & Wellness" },
    { id: 9, name: "Arts & Crafts" },
    { id: 10, name: "Photography" },
    { id: 11, name: "Language Exchange" },
    { id: 12, name: "Fitness" },
    { id: 13, name: "Other" },
  ]

  // Apply filters
  useEffect(() => {
    setIsLoading(true)

    const timer = setTimeout(() => {
      let filtered = [...mockRequests]

      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (request) =>
            request.title.toLowerCase().includes(query) ||
            request.description.toLowerCase().includes(query) ||
            request.category.toLowerCase().includes(query),
        )
      }

      // Apply category filter
      if (selectedCategory && selectedCategory !== "all") {
        filtered = filtered.filter((request) => request.category === selectedCategory)
      }

      // Apply budget range filter
      filtered = filtered.filter((request) => request.budget >= budgetRange[0] && request.budget <= budgetRange[1])

      // Apply location filter
      if (location && location !== "any") {
        filtered = filtered.filter((request) => {
          if (!request.location) return false
          const requestLocationParts = request.location
            .toLowerCase()
            .split(",")
            .map((part) => part.trim())
          const filterLocationParts = location
            .toLowerCase()
            .split(",")
            .map((part) => part.trim())
          return filterLocationParts.some((filterPart) =>
            requestLocationParts.some((requestPart) => requestPart.includes(filterPart)),
          )
        })
      }

      // Apply urgency filter
      if (urgency !== "any") {
        filtered = filtered.filter((request) => request.urgency === urgency)
      }

      // Apply availability filter
      if (availability.length > 0) {
        filtered = filtered.filter((request) =>
          availability.some((day) =>
            request.availability.some((requestDay) => requestDay.toLowerCase().includes(day.toLowerCase())),
          ),
        )
      }

      setFilteredRequests(filtered)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, budgetRange, location, urgency, availability])

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
      case "urgent":
        return "bg-red-100 text-red-700"
      case "high":
        return "bg-orange-100 text-orange-700"
      case "normal":
        return "bg-blue-100 text-blue-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
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
              <Link href="/services" className="text-gray-700 hover:text-blue-600 transition-colors">
                Browse Services
              </Link>
              <Link href="/requests" className="text-blue-600 font-medium">
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
              <Select defaultValue="newest">
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
