/**
 * API utility functions for handling authentication and token expiration
 */

import { useAuth } from '../contexts/auth-context'

// Function to handle API responses and check for authentication errors
export const handleApiResponse = async (response, handleTokenExpired) => {
  // Check for authentication errors
  if (response.status === 401 || response.status === 403) {
    console.log("Authentication error detected, triggering logout...")
    if (handleTokenExpired) {
      handleTokenExpired()
    }
    throw new Error("Authentication failed. Please log in again.")
  }
  
  // Handle other errors
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
  }
  
  return response
}

// Higher-order function to wrap API calls with authentication handling
export const withAuthHandling = (apiFunction) => {
  return async (...args) => {
    try {
      return await apiFunction(...args)
    } catch (error) {
      // If it's an authentication error, we want to bubble it up
      if (error.message.includes("Authentication failed")) {
        throw error
      }
      
      // For other errors, check if they might be auth-related
      if (error.message.includes("401") || error.message.includes("403")) {
        throw new Error("Authentication failed. Please log in again.")
      }
      
      throw error
    }
  }
}

// Hook to provide authenticated API calls
export const useAuthenticatedApi = () => {
  const { handleTokenExpired } = useAuth()
  
  const authenticatedFetch = async (url, options = {}) => {
    const response = await fetch(url, options)
    return await handleApiResponse(response, handleTokenExpired)
  }
  
  return { authenticatedFetch }
}
