// Simple wrapper around services-data.js to maintain API compatibility
import {
  getAllServices as getMockServices,
  getServiceById as getMockServiceById,
  filterServices as filterMockServices,
  getCategories as getMockCategories,
} from "./services-data"

// Comment out all database imports and connections
// import { Pool } from "@neondatabase/serverless"
// import connectDB from "./mongodb"
// import User from "./models/User"
// import Service from "./models/Service"
// import Review from "./models/Review"

// Enhanced mock data for frontend development
const MOCK_SERVICES = [
  {
    id: "1",
    title: "Web Development Tutoring",
    description:
      "Get personalized web development tutoring from an experienced instructor. Learn HTML, CSS, JavaScript, React, and more with hands-on projects and real-world examples. Perfect for beginners and intermediate developers looking to advance their skills.",
    timeCredits: 2.0,
    location: "Thiruvananthapuram, Kerala",
    rating: 4.2,
    provider: "John Doe",
    providerImage: "/placeholder.svg?height=40&width=40&text=JD",
    image: "/placeholder.svg?height=200&width=300&text=Web+Development",
    availability: ["Weekday Mornings", "Weekday Evenings"],
    category: "Tutoring",
    totalReviews: 2,
    requirements: "Basic computer knowledge, laptop/desktop with internet connection",
    whatIncluded: "Personalized curriculum, code reviews, project guidance, career advice",
    tags: ["beginner-friendly", "online", "career-focused"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "1",
        reviewer: "Sarah M.",
        rating: 5,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        comment:
          "Excellent tutoring! John explained complex concepts very clearly and was very patient with my questions.",
        date: "December 15, 2024",
      },
      {
        id: "2",
        reviewer: "Mike R.",
        rating: 4,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        comment: "Good sessions, learned a lot about React and JavaScript fundamentals. Would recommend for beginners.",
        date: "November 30, 2024",
      },
    ],
    providerStats: {
      totalServices: 23,
      responseTime: "Within 2 hours",
      memberSince: "March 2023",
      completionRate: "96%",
    },
  },
  {
    id: "2",
    title: "Yoga Classes for All Levels",
    description:
      "Join our relaxing yoga classes to improve your flexibility, reduce stress, and enhance your overall well-being. Suitable for all levels from complete beginners to advanced practitioners. Classes include breathing techniques and meditation.",
    timeCredits: 1.0,
    location: "Kochi, Kerala",
    rating: 5.0,
    provider: "Maya Patel",
    providerImage: "/placeholder.svg?height=40&width=40&text=MP",
    image: "/placeholder.svg?height=200&width=300&text=Yoga+Classes",
    availability: ["Weekend Mornings", "Weekend Afternoons"],
    category: "Fitness",
    totalReviews: 3,
    requirements: "Yoga mat, comfortable clothing, water bottle",
    whatIncluded: "Guided sessions, breathing techniques, meditation, flexibility training",
    tags: ["relaxation", "wellness", "mindfulness", "beginner-friendly"],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "3",
        reviewer: "Priya K.",
        rating: 5,
        comment: "Amazing yoga sessions! Maya is very knowledgeable and creates a peaceful environment.",
        date: "December 10, 2024",
      },
      {
        id: "4",
        reviewer: "Raj S.",
        rating: 5,
        comment: "Perfect for beginners. Very patient instructor and great techniques.",
        date: "December 5, 2024",
      },
      {
        id: "5",
        reviewer: "Anita M.",
        rating: 5,
        comment: "Love the meditation part of the class. Very relaxing and rejuvenating.",
        date: "November 28, 2024",
      },
    ],
    providerStats: {
      totalServices: 15,
      responseTime: "Within 4 hours",
      memberSince: "June 2022",
      completionRate: "98%",
    },
  },
  {
    id: "3",
    title: "Professional Photography Services",
    description:
      "Capture your special moments with our professional photography services. Specializing in events, portraits, family photos, and lifestyle photography. High-quality equipment and professional editing included.",
    timeCredits: 3.0,
    location: "Kozhikode, Kerala",
    rating: 4.5,
    provider: "Rahul Sharma",
    providerImage: "/placeholder.svg?height=40&width=40&text=RS",
    image: "/placeholder.svg?height=200&width=300&text=Photography",
    availability: ["Weekday Mornings", "Weekend Mornings", "Weekend Afternoons"],
    category: "Photography",
    totalReviews: 4,
    requirements: "Clear communication about event details, accessible venue",
    whatIncluded: "Professional equipment, photo editing, digital gallery, consultation",
    tags: ["professional", "events", "portraits", "editing"],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "6",
        reviewer: "Deepa L.",
        rating: 5,
        comment: "Excellent photography for our wedding! Very professional and creative shots.",
        date: "December 8, 2024",
      },
      {
        id: "7",
        reviewer: "Kiran N.",
        rating: 4,
        comment: "Good quality photos and timely delivery. Satisfied with the service.",
        date: "December 1, 2024",
      },
    ],
    providerStats: {
      totalServices: 18,
      responseTime: "Within 12 hours",
      memberSince: "November 2023",
      completionRate: "94%",
    },
  },
  {
    id: "4",
    title: "Traditional Kerala Cooking Lessons",
    description:
      "Learn to cook authentic Kerala dishes with traditional recipes passed down through generations. Perfect for food enthusiasts and beginners alike. Includes vegetarian and non-vegetarian options.",
    timeCredits: 2.0,
    location: "Thrissur, Kerala",
    rating: 4.8,
    provider: "Anita Jose",
    providerImage: "/placeholder.svg?height=40&width=40&text=AJ",
    image: "/placeholder.svg?height=200&width=300&text=Kerala+Cooking",
    availability: ["Weekend Afternoons", "Weekend Evenings"],
    category: "Cooking",
    totalReviews: 5,
    requirements: "Basic kitchen equipment, ingredients (can be provided)",
    whatIncluded: "Recipe cards, cooking techniques, ingredient knowledge, meal planning tips",
    tags: ["traditional", "kerala-cuisine", "authentic", "beginner-friendly"],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "8",
        reviewer: "Meera P.",
        rating: 5,
        comment: "Learned so many authentic recipes! Anita is an excellent teacher.",
        date: "November 25, 2024",
      },
      {
        id: "9",
        reviewer: "Suresh K.",
        rating: 5,
        comment: "Amazing cooking class. Now I can make proper Kerala fish curry!",
        date: "November 20, 2024",
      },
    ],
    providerStats: {
      totalServices: 32,
      responseTime: "Within 1 hour",
      memberSince: "January 2022",
      completionRate: "99%",
    },
  },
  {
    id: "5",
    title: "Guitar Lessons for Beginners",
    description:
      "Learn to play guitar from scratch with patient, experienced instruction. Covers basic chords, strumming patterns, and popular songs. Acoustic and electric guitar lessons available.",
    timeCredits: 1.5,
    location: "Palakkad, Kerala",
    rating: 4.3,
    provider: "Arjun Menon",
    providerImage: "/placeholder.svg?height=40&width=40&text=AM",
    image: "/placeholder.svg?height=200&width=300&text=Guitar+Lessons",
    availability: ["Weekday Evenings", "Weekend Mornings"],
    category: "Tutoring",
    totalReviews: 3,
    requirements: "Guitar (acoustic or electric), pick, willingness to practice",
    whatIncluded: "Sheet music, chord charts, practice exercises, song tutorials",
    tags: ["music", "beginner-friendly", "acoustic", "electric"],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "10",
        reviewer: "Ravi T.",
        rating: 4,
        comment: "Good teacher, very patient with beginners. Learned basic chords quickly.",
        date: "December 12, 2024",
      },
    ],
    providerStats: {
      totalServices: 12,
      responseTime: "Within 6 hours",
      memberSince: "August 2023",
      completionRate: "91%",
    },
  },
  {
    id: "6",
    title: "Home Garden Maintenance",
    description:
      "Professional garden maintenance services including pruning, weeding, planting, and general garden care. Experienced in both ornamental and vegetable gardens.",
    timeCredits: 1.5,
    location: "Kannur, Kerala",
    rating: 4.1,
    provider: "Lakshmi Nair",
    providerImage: "/placeholder.svg?height=40&width=40&text=LN",
    image: "/placeholder.svg?height=200&width=300&text=Garden+Maintenance",
    availability: ["Weekday Mornings", "Weekday Afternoons"],
    category: "Home & Garden",
    totalReviews: 2,
    requirements: "Access to garden area, basic tools (can bring own)",
    whatIncluded: "Pruning, weeding, planting advice, seasonal care tips",
    tags: ["gardening", "maintenance", "plants", "outdoor"],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    reviews: [
      {
        id: "11",
        reviewer: "Vinod R.",
        rating: 4,
        comment: "Good work on the garden. Plants look much healthier now.",
        date: "December 3, 2024",
      },
    ],
    providerStats: {
      totalServices: 8,
      responseTime: "Within 8 hours",
      memberSince: "May 2023",
      completionRate: "87%",
    },
  },
]

