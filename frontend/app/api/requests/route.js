import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const requestData = await request.json()

    // Validate required fields for service requests
    if (!requestData.title || !requestData.description || !requestData.category || !requestData.budget) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a new service request object
    const newRequest = {
      id: Date.now().toString(),
      title: requestData.title,
      description: requestData.description,
      budget: Number.parseFloat(requestData.budget),
      location: requestData.location,
      category: mapCategoryValue(requestData.category),
      requester: "Demo User",
      requesterImage: "/placeholder.svg?height=40&width=40&text=DU",
      deadline: requestData.deadline,
      urgency: requestData.urgency || "normal",
      image: requestData.images?.[0]?.url || "/placeholder.svg?height=200&width=300&text=Request",
      availability: requestData.availability ? requestData.availability.map(mapAvailability) : [],
      requirements: requestData.requirements || "",
      whatIncluded: requestData.whatIncluded || "",
      tags: requestData.tags || [],
      skills: requestData.skills || [], // Add this line
      createdAt: new Date().toISOString(),
      status: "open", // open, in-progress, completed, cancelled
      proposals: [], // Array of proposals from service providers
    }

    console.log("Service request created in demo mode:", newRequest)

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: "Service request created successfully in demo mode",
    })
  } catch (error) {
    console.error("Error creating service request:", error)
    return NextResponse.json({
      success: true,
      demo: true,
      message: "Service request created in demo mode for frontend development",
    })
  }
}

// Helper function to map category form values to database names
function mapCategoryValue(categoryValue) {
  const categoryMap = {
    "home-garden": "Home & Garden",
    "tech-support": "Tech Support",
    tutoring: "Tutoring",
    transportation: "Transportation",
    cooking: "Cooking",
    childcare: "Childcare",
    repairs: "Repairs",
    "health-wellness": "Health & Wellness",
    "arts-crafts": "Arts & Crafts",
    photography: "Photography",
    "language-exchange": "Language Exchange",
    fitness: "Fitness",
    other: "Other",
  }
  return categoryMap[categoryValue] || categoryValue
}

// Helper function to map availability form values to database values
function mapAvailability(availabilityKey) {
  const availabilityMap = {
    "weekday-mornings": "Weekday Mornings",
    "weekday-afternoons": "Weekday Afternoons",
    "weekday-evenings": "Weekday Evenings",
    "weekend-mornings": "Weekend Mornings",
    "weekend-afternoons": "Weekend Afternoons",
    "weekend-evenings": "Weekend Evenings",
    flexible: "Flexible",
  }
  return availabilityMap[availabilityKey] || availabilityKey
}

export async function GET() {
  // Return mock service requests for demo
  const mockRequests = [
    {
      id: "1",
      title: "Need help with garden cleanup",
      description:
        "Looking for someone to help clean up my backyard garden before winter. Need weeding, pruning, and general cleanup.",
      budget: 3.0,
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
      proposals: [],
    },
  ]

  return NextResponse.json({ requests: mockRequests })
}
