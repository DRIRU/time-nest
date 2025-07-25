"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Save, Plus, X, Upload } from "lucide-react"
import { getUserById, updateUser, fetchUserProfile, updateUserProfile } from "@/lib/users-data"
import LocationAutocomplete from "@/components/location-autocomplete"

export default function EditProfilePage() {
  const router = useRouter()
  const { handleTokenExpired } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSkill, setNewSkill] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    skills: [],
    languages: [],
  })

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Check if we have user data passed from profile page
        const savedUserData = localStorage.getItem("editProfileUser");
        if (savedUserData) {
          const parsedUser = JSON.parse(savedUserData);
          setUser(parsedUser);
          
          // Split name into first and last name
          const nameParts = (parsedUser.name || "").split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          // Prefill form with user data from profile page
          setFormData({
            firstName: firstName,
            lastName: lastName,
            email: parsedUser.email || "",
            phone: parsedUser.phone_number || "",
            location: parsedUser.location || "",
            skills: parsedUser.skills || [],
            languages: parsedUser.languages || [],
          });
          
          // Clear the saved data after using it
          localStorage.removeItem("editProfileUser");
        } else {
          // Fallback: fetch from backend if no data in localStorage
          const userProfile = await fetchUserProfile();
          if (userProfile) {
            setUser(userProfile);
            
            // Split name into first and last name
            const nameParts = (userProfile.name || "").split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            setFormData({
              firstName: firstName,
              lastName: lastName,
              email: userProfile.email || "",
              phone: userProfile.phone_number || "",
              location: userProfile.location || "",
              skills: userProfile.skills || [],
              languages: userProfile.languages || [],
            });
          } else {
            // Final fallback to demo data
            const demoUser = getUserById("user1");
            setUser(demoUser);
            setFormData({
              firstName: demoUser.firstName || "",
              lastName: demoUser.lastName || "",
              email: demoUser.email || "",
              phone: demoUser.phone || "",
              location: demoUser.location ? `${demoUser.location.city}, ${demoUser.location.state}` : "",
              skills: demoUser.profile?.skills || [],
              languages: demoUser.profile?.languages || [],
            });
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Fallback to demo data on error
        const demoUser = getUserById("user1");
        setUser(demoUser);
        setFormData({
          firstName: demoUser.firstName || "",
          lastName: demoUser.lastName || "",
          email: demoUser.email || "",
          phone: demoUser.phone || "",
          location: demoUser.location ? `${demoUser.location.city}, ${demoUser.location.state}` : "",
          skills: demoUser.profile?.skills || [],
          languages: demoUser.profile?.languages || [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Prepare update data for backend
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        location: formData.location,
      }

      // Call backend API to update user profile
      const result = await updateUserProfile(updateData)

      if (result.success) {
        // Show success message (you could use a toast library here)
        alert("Profile updated successfully!")
        router.push("/profile")
      } else {
        alert("Error updating profile: " + result.error)
      }
    } catch (error) {
      alert("Error updating profile: " + error.message)
    } finally {
      setSaving(false)
    }
  }

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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">Please log in to edit your profile.</p>
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
          <Button variant="ghost" onClick={() => router.push("/profile")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Update your account information</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Picture */}
            <div className="lg:col-span-1">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name || user.fullName} />
                      <AvatarFallback className="text-lg">
                        {formData.firstName?.[0] || user.name?.[0] || 'U'}
                        {formData.lastName?.[0] || user.name?.split(' ')[1]?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <LocationAutocomplete
                      name="location"
                      value={formData.location}
                      onChange={(value) => handleInputChange("location", value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills (for service providers) */}
              {user.role === "service_provider" && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/profile")} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