// Remove the server-side check function
// function ensureServerSide() {
//   if (typeof window !== "undefined") {
//     throw new Error("This function can only be called on the server side")
//   }
// }

// Simulate database availability check (always return false for mock mode)
const isDatabaseAvailable = async () => {
  return false // Always use mock data for frontend development
}

// Get all services with provider information
export async function getAllServices() {
  // Remove the server-side check
  // ensureServerSide()
  return getMockServices()
}

// Get service by ID with reviews
export async function getServiceById(id) {
  // Remove the server-side check
  // ensureServerSide()
  return getMockServiceById(id)
}

// Add new service to mock data
export async function addService(serviceData) {
  // Remove the server-side check
  // ensureServerSide()

  console.log("Adding service to mock data for frontend development")

  // Create a new service object
  const newService = {
    id: Date.now().toString(),
    title: serviceData.title,
    description: serviceData.description,
    timeCredits: Number.parseFloat(serviceData.timeCredits),
    location: serviceData.location,
    category: mapCategoryValue(serviceData.category),
    provider: "Demo User",
    providerImage: "/placeholder.svg?height=40&width=40&text=DU",
    rating: 0,
    totalReviews: 0,
    image: serviceData.images?.[0]?.url || "/placeholder.svg?height=200&width=300&text=Service",
    availability: serviceData.availability ? serviceData.availability.map(mapAvailability) : [],
    requirements: serviceData.requirements || "",
    whatIncluded: serviceData.whatIncluded || "",
    tags: serviceData.tags || [],
    createdAt: new Date().toISOString(),
    reviews: [],
    providerStats: {
      totalServices: 1,
      responseTime: "Within 24 hours",
      memberSince: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      completionRate: "New provider",
    },
  }

  // In a real app, we would add this to the database
  // For now, we'll just return it
  return newService
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

// Get service statistics for dashboard
export async function getServiceStats() {
  // Remove the server-side check
  // ensureServerSide()

  const services = getMockServices()
  return {
    totalServices: services.length,
    totalUsers: 12,
    totalReviews: services.reduce((sum, service) => sum + service.totalReviews, 0),
    avgRating: 4.4,
  }
}

// Filter services based on criteria
export async function filterServices(filters = {}) {
  // Remove the server-side check
  // ensureServerSide()
  return filterMockServices(filters)
}

// Get categories
export async function getCategories() {
  // Remove the server-side check
  // ensureServerSide()
  return getMockCategories()
}
