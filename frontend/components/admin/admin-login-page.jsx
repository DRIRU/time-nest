"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Shield, Clock } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // State for form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // State for form validation
  const [fieldErrors, setFieldErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }))
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError("")
    }
  }

  const validateForm = () => {
    const errors = {}

    // Required field validation
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address"
      }
    }

    if (!formData.password) {
      errors.password = "Password is required"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate form
    if (!validateForm()) {
      setError("Please fix the errors below and try again.")
      return
    }

    setIsLoading(true)

    try {
      // TODO: Replace with actual admin authentication API call
      // For now, we'll simulate an admin login
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock admin credentials check
      if (formData.email === "admin@timenest.com" && formData.password === "admin123") {
        setSuccess("Admin login successful! Redirecting to dashboard...")
        
        // Store admin session (you'll want to implement proper JWT handling)
        localStorage.setItem("adminAuth", "true")
        localStorage.setItem("adminUser", JSON.stringify({
          email: formData.email,
          role: "admin",
          name: "Admin User"
        }))
        
        // Redirect to admin dashboard after a short delay
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1000)
      } else {
        setError("Invalid admin credentials. Please check your email and password.")
      }
    } catch (err) {
      console.error("Error during admin login:", err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Access</CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access the TimeNest administration dashboard
          </CardDescription>
          <div className="flex items-center justify-center space-x-2 mt-4 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">TimeNest Admin Portal</span>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@timenest.com"
                  className={`pl-10 ${fieldErrors.email ? "border-red-500" : ""}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  className={`pl-10 pr-10 ${fieldErrors.password ? "border-red-500" : ""}`}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Demo Credentials:</p>
                  <p>Email: admin@timenest.com</p>
                  <p>Password: admin123</p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In to Admin Panel"}
            </Button>
            
            <div className="text-center">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
                ← Back to TimeNest Home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}