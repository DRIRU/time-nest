"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" 
import { Separator } from "@/components/ui/separator"
import { MapPin, Mail, Star, Calendar, Clock, CheckCircle, User, Edit3, Globe, Shield, Award } from "lucide-react"
import { getUserById } from "@/lib/users-data"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { submitModeratorApplication, getModeratorApplications } from "@/lib/moderator-data"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModDialog, setShowModDialog] = useState(false)
  const [modReason, setModReason] = useState("")
  const [modExperience, setModExperience] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [modApplications, setModApplications] = useState([])
  const { isLoggedIn, currentUser } = useAuth()

  useEffect(() => {
    // In a real app, you'd get the current user ID from auth context
    // For demo purposes, we'll use the first user
    const currentUser = getUserById("user1")
    setUser(currentUser)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Fetch moderator applications if user is logged in
    if (isLoggedIn && currentUser) {
      fetchModApplications();
    }
  }, [isLoggedIn, currentUser]);

  const fetchModApplications = async () => {
    try {
      const applications = await getModeratorApplications();
      setModApplications(applications);
    } catch (error) {
      console.error("Error fetching moderator applications:", error);
    }
  };

  const handleSubmitModApplication = async () => {
    if (!modReason.trim()) {
      setError("Please provide a reason for wanting to become a moderator");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitModeratorApplication({
        reason: modReason,
        experience: modExperience
      });
      
      setSuccess("Your application has been submitted successfully!");
      setModReason("");
      setModExperience("");
      
      // Refresh the list of applications
      fetchModApplications();
      
      // Close the dialog after a delay
      setTimeout(() => {
        setShowModDialog(false);
        setSuccess("");
      }, 2000);
    } catch (error) {
      setError(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center p-6">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.fullName}</h2>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{user.role.replace("_", " ")}</p>

                  <div className="flex items-center justify-center mt-2">
                    {user.isVerified ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>

                  {user.role === "service_provider" && (
                    <div className="flex items-center justify-center mt-3">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">{user.profile.rating}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        ({user.profile.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-400">Joined {user.joinDate}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {user.location.city}, {user.location.state}
                    </span>
                  </div>

                  {user.role === "service_provider" && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Response time: {user.profile.responseTime}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full mt-6"
                  variant="outline"
                  onClick={() => (window.location.href = "/profile/edit")}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                
                {/* Moderator Application Button */}
                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => setShowModDialog(true)}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Apply to be a Moderator
                </Button>
                
                {/* Show application status if exists */}
                {modApplications.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Moderator Application</h3>
                    <Badge className={
                      modApplications[0].status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      modApplications[0].status === "approved" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }>
                      {modApplications[0].status === "pending" ? "Pending Review" :
                       modApplications[0].status === "approved" ? "Approved" :
                       "Rejected"}
                    </Badge>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Submitted on {new Date(modApplications[0].submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="text-gray-900 dark:text-gray-100">{user.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            {user.profile.bio && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">{user.profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills (for service providers) */}
            {user.role === "service_provider" && user.profile.skills.length > 0 && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics (for service providers) */}
            {user.role === "service_provider" && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user.profile.completedJobs}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Jobs Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{user.profile.reviewCount}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{user.profile.rating}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.profile.languages.map((language, index) => (
                      <CheckCircle className="h-3 w-3 mr-1" /> 
                      {language}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Moderator Application Dialog */}
      <Dialog open={showModDialog} onOpenChange={setShowModDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Apply to be a TimeNest Moderator</DialogTitle>
            <DialogDescription>
              Moderators help maintain community standards and review content. Tell us why you'd like to become a moderator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">Why do you want to be a moderator? *</label>
              <Textarea
                id="reason"
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                placeholder="Explain why you want to be a moderator and how you can contribute to the TimeNest community..."
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="experience" className="text-sm font-medium">Relevant Experience (Optional)</label>
              <Textarea
                id="experience"
                value={modExperience}
                onChange={(e) => setModExperience(e.target.value)}
                placeholder="Share any relevant experience you have with community moderation or management..."
                rows={3}
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Moderator Responsibilities:</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Review reported content and users</li>
                <li>• Help maintain community guidelines</li>
                <li>• Assist with dispute resolution</li>
                <li>• Provide feedback on platform improvements</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitModApplication} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
