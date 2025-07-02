// This file handles interactions with the backend API for services

/**
 * Fetches all services from the backend
 * @returns {Promise<Array>} Array of services
 */
export async function getAllServices() {
  try {
    const response = await fetch("http://localhost:8000/api/v1/services", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching services: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the backend service format to frontend format
    return data.map(transformBackendServiceToFrontend);
  } catch (error) {
    console.error("Error fetching services:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Fetches a service by ID from the backend
 * @param {string} id Service ID
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export async function getServiceById(id) {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/services/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching service: ${response.status}`);
    }

    const data = await response.json();
    return transformBackendServiceToFrontend(data.service);
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error);
    return null;
  }
}

/**
 * Adds a new service to the backend
 * @param {Object} serviceData Service data to add
 * @returns {Promise<Object>} Created service
 */
export async function addService(serviceData) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    // Format the data for the backend
    const backendServiceData = {
      title: serviceData.title,
      description: serviceData.description,
      category: serviceData.category,
      time_credits_per_hour: parseFloat(serviceData.timeCredits),
      location: serviceData.location,
      availability: serviceData.availability,
      whats_included: serviceData.whatIncluded || null,
      requirements: serviceData.requirements || null
    };

    const response = await fetch("http://localhost:8000/api/v1/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(backendServiceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to create service";
      
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return transformBackendServiceToFrontend(result);
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
}

/**
 * Filters services based on criteria
 * @param {Object} filters Filter criteria
 * @returns {Promise<Array>} Filtered services
 */
export async function filterServices(filters = {}) {
  try {
    // Start with the base URL
    let url = "http://localhost:8000/api/v1/services";
    
    // Add query parameters for backend filtering
    const queryParams = new URLSearchParams();
    
    // Currently, the backend only supports category filtering
    if (filters.category && filters.category !== "all") {
      queryParams.append("category", filters.category);
    }
    
    // Add skip and limit if provided
    if (filters.skip) {
      queryParams.append("skip", filters.skip);
    }
    
    if (filters.limit) {
      queryParams.append("limit", filters.limit);
    }
    
    // Append query parameters to URL if any exist
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error filtering services: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform all services to frontend format
    let services = data.map(transformBackendServiceToFrontend);
    
    // Apply additional frontend filtering
    if (filters.search) {
      const query = filters.search.toLowerCase();
      services = services.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query) ||
          (service.tags && service.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }
    
    if (filters.minCredits !== undefined) {
      services = services.filter((service) => service.timeCredits >= filters.minCredits);
    }
    
    if (filters.maxCredits !== undefined) {
      services = services.filter((service) => service.timeCredits <= filters.maxCredits);
    }
    
    if (filters.location && filters.location !== "any") {
      services = services.filter((service) => {
        if (!service.location) return false;
        return service.location.toLowerCase().includes(filters.location.toLowerCase());
      });
    }
    
    if (filters.minRating !== undefined) {
      services = services.filter((service) => service.rating >= filters.minRating);
    }
    
    if (filters.availability && filters.availability.length > 0) {
      services = services.filter((service) =>
        filters.availability.some((day) =>
          service.availability.some((serviceDay) => serviceDay.toLowerCase().includes(day.toLowerCase()))
        )
      );
    }
    
    return services;
  } catch (error) {
    console.error("Error filtering services:", error);
    return [];
  }
}

/**
 * Get categories for services
 * @returns {Array} Array of category objects
 */
export function getCategories() {
  return [
    { id: 1, name: "Home & Garden", description: "Home maintenance, gardening, and outdoor services", icon: "Home" },
    {
      id: 2,
      name: "Tech Support",
      description: "Computer repair, software help, and technical assistance",
      icon: "Laptop",
    },
    { id: 3, name: "Tutoring", description: "Educational services and skill teaching", icon: "BookOpen" },
    { id: 4, name: "Transportation", description: "Travel assistance and vehicle services", icon: "Car" },
    { id: 5, name: "Cooking", description: "Meal preparation and culinary services", icon: "Utensils" },
    { id: 6, name: "Childcare", description: "Child supervision and care services", icon: "Baby" },
    { id: 7, name: "Repairs", description: "General repair and maintenance services", icon: "Wrench" },
    { id: 8, name: "Health & Wellness", description: "Fitness, health, and wellness services", icon: "Heart" },
    { id: 9, name: "Arts & Crafts", description: "Creative and artistic services", icon: "Palette" },
    { id: 10, name: "Photography", description: "Photo and video services", icon: "Camera" },
    { id: 11, name: "Language Exchange", description: "Language learning and practice", icon: "MessageCircle" },
    { id: 12, name: "Fitness", description: "Physical fitness and exercise services", icon: "Dumbbell" },
    { id: 13, name: "Other", description: "Miscellaneous services", icon: "Plus" },
  ];
}

/**
 * Helper function to map category form values to database names
 */
export function mapCategoryValue(categoryValue) {
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
  };
  return categoryMap[categoryValue] || categoryValue;
}

/**
 * Helper function to map availability form values to database values
 */
export function mapAvailability(availabilityKey) {
  const availabilityMap = {
    "weekday-mornings": "Weekday Mornings",
    "weekday-afternoons": "Weekday Afternoons",
    "weekday-evenings": "Weekday Evenings",
    "weekend-mornings": "Weekend Mornings",
    "weekend-afternoons": "Weekend Afternoons",
    "weekend-evenings": "Weekend Evenings",
    flexible: "Flexible",
  };
  return availabilityMap[availabilityKey] || availabilityKey;
}

/**
 * Transform backend service format to frontend format
 * @param {Object} backendService Service from backend
 * @returns {Object} Service in frontend format
 */
function transformBackendServiceToFrontend(backendService) {
  if (!backendService) return null;

  // Map availability boolean fields to array format
  const availabilityMap = {
    availability_weekday_morning: "Weekday Mornings",
    availability_weekday_afternoon: "Weekday Afternoons",
    availability_weekday_evening: "Weekday Evenings",
    availability_weekend_morning: "Weekend Mornings",
    availability_weekend_afternoon: "Weekend Afternoons",
    availability_weekend_evening: "Weekend Evenings",
    availability_flexible: "Flexible",
  };

  // If the backend already provides availability as an array, use it
  let availability = backendService.availability || [];
  
  // Otherwise, convert from boolean fields
  if (availability.length === 0 && typeof backendService.availability_weekday_morning !== 'undefined') {
    availability = Object.entries(availabilityMap)
      .filter(([key]) => backendService[key])
      .map(([_, value]) => value);
  }

  // Add placeholder data for fields not yet implemented in the backend
  return {
    id: backendService.service_id?.toString() || backendService.id?.toString(),
    title: backendService.title,
    description: backendService.description,
    timeCredits: parseFloat(backendService.time_credits_per_hour) || backendService.timeCredits,
    location: backendService.location,
    rating: 4.5, // Placeholder - not yet implemented in backend
    provider: backendService.creator_name || "Service Provider", // Use creator_name from backend
    providerImage: "/placeholder.svg?height=40&width=40&text=SP", // Placeholder
    image: "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(backendService.title || "Service"), // Placeholder
    availability: availability,
    category: backendService.category,
    totalReviews: 0, // Placeholder - not yet implemented in backend
    requirements: backendService.requirements || "",
    whatIncluded: backendService.whats_included || backendService.whatIncluded || "",
    tags: [], // Tags removed as per previous conversation
    createdAt: backendService.created_at || new Date().toISOString(),
    reviews: [], // Placeholder - not yet implemented in backend
    providerStats: { // Placeholder - not yet implemented in backend
      totalServices: 1,
      responseTime: "Within 24 hours",
      memberSince: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      completionRate: "New provider",
    },
    creator_id: backendService.creator_id, // Keep the creator ID for authorization checks
  };
}