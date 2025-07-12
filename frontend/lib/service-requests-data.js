// This file handles interactions with the backend API for service requests

/**
 * Fetches all service requests from the backend
 * @param {Object} filters Filter criteria
 * @returns {Promise<Array>} Array of service requests
 */
export async function getAllServiceRequests(filters = {}) {
  try {
    // Start with the base URL
    let url = "http://localhost:8000/api/v1/requests";
    
    // Add query parameters for backend filtering
    const queryParams = new URLSearchParams();
    
    // Add backend-supported filters
    if (filters.category && filters.category !== "all") {
      queryParams.append("category", filters.category);
    }
    
    if (filters.urgency && filters.urgency !== "all") {
      queryParams.append("urgency", filters.urgency);
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
      throw new Error(`Error fetching service requests: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform all requests to frontend format
    let requests = data.map(transformBackendRequestToFrontend);
    
    // Apply additional frontend filtering
    if (filters.search) {
      const query = filters.search.toLowerCase();
      requests = requests.filter(
        (request) =>
          request.title.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query) ||
          request.category.toLowerCase().includes(query) ||
          (request.tags && request.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }
    
    if (filters.location && filters.location !== "any") {
      requests = requests.filter((request) => {
        if (!request.location) return false;
        return request.location.toLowerCase().includes(filters.location.toLowerCase());
      });
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching service requests:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Fetches a service request by ID from the backend
 * @param {string} id Request ID
 * @returns {Promise<Object|null>} Request object or null if not found
 */
export async function getServiceRequestById(id) {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/requests/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Error fetching service request: ${response.status}`);
    }

    const data = await response.json();
    return transformBackendRequestToFrontend(data);
  } catch (error) {
    console.error(`Error fetching service request with ID ${id}:`, error);
    return null;
  }
}

/**
 * Adds a new service request to the backend
 * @param {Object} requestData Request data to add
 * @returns {Promise<Object>} Created request
 */
export async function addServiceRequest(requestData) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    // Format the data for the backend
    const backendRequestData = {
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      budget: parseFloat(requestData.budget),
      location: requestData.location,
      deadline: requestData.deadline,
      urgency: requestData.urgency || "normal",
      whats_included: requestData.whatIncluded || null,
      requirements: requestData.requirements || null,
      tags: requestData.tags || [],
      skills: requestData.skills || []
    };

    const response = await fetch("http://localhost:8000/api/v1/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(backendRequestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to create service request";
      
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
    return transformBackendRequestToFrontend(result);
  } catch (error) {
    console.error("Error creating service request:", error);
    throw error;
  }
}

/**
 * Filters service requests based on criteria
 * @param {Object} filters Filter criteria
 * @returns {Promise<Array>} Filtered service requests
 */
export async function filterServiceRequests(filters = {}) {
  try {
    const requests = await getAllServiceRequests(filters);
    return requests;
  } catch (error) {
    console.error("Error filtering service requests:", error);
    return [];
  }
}

/**
 * Sorts service requests based on criteria
 * @param {Array} requests Array of service requests
 * @param {string} sortBy Sort criteria
 * @returns {Array} Sorted service requests
 */
export function sortServiceRequests(requests, sortBy) {
  const sortedRequests = [...requests];

  switch (sortBy) {
    case "newest":
      return sortedRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case "oldest":
      return sortedRequests.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case "budget-high":
      return sortedRequests.sort((a, b) => b.budget - a.budget);
    case "budget-low":
      return sortedRequests.sort((a, b) => a.budget - b.budget);
    case "deadline":
      return sortedRequests.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    case "urgent":
      // Sort by urgency level (urgent > high > normal > low)
      const urgencyOrder = { urgent: 3, high: 2, normal: 1, low: 0 };
      return sortedRequests.sort((a, b) => {
        const aValue = urgencyOrder[a.urgency] || 0;
        const bValue = urgencyOrder[b.urgency] || 0;
        return bValue - aValue;
      });
    default:
      return sortedRequests;
  }
}

/**
 * Get service request categories
 * @returns {Array} Array of unique categories
 */
export function getServiceRequestCategories() {
  // This will be replaced with a backend call in the future
  return [
    "Home & Garden",
    "Tech Support",
    "Tutoring",
    "Transportation",
    "Cooking",
    "Childcare",
    "Repairs",
    "Health & Wellness",
    "Arts & Crafts",
    "Photography",
    "Language Exchange",
    "Fitness",
    "Other"
  ];
}

/**
 * Get service request overview statistics for admin dashboard
 * @returns {Object} Statistics object
 */
export async function getOverviewStats() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = currentUser?.accessToken;
  const response = await fetch("http://localhost:8000/api/v1/admin/stats", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
});
  const data = await response.json();
  // console.log("Overview stats data:", total_users);
  // return data;
  return data
}

/**
 * Submit a proposal for a service request
 * @param {Object} proposalData Proposal data to submit
 * @returns {Promise<Object>} Created proposal
 */
