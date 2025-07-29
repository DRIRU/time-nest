"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { loginModerator } from "@/lib/moderator-data"

export default function ModeratorLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate input
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields")
      }

      // Attempt login using real authentication
      const response = await loginModerator(formData.email, formData.password)
      
      if (response.access_token && response.moderator) {
        // Store authentication data
        localStorage.setItem("moderatorAuth", "true")
        localStorage.setItem("moderatorUser", JSON.stringify({
          ...response.moderator,
          accessToken: response.access_token
        }))
        
        // Redirect to moderator dashboard
        router.push("/moderator")
      } else {
        throw new Error("Login failed - no access token received")
      }
    } catch (error) {
      console.error("Moderator login error:", error)
      setError(error.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Clock className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">TimeNest</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Moderator Access
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access the moderation dashboard
          </p>
        </div>

        {/* Login Form */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Moderator Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your moderator credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="moderator@timenest.com"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="dark:bg-gray-700 dark:border-gray-600 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            {/* <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Demo Credentials:</h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Email:</strong> moderator@timenest.com<br />
                <strong>Password:</strong> moderator123
              </p>
            </div> */}

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need access? Contact the administrator
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <Link href="/" className="text-blue-600 hover:text-blue-500">
                  Back to Main Site
                </Link>
                <span className="text-gray-300">•</span>
                <Link href="/admin/login" className="text-blue-600 hover:text-blue-500">
                  Admin Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
