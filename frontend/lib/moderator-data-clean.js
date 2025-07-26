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
  try {
    // Use provided token or get from localStorage
    let token = tokenOverride;
    
    if (!token) {
      const moderatorData = getStoredModeratorData();
      token = moderatorData?.accessToken;
    }

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    const response = await fetch("http://localhost:8000/api/v1/reports?status_filter=pending", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to fetch pending reports";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    throw error;
  }
}

/**
 * Get all reports with optional filtering
 * @param {Object} filters Optional filters {status, type, category, limit, offset}
 * @returns {Promise<Array>} Array of reports
 */
export async function getAllReports(filters = {}) {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (filters.status) params.append('status_filter', filters.status);
    if (filters.type) params.append('report_type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const queryString = params.toString();
    const url = `http://localhost:8000/api/v1/reports${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to fetch reports";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}

/**
 * Update report status
 * @param {number} reportId Report ID
 * @param {string} status New status
 * @param {string} resolution Resolution notes
 * @returns {Promise<Object>} Updated report
 */
export async function updateReportStatus(reportId, status, resolution = "") {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    const updateData = {
      status: status
    };

    if (resolution) {
      updateData.admin_notes = resolution;
    }

    const response = await fetch(`http://localhost:8000/api/v1/reports/${reportId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to update report status";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating report status:", error);
    throw error;
  }
}

/**
 * Get flagged content for review
 * @returns {Promise<Array>} Array of flagged content
 */
export async function getFlaggedContent() {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    // Get reports about services and requests (flagged content)
    const response = await fetch("http://localhost:8000/api/v1/reports?report_type=content", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to fetch flagged content";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Transform reports into flagged content format
    const flaggedContent = (Array.isArray(result) ? result : []).map(report => ({
      id: report.report_id,
      type: report.reported_service_id ? "Service Listing" : "Request",
      title: report.title || "Content Report",
      content: report.description,
      author: report.reported_user?.username || "Unknown User",
      flaggedBy: report.reporter?.username || "System",
      reason: report.category,
      timestamp: report.created_at,
      status: report.status
    }));

    return flaggedContent;
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    throw error;
  }
}

/**
 * Moderate content (approve/reject/hide)
 * @param {number} contentId Content ID
 * @param {string} action Action to take
 * @param {string} reason Reason for action
 * @returns {Promise<Object>} Moderation result
 */
export async function moderateContent(contentId, action, reason = "") {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    // Map action to report status
    let reportStatus;
    switch (action.toLowerCase()) {
      case 'approve':
        reportStatus = 'resolved';
        break;
      case 'reject':
      case 'hide':
        reportStatus = 'resolved';
        break;
      default:
        reportStatus = 'under_review';
    }

    const updateData = {
      status: reportStatus,
      admin_notes: reason || `Content ${action}ed by moderator`
    };

    const response = await fetch(`http://localhost:8000/api/v1/reports/${contentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = "Failed to moderate content";
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return {
      id: contentId,
      action: action,
      reason: reason,
      moderatedAt: new Date().toISOString(),
      moderatedBy: moderatorData.email,
      result: result
    };
  } catch (error) {
    console.error("Error moderating content:", error);
    throw error;
  }
}

/**
 * Get moderator statistics
 * @returns {Promise<Object>} Moderator stats
 */
export async function getModeratorStats() {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    // Get report summary statistics
    const reportsResponse = await fetch("http://localhost:8000/api/v1/reports/stats/summary", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    let reportsStats = {
      pending: 0,
      resolved: 0,
      total: 0
    };

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      reportsStats = {
        pending: reportsData.pending_reports || 0,
        resolved: reportsData.resolved_reports || 0,
        total: reportsData.total_reports || 0
      };
    }

    // For now, return calculated stats from reports and some mock data for other metrics
    // TODO: Implement actual user and content statistics endpoints
    return {
      reports: reportsStats,
      content: {
        flagged: reportsStats.pending,
        approved: Math.floor(reportsStats.resolved * 0.7),
        rejected: Math.floor(reportsStats.resolved * 0.3)
      },
      users: {
        warned: 0, // TODO: Implement user warnings system
        suspended: 0, // TODO: Implement user suspension system
        banned: 0 // TODO: Implement user ban system
      },
      activity: {
        actionsToday: 0, // TODO: Implement activity tracking
        averageResponseTime: "N/A" // TODO: Calculate average response time
      }
    };
  } catch (error) {
    console.error("Error fetching moderator stats:", error);
    // Return default stats on error
    return {
      reports: {
        pending: 0,
        resolved: 0,
        total: 0
      },
      content: {
        flagged: 0,
        approved: 0,
        rejected: 0
      },
      users: {
        warned: 0,
        suspended: 0,
        banned: 0
      },
      activity: {
        actionsToday: 0,
        averageResponseTime: "N/A"
      }
    };
  }
}

/**
 * Get moderator activity log
 * @param {string} dateFilter Date filter (today, week, month)
 * @returns {Promise<Array>} Array of activity objects
 */
export async function getModeratorActivity(dateFilter = "today") {
  try {
    const moderatorData = getStoredModeratorData();
    const token = moderatorData?.accessToken;

    if (!token) {
      throw new Error("Authentication token not found. Please log in as moderator.");
    }

    // Get recent reports resolved by this moderator
    const limit = dateFilter === "today" ? 5 : dateFilter === "week" ? 20 : 50;
    const response = await fetch(`http://localhost:8000/api/v1/reports?status_filter=resolved&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn("Could not fetch moderator activities, using empty array");
      return [];
    }

    const reports = await response.json();
    
    // Transform reports into activity log format
    const activities = (Array.isArray(reports) ? reports : []).map((report, index) => ({
      id: report.report_id,
      action: "Report Resolved",
      description: `Resolved ${report.report_type} report: ${report.title || report.category}`,
      timestamp: report.resolved_at || report.updated_at || report.created_at,
      moderator: moderatorData?.email || "Current User"
    }));

    return activities;
  } catch (error) {
    console.error("Error fetching moderator activity:", error);
    // Return empty array on error
    return [];
  }
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
