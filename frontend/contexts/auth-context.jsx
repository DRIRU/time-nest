"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Track if component has mounted to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Function to check if token is expired
  const isTokenExpired = useCallback((token) => {
    if (!token) return true
    
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.')
      if (parts.length !== 3) return true
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]))
      
      // Check if token has expired
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return true
    }
  }, [])

  // Auto-logout function
  const autoLogout = useCallback(() => {
    console.log("Token expired, logging out automatically...")
    setIsLoggedIn(false)
    setCurrentUser(null)
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("currentUser")
    
    // Redirect to login page
    router.push("/login")
  }, [router])

  // Check token expiration periodically
  useEffect(() => {
    let tokenCheckInterval

    if (isLoggedIn && currentUser?.accessToken) {
      const checkTokenExpiration = () => {
        if (isTokenExpired(currentUser.accessToken)) {
          autoLogout()
        }
      }

      // Check immediately
      checkTokenExpiration()

      // Check every minute
      tokenCheckInterval = setInterval(checkTokenExpiration, 60000)
    }

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval)
      }
    }
  }, [isLoggedIn, currentUser, isTokenExpired, autoLogout])

  // Check localStorage on mount
  useEffect(() => {
    if (!mounted) return

    try {
      // Only access localStorage on the client side
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const storedAuth = localStorage.getItem("isLoggedIn") === "true"
      const storedUser = localStorage.getItem("currentUser")

      if (storedAuth && storedUser) {
        const userData = JSON.parse(storedUser)
        
        // Check if stored token is expired
        if (userData.accessToken && !isTokenExpired(userData.accessToken)) {
          setIsLoggedIn(true)
          setCurrentUser(userData)
        } else {
          // Token is expired, clear storage
          localStorage.removeItem("isLoggedIn")
          localStorage.removeItem("currentUser")
        }
      }
      setLoading(false)
    } catch (error) {
      console.error("Error loading auth state:", error)
      setLoading(false)
    }
  }, [isTokenExpired, mounted])

  const login = (userData) => {
    try {
      setIsLoggedIn(true)
      setCurrentUser(userData)
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("currentUser", JSON.stringify(userData))
    } catch (error) {
      console.error("Error saving auth state:", error)
    }
  }

  const logout = () => {
    try {
      setIsLoggedIn(false)
      setCurrentUser(null)
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("currentUser")
    } catch (error) {
      console.error("Error clearing auth state:", error)
    }
  }

  // Enhanced logout for handling expired tokens
  const handleTokenExpired = useCallback(() => {
    console.log("Token expired, logging out...")
    logout()
    
    // Show user feedback about session expiration
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      alert("Your session has expired. Please log in again.")
    }
    
    // Redirect to login page
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        currentUser, 
        login, 
        logout, 
        loading, 
        handleTokenExpired,
        isTokenExpired 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}