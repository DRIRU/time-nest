// This file handles interactions with the backend API for moderator applications

/**
 * Submits a moderator application to the backend
 * @param {Object} applicationData Application data to submit
 * @returns {Promise<Object>} Created application
 */
export async function submitModeratorApplication(applicationData) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

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
  } catch (error) {
    console.error("Error submitting moderator application:", error);
    throw error;
  }
}

/**
 * Fetches moderator applications for the current user
 * @param {string} status Optional status filter
 * @returns {Promise<Array>} Array of applications
 */
export async function getModeratorApplications(status) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    let url = "http://localhost:8000/api/v1/mod-requests";
    if (status) {
      url += `?status=${status}`;
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
      throw new Error(errorData.detail || "Failed to fetch moderator applications");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching moderator applications:", error);
    return [];
  }
}

/**
 * Fetches all moderator applications (admin only)
 * @param {string} status Optional status filter
 * @returns {Promise<Array>} Array of applications
 */
export async function getAllModeratorApplications(status) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
    }

    let url = "http://localhost:8000/api/v1/mod-requests";
    if (status) {
      url += `?status=${status}`;
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
      throw new Error(errorData.detail || "Failed to fetch moderator applications");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching all moderator applications:", error);
    return [];
  }
}

/**
 * Updates a moderator application status (admin only)
 * @param {number} requestId Application ID
 * @param {string} newStatus New status (approved, rejected)
 * @returns {Promise<Object>} Updated application
 */
export async function updateModeratorApplicationStatus(requestId, newStatus) {
  try {
    // Get the auth token from localStorage
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = currentUser?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in.");
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