export async function submitProposal(proposalData) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch("http://localhost:8000/api/v1/request-proposals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(proposalData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to submit proposal";
      
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
    return result;
  } catch (error) {
    console.error("Error submitting proposal:", error);
    throw error;
  }
}

/**
 * Get proposals for a specific request
 * @param {number} requestId Request ID (optional - if not provided, gets all proposals for the user)
 * @returns {Promise<Array>} Array of proposals
 */
export async function getProposalsForRequest(requestId) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    let url = "http://localhost:8000/api/v1/request-proposals";
    if (requestId) {
      url += `?request_id=${requestId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch proposals");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching proposals:", error);
    throw error;
  }
}

/**
 * Update a proposal (status, text, or credits)
 * @param {number} proposalId Proposal ID
 * @param {Object} updateData Data to update
 * @returns {Promise<Object>} Updated proposal
 */
export async function updateProposal(proposalId, updateData) {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    const response = await fetch(`http://localhost:8000/api/v1/request-proposals/${proposalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to update proposal";
      
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
    return result;
  } catch (error) {
    console.error("Error updating proposal:", error);
    throw error;
  }
}

/**
 * Fetches all service requests from the backend excluding requests created by a specific user
 * @param {Object} options Optional parameters
 * @param {number} options.excludeCreatorId User ID whose requests should be excluded
 * @param {string} options.category Filter requests by category
 * @param {string} options.urgency Filter requests by urgency
 * @param {number} options.skip Number of items to skip for pagination
 * @param {number} options.limit Maximum number of items to return
 * @returns {Promise<Array>} Array of service requests
 */
export async function getAllServiceRequestsExcludingUser(options = {}) {
  try {
    // Start with the base URL
    let url = "http://localhost:8000/api/v1/requests";
    
    // Add query parameters for backend filtering
    const queryParams = new URLSearchParams();
    
    // Add exclude_creator_id parameter
    if (options.excludeCreatorId) {
      queryParams.append("exclude_creator_id", options.excludeCreatorId);
    }
    
    // Add backend-supported filters
    if (options.category && options.category !== "all") {
      queryParams.append("category", options.category);
    }
    
    if (options.urgency && options.urgency !== "all") {
      queryParams.append("urgency", options.urgency);
    }
    
    // Add skip and limit if provided
    if (options.skip) {
      queryParams.append("skip", options.skip);
    }
    
    if (options.limit) {
      queryParams.append("limit", options.limit);
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
      throw new Error(`Error fetching service requests: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform all requests to frontend format
    let requests = data.map(transformBackendRequestToFrontend);
    
    // Apply additional frontend filtering for search
    if (options.search) {
      const query = options.search.toLowerCase();
      requests = requests.filter(
        (request) =>
          request.title.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query) ||
          request.category.toLowerCase().includes(query) ||
          (request.tags && request.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }
    
    if (options.location && options.location !== "any") {
      requests = requests.filter((request) => {
        if (!request.location) return false;
        return request.location.toLowerCase().includes(options.location.toLowerCase());
      });
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching service requests excluding user:", error);
    // Return empty array in case of error
    return [];
  }
}

/**
 * Transform backend request format to frontend format
 * @param {Object} backendRequest Request from backend
 * @returns {Object} Request in frontend format
 */
function transformBackendRequestToFrontend(backendRequest) {
  if (!backendRequest) return null;

  // Map urgency from backend to frontend format
  const urgencyMap = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent"
  };

  // Create a placeholder user object
  const user = {
    id: backendRequest.creator_id?.toString(),
    name: backendRequest.creator_name || "Unknown",
    image: `/placeholder.svg?height=40&width=40&text=${backendRequest.creator_name?.charAt(0) || "U"}`,
    rating: 4.5, // Placeholder
    memberSince: "2023-01-01", // Placeholder
    completedProjects: 5, // Placeholder
    responseRate: "90%", // Placeholder
    location: backendRequest.location || "Unknown"
  };

  return {
    id: backendRequest.request_id?.toString(),
    title: backendRequest.title,
    description: backendRequest.description,
    budget: parseFloat(backendRequest.budget),
    location: backendRequest.location,
    category: backendRequest.category,
    requester: backendRequest.creator_name || "Unknown",
    requesterImage: `/placeholder.svg?height=40&width=40&text=${backendRequest.creator_name?.charAt(0) || "U"}`,
    deadline: backendRequest.deadline || new Date().toISOString().split('T')[0],
    urgency: urgencyMap[backendRequest.urgency] || "Normal",
    image: "/placeholder.svg?height=200&width=300&text=" + encodeURIComponent(backendRequest.title || "Request"),
    availability: [], // Not implemented in backend yet
    requirements: backendRequest.requirements || "",
    whatIncluded: backendRequest.whats_included || "",
    tags: backendRequest.tags || [],
    skills: backendRequest.skills || [],
    createdAt: backendRequest.created_at || new Date().toISOString(),
    status: "Open", // Placeholder - not yet implemented in backend
    proposals: 0, // Placeholder - not yet implemented in backend
    user: user, // Add user object for components that expect it
    creator_id: backendRequest.creator_id // Keep creator_id for authorization checks
  };
}