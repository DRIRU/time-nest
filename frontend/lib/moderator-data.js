// This file handles interactions with the backend API for moderator applications

/**
 * Submits a moderator application to the backend
 * @param {Object} applicationData Application data to submit
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @returns {Promise<Object>} Created application
 */
export async function submitModeratorApplication(applicationData, tokenOverride = null) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      token = currentUser?.accessToken;
    }

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/mod-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Failed to submit moderator application";
        
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
    } catch (fetchError) {
      console.error("Network error when submitting application:", fetchError);
      throw new Error("Network error: Unable to connect to the server");
    }
  } catch (error) {
    console.error("Error submitting moderator application:", error);
    throw error;
  }
}

/**
 * Fetches moderator applications for the current user
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @param {string} status Optional status filter
 * @returns {Promise<Array>} Array of applications
 */
export async function getModeratorApplications(tokenOverride = null, status) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      token = currentUser?.accessToken;
    }

    if (!token) {
      console.warn("Authentication token not found. Returning empty array.");
      return [];
    }

    let url = "http://localhost:8000/api/v1/mod-requests/my-applications";
    if (status) {
      url += `?status=${status}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        return [];
      }
  
      const data = await response.json();
      return data;
    } catch (fetchError) {
      console.error("Network error when fetching moderator applications:", fetchError);
      return [];
    }
  } catch (error) {
    console.error("Error fetching moderator applications:", error);
    return [];
  }
}

/**
 * Fetches all moderator applications (admin only)
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @param {string} status Optional status filter 
 * @returns {Promise<Array>} Array of applications
 */
export async function getAllModeratorApplications(tokenOverride = null, status) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      token = currentUser?.accessToken;
    }

    if (!token) {
      console.warn("Authentication token not found. Returning empty array.");
      return [];
    }

    let url = "http://localhost:8000/api/v1/mod-requests/all";
    if (status) {
      url += `?status=${status}`;
    }
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData);
        return [];
      }

      const data = await response.json();
      return data;
    } catch (fetchError) {
      console.error("Network error when fetching moderator applications:", fetchError);
      return [];
    }
  } catch (error) {
    console.error("Error fetching all moderator applications:", error);
    return [];
  }
}

/**
 * Updates a moderator application status (admin only)
 * @param {number} requestId Application ID
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @param {string} newStatus New status (approved, rejected)
 * @returns {Promise<Object>} Updated application
 */
export async function updateModeratorApplicationStatus(requestId, newStatus, tokenOverride = null) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      token = currentUser?.accessToken;
    }

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`http://localhost:8000/api/v1/mod-requests/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to update moderator application";
      
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
    console.error("Error updating moderator application:", error);
    throw error;
  }
}