// Mock data for service requests
export const serviceRequestsData = [
  {
    id: "req1",
    title: "Need help with website development",
    description:
      "I'm looking for someone to help me build a personal portfolio website. I need a clean, modern design with a portfolio section, about me, and contact form. I have some design ideas but am open to suggestions.",
    category: "Web Development",
    budget: 15,
    location: "Remote",
    urgency: "Medium",
    deadline: "2023-12-15",
    createdAt: "2023-10-20",
    status: "Open",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    preferredAvailability: "Weekends",
    additionalNotes:
      "I'd prefer someone who has experience with React and can implement some simple animations. The site should be responsive and work well on mobile devices.",
    user: {
      id: "u1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.8,
      memberSince: "2022-05-10",
      completedProjects: 12,
      responseRate: "95%",
      location: "New York, USA",
    },
    availability: ["weekends", "weekday-evenings"], // From form availability options
    requirements: "Must have experience with React and responsive design",
    whatIncluded: "All design mockups and content will be provided",
    tags: ["react", "portfolio", "responsive", "beginner-friendly"],
    images: [
      {
        id: 1,
        url: "/placeholder.svg?height=200&width=300&text=Website+Mockup",
        name: "website-mockup.jpg",
      },
    ],
  },
  {
    id: "req2",
    title: "Social media content creation for small business",
    description:
      "I run a small coffee shop and need help creating engaging social media content for Instagram and Facebook. I'm looking for someone who can create posts, stories, and short videos that showcase our products and create a warm, welcoming brand presence. I need content for about 2-3 posts per week.",
    category: "Digital Marketing",
    budget: 18,
    location: "Remote",
    urgency: "Medium",
    deadline: "2023-12-01",
    createdAt: "2023-10-22",
    status: "Open",
    skills: ["Social Media Marketing", "Content Creation", "Photography", "Video Editing", "Brand Strategy"],
    preferredAvailability: "Flexible",
    additionalNotes:
      "I can provide photos of our products and space, but would love someone who can also help with styling and creative direction. Experience with food/beverage brands is a plus. Looking for someone who understands the local coffee culture.",
    user: {
      id: "u5",
      name: "David Kim",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.6,
      memberSince: "2021-11-20",
      completedProjects: 7,
      responseRate: "88%",
      location: "Seattle, USA",
    },
    availability: ["weekdays", "weekday-evenings"],
    requirements: "Experience with food/beverage brands is a plus",
    whatIncluded: "Photos of our products and space",
    tags: ["social-media", "content-creation", "coffee-shop", "instagram"],
    images: [
      {
        id: 2,
        url: "/placeholder.svg?height=200&width=300&text=Coffee+Shop",
        name: "coffee-shop.jpg",
      },
    ],
  },
  {
    id: "req3",
    title: "Looking for a graphic designer for logo creation",
    description:
      "I need a professional logo for my new bakery business. I want something that conveys warmth, tradition, and quality. The name of the bakery is 'Sweet Mornings' and I'd like the logo to incorporate some bakery elements.",
    category: "Graphic Design",
    budget: 20,
    location: "Remote",
    urgency: "High",
    deadline: "2023-11-05",
    createdAt: "2023-10-15",
    status: "Open",
    skills: ["Logo Design", "Branding", "Illustrator", "Photoshop"],
    preferredAvailability: "Flexible",
    additionalNotes:
      "I need the logo in various formats (PNG, SVG, etc.) and would also like a simple brand guide with color codes and font recommendations.",
    user: {
      id: "u2",
      name: "Sarah Miller",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.5,
      memberSince: "2021-08-15",
      completedProjects: 8,
      responseRate: "90%",
      location: "Chicago, USA",
    },
    availability: ["weekdays", "weekends"],
    requirements: "Logo in various formats (PNG, SVG, etc.) and a simple brand guide",
    whatIncluded: "Bakery name and design preferences",
    tags: ["logo-design", "branding", "bakery", "sweet-mornings"],
    images: [
      {
        id: 3,
        url: "/placeholder.svg?height=200&width=300&text=Bakery+Logo",
        name: "bakery-logo.jpg",
      },
    ],
  },
  {
    id: "req4",
    title: "Math tutor needed for high school student",
    description:
      "Looking for a math tutor for my 16-year-old son who is struggling with calculus. He needs help understanding the concepts and preparing for upcoming exams.",
    category: "Education",
    budget: 25,
    location: "Local Only - Boston",
    urgency: "Medium",
    deadline: "2023-12-20",
    createdAt: "2023-10-18",
    status: "Open",
    skills: ["Calculus", "Teaching", "Patience"],
    preferredAvailability: "Weekday evenings",
    additionalNotes:
      "We're looking for someone who can explain concepts clearly and has experience teaching high school students. Sessions would be twice a week, 1.5 hours each.",
    user: {
      id: "u3",
      name: "Michael Chen",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.9,
      memberSince: "2022-01-05",
      completedProjects: 5,
      responseRate: "100%",
      location: "Boston, USA",
    },
    availability: ["weekday-evenings"],
    requirements: "Experience teaching high school students",
    whatIncluded: "Textbooks and past exams",
    tags: ["math-tutor", "calculus", "high-school", "boston"],
    images: [],
  },
  {
    id: "req5",
    title: "Home garden design consultation",
    description:
      "I need help designing my home garden. I have a small backyard (approximately 500 sq ft) and would like to create a low-maintenance garden with native plants that attract pollinators. I'm looking for someone with experience in sustainable gardening who can provide plant recommendations and a basic layout.",
    category: "Home & Garden",
    budget: 12,
    location: "Local Only - Portland",
    urgency: "Low",
    deadline: "2024-01-15",
    createdAt: "2023-10-25",
    status: "Open",
    skills: ["Garden Design", "Native Plants", "Sustainable Landscaping"],
    preferredAvailability: "Weekends",
    additionalNotes:
      "I have a partial shade yard with clay soil. I'd like to include some edible plants if possible. Budget for plants is separate from the consultation fee.",
    user: {
      id: "u4",
      name: "Emily Rodriguez",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.7,
      memberSince: "2022-03-12",
      completedProjects: 3,
      responseRate: "85%",
      location: "Portland, USA",
    },
    availability: ["weekends"],
    requirements: "Experience in sustainable gardening",
    whatIncluded: "Backyard dimensions and soil information",
    tags: ["garden-design", "native-plants", "sustainable-landscaping", "portland"],
    images: [
      {
        id: 4,
        url: "/placeholder.svg?height=200&width=300&text=Backyard+Garden",
        name: "backyard-garden.jpg",
      },
    ],
  },
  {
    id: "req6",
    title: "Personal fitness training sessions",
    description:
      "I'm looking for a certified personal trainer to help me get back in shape. I need someone who can create a customized workout plan and provide motivation. I prefer outdoor workouts when weather permits, but also need indoor alternatives.",
    category: "Health & Fitness",
    budget: 30,
    location: "Local Only - San Francisco",
    urgency: "Low",
    deadline: "2024-02-01",
    createdAt: "2023-10-28",
    status: "Open",
    skills: ["Personal Training", "Fitness Planning", "Motivation", "Outdoor Workouts"],
    preferredAvailability: "Mornings and evenings",
    additionalNotes:
      "I have some old injuries (knee and shoulder) so I need someone who understands how to work around physical limitations. I'm a complete beginner but very motivated to get healthy.",
    user: {
      id: "u6",
      name: "Jessica Wong",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.4,
      memberSince: "2023-02-14",
      completedProjects: 2,
      responseRate: "92%",
      location: "San Francisco, USA",
    },
    availability: ["mornings", "weekday-evenings"],
    requirements: "Certified personal trainer",
    whatIncluded: "Access to a gym",
    tags: ["personal-training", "fitness-planning", "san-francisco", "workout"],
    images: [],
  },
  {
    id: "req7",
    title: "Spanish language tutoring for beginner",
    description:
      "I'm planning a trip to Spain next year and want to learn basic Spanish conversation skills. Looking for a patient tutor who can help me with pronunciation, basic grammar, and everyday phrases. Prefer someone who is a native speaker or has lived in Spain.",
    category: "Education",
    budget: 22,
    location: "Remote",
    urgency: "Low",
    deadline: "2024-03-15",
    createdAt: "2023-10-30",
    status: "Open",
    skills: ["Spanish Language", "Teaching", "Conversation Practice", "Cultural Knowledge"],
    preferredAvailability: "Evenings",
    additionalNotes:
      "I'm a complete beginner but I learn quickly. I'd like to focus on practical conversation skills rather than formal grammar. Cultural tips about Spain would be a bonus!",
    user: {
      id: "u7",
      name: "Robert Taylor",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.3,
      memberSince: "2021-09-08",
      completedProjects: 6,
      responseRate: "87%",
      location: "Denver, USA",
    },
    availability: ["weekday-evenings"],
    requirements: "Native speaker or has lived in Spain",
    whatIncluded: "Willingness to learn",
    tags: ["spanish-language", "tutoring", "conversation", "remote"],
    images: [],
  },
  {
    id: "req8",
    title: "Wedding photography consultation",
    description:
      "Getting married in 6 months and need help choosing the right photographer and planning the photo timeline for our wedding day. Looking for someone with wedding planning experience who can guide us through the process and help us make the best decisions.",
    category: "Photography",
    budget: 35,
    location: "Local Only - Austin",
    urgency: "High",
    deadline: "2023-11-30",
    createdAt: "2023-10-26",
    status: "Open",
    skills: ["Wedding Photography", "Event Planning", "Vendor Coordination", "Timeline Planning"],
    preferredAvailability: "Weekends",
    additionalNotes:
      "This is our first wedding so we're pretty overwhelmed with all the decisions. We want someone who can help us understand what to look for in a photographer and how to plan the day for the best photos.",
    user: {
      id: "u8",
      name: "Amanda Foster",
      image: "/placeholder.svg?height=200&width=200",
      rating: 4.9,
      memberSince: "2020-06-22",
      completedProjects: 15,
      responseRate: "98%",
      location: "Austin, USA",
    },
    availability: ["weekends"],
    requirements: "Wedding planning experience",
    whatIncluded: "Wedding date and venue",
    tags: ["wedding-photography", "event-planning", "austin", "timeline"],
    images: [],
  },
]

