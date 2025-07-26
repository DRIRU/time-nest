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
    } catch (error) {
      console.error("Error submitting moderator application:", error);
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves all moderator applications for admin review
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @returns {Promise<Array>} Array of all moderator applications
 */
export async function getAllModeratorApplications(tokenOverride = null) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      token = adminUser?.accessToken;
    }

    if (!token) {
      throw new Error("Authentication token not found. Please log in as admin.");
    }

    const response = await fetch("http://localhost:8000/api/v1/mod-requests/all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to fetch moderator applications";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching moderator applications:", error);
    throw error;
  }
}

/**
 * Updates a moderator application status (approve/reject)
 * @param {number} requestId The ID of the moderator application
 * @param {string} newStatus The new status ('approved' or 'rejected')
 * @param {string|null} tokenOverride Optional token to use instead of retrieving from localStorage
 * @returns {Promise<Object>} Updated application
 */
export async function updateModeratorApplicationStatus(requestId, newStatus, tokenOverride = null) {
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      // Fall back to localStorage if no token override provided
      const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
      token = adminUser?.accessToken;
    }

    if (!token) {
      throw new Error("Authentication token not found. Please log in as admin.");
    }

    const response = await fetch(`http://localhost:8000/api/v1/mod-requests/${requestId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to update moderator application status";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating moderator application status:", error);
    throw error;
  }
}

// Mock data functions for moderator dashboard functionality

/**
 * Get pending reports for moderator review
 * @param {string|null} tokenOverride Optional token
 * @returns {Promise<Array>} Array of pending reports
 */
export async function getPendingReports(tokenOverride = null) {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: "User Report",
          reporter: "John Doe",
          reported: "Jane Smith",
          reason: "Inappropriate behavior",
          description: "User was being rude in chat messages",
          timestamp: "2025-07-26T10:30:00Z",
          status: "pending",
          priority: "medium"
        },
        {
          id: 2,
          type: "Content Report",
          reporter: "Alice Johnson",
          reported: "Service Provider XYZ",
          reason: "Misleading service description",
          description: "The service description doesn't match what was delivered",
          timestamp: "2025-07-26T09:15:00Z",
          status: "pending",
          priority: "high"
        }
      ]);
    }, 500);
  });
}

/**
 * Update report status
 * @param {number} reportId Report ID
 * @param {string} status New status
 * @param {string} resolution Resolution notes
 * @returns {Promise<Object>} Updated report
 */
export async function updateReportStatus(reportId, status, resolution = "") {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: reportId,
        status: status,
        resolution: resolution,
        resolvedAt: new Date().toISOString(),
        resolvedBy: "Current Moderator"
      });
    }, 300);
  });
}

/**
 * Get flagged content for review
 * @returns {Promise<Array>} Array of flagged content
 */
export async function getFlaggedContent() {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: "Service Listing",
          title: "Quick Home Cleaning",
          content: "I'll clean your house super fast and cheap!",
          author: "CleaningPro123",
          flaggedBy: "Community",
          reason: "Suspicious pricing",
          timestamp: "2025-07-26T08:45:00Z",
          status: "pending"
        },
        {
          id: 2,
          type: "Comment",
          content: "This service is terrible, don't trust them!",
          author: "DisgruntledUser",
          flaggedBy: "AutoMod",
          reason: "Potential defamation",
          timestamp: "2025-07-26T07:20:00Z",
          status: "pending"
        }
      ]);
    }, 400);
  });
}

/**
 * Moderate content (approve/reject/hide)
 * @param {number} contentId Content ID
 * @param {string} action Action to take
 * @param {string} reason Reason for action
 * @returns {Promise<Object>} Moderation result
 */
export async function moderateContent(contentId, action, reason = "") {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: contentId,
        action: action,
        reason: reason,
        moderatedAt: new Date().toISOString(),
        moderatedBy: "Current Moderator"
      });
    }, 300);
  });
}

/**
 * Get moderator statistics
 * @returns {Promise<Object>} Moderator stats
 */
export async function getModeratorStats() {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reports: {
          pending: 5,
          resolved: 23,
          total: 28
        },
        content: {
          flagged: 8,
          approved: 45,
          rejected: 12
        },
        users: {
          warned: 7,
          suspended: 2,
          banned: 1
        },
        activity: {
          actionsToday: 12,
          averageResponseTime: "2.5 hours"
        }
      });
    }, 300);
  });
}

/**
 * Get moderator activity log
 * @param {string} dateFilter Date filter (today, week, month)
 * @returns {Promise<Object>} Activity data
 */
export async function getModeratorActivity(dateFilter = "today") {
  // Mock implementation - replace with real API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        activities: [
          {
            id: 1,
            action: "Report Resolved",
            description: "Resolved user behavior complaint",
            timestamp: "2025-07-26T14:30:00Z",
            moderator: "Current User"
          },
          {
            id: 2,
            action: "Content Approved",
            description: "Approved service posting after review",
            timestamp: "2025-07-25T13:15:00Z",
            moderator: "Current User"
          }
        ]
      });
    }, 300);
  });
}

// Moderator Authentication Functions

/**
 * Login moderator with email and password
 * @param {string} email - Moderator email
 * @param {string} password - Moderator password
 * @returns {Promise<Object>} Login response with token and moderator data
 */
export async function loginModerator(email, password) {
  try {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch("http://localhost:8000/api/v1/moderators/login", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Login failed")
    }

    const result = await response.json()
    
    // Store authentication data
    localStorage.setItem("moderatorAuth", "true")
    localStorage.setItem("moderatorUser", JSON.stringify({
      ...result.moderator,
      accessToken: result.access_token
    }))

    return result
  } catch (error) {
    console.error("Moderator login error:", error)
    throw error
  }
}

/**
 * Get current moderator profile
 * @returns {Promise<Object>} Current moderator profile
 */
export async function getCurrentModeratorProfile() {
  try {
    const moderatorData = getStoredModeratorData()
    if (!moderatorData?.accessToken) {
      throw new Error("No authentication token found")
    }

    const response = await fetch("http://localhost:8000/api/v1/moderators/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${moderatorData.accessToken}`,
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        logoutModerator()
        throw new Error("Session expired. Please login again.")
      }
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch moderator profile")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching moderator profile:", error)
    throw error
  }
}

/**
 * Check if moderator is authenticated
 * @returns {boolean} True if moderator is authenticated
 */
export function isModeratorAuthenticated() {
  const moderatorAuth = localStorage.getItem("moderatorAuth")
  const moderatorData = localStorage.getItem("moderatorUser")
  
  return moderatorAuth === "true" && moderatorData !== null
}

/**
 * Get stored moderator data from localStorage
 * @returns {Object|null} Stored moderator data or null
 */
export function getStoredModeratorData() {
  try {
    const moderatorData = localStorage.getItem("moderatorUser")
    return moderatorData ? JSON.parse(moderatorData) : null
  } catch (error) {
    console.error("Error parsing stored moderator data:", error)
    return null
  }
}

/**
 * Logout moderator and clear stored data
 */
export function logoutModerator() {
  localStorage.removeItem("moderatorAuth")
  localStorage.removeItem("moderatorUser")
}
