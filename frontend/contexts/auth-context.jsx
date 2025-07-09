"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check localStorage on mount
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem("isLoggedIn") === "true"
      const storedUser = localStorage.getItem("currentUser")

      if (storedAuth && storedUser) {
        setIsLoggedIn(true)
        setCurrentUser(JSON.parse(storedUser))
      }
      setLoading(false)
    } catch (error) {
      console.error("Error loading auth state:", error)
      setLoading(false)
    }
  }, [])

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

  return <AuthContext.Provider value={{ isLoggedIn, currentUser, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