// Helper function to get a service request by ID
export const getServiceRequestById = (id) => {
  return serviceRequestsData.find((request) => request.id === id)
}

// Helper function to get all service requests
export const getAllServiceRequests = () => {
  return serviceRequestsData
}

// Helper function to get unique categories
export const getServiceRequestCategories = () => {
  return [...new Set(serviceRequestsData.map((request) => request.category))]
}

// Helper function to filter service requests
export const filterServiceRequests = (filters) => {
  const { searchTerm, category, urgency, location } = filters

  return serviceRequestsData.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !category || category === "all" || request.category === category
    const matchesUrgency = !urgency || urgency === "all" || request.urgency === urgency
    const matchesLocation =
      !location ||
      location === "all" ||
      (location === "remote" && request.location === "Remote") ||
      (location === "local" && request.location.includes("Local"))

    return matchesSearch && matchesCategory && matchesUrgency && matchesLocation
  })
}

// Helper function to sort service requests
export const sortServiceRequests = (requests, sortBy) => {
  const sortedRequests = [...requests]

  switch (sortBy) {
    case "newest":
      return sortedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    case "oldest":
      return sortedRequests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case "budget-high":
      return sortedRequests.sort((a, b) => b.budget - a.budget)
    case "budget-low":
      return sortedRequests.sort((a, b) => a.budget - b.budget)
    case "deadline":
      return sortedRequests.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    default:
      return sortedRequests
  }
}
