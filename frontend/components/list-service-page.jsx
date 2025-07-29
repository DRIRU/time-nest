"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Clock, Upload, X, Plus, ArrowLeft, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context" 
import LocationAutocomplete from "./location-autocomplete"
import { mapCategoryValue, addService, addRequest } from "@/lib/database-services"

export default function ListServicePage() {
  const router = useRouter()
  const { isLoggedIn, currentUser, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [postType, setPostType] = useState("") // "service" or "request"
  const [currentStep, setCurrentStep] = useState(0) // 0 for type selection, then 1-3 for forms
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    timeCredits: "",
    location: "",
    availability: [],
    images: [],
    requirements: "",
    whatIncluded: "",
    tags: [],
    // Request-specific fields
    budget: "",
    deadline: "",
    urgency: "normal",
    skills: [], // Add this line
  })
  const [errors, setErrors] = useState({})
  const [dragActive, setDragActive] = useState(false)

  const categories = [
    { value: "home-garden", label: "Home & Garden" },
    { value: "tech-support", label: "Tech Support" },
    { value: "tutoring", label: "Tutoring" },
    { value: "transportation", label: "Transportation" },
    { value: "cooking", label: "Cooking" },
    { value: "childcare", label: "Childcare" },
    { value: "repairs", label: "Repairs" },
    { value: "health-wellness", label: "Health & Wellness" },
    { value: "arts-crafts", label: "Arts & Crafts" },
    { value: "photography", label: "Photography" },
    { value: "language-exchange", label: "Language Exchange" },
    { value: "fitness", label: "Fitness" },
    { value: "other", label: "Other" },
  ]

  const availabilityOptions = [
    { id: "weekday-mornings", label: "Weekday Mornings (6AM - 12PM)" },
    { id: "weekday-afternoons", label: "Weekday Afternoons (12PM - 6PM)" },
    { id: "weekday-evenings", label: "Weekday Evenings (6PM - 10PM)" },
    { id: "weekend-mornings", label: "Weekend Mornings (6AM - 12PM)" },
    { id: "weekend-afternoons", label: "Weekend Afternoons (12PM - 6PM)" },
    { id: "weekend-evenings", label: "Weekend Evenings (6PM - 10PM)" },
    { id: "flexible", label: "Flexible Schedule" },
  ]

  const urgencyOptions = [
    { value: "low", label: "Low - Within a month", color: "text-green-600" },
    { value: "normal", label: "Normal - Within a week", color: "text-blue-600" },
    { value: "high", label: "High - Within 2-3 days", color: "text-orange-600" },
    { value: "urgent", label: "Urgent - ASAP", color: "text-red-600" },
  ]

  // Check if user is logged in on component mount
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      alert("You must be logged in to list a service or request. Please log in to continue.")
      router.push("/login")
    }
  }, [isLoggedIn, loading, router])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleAvailabilityChange = (optionId) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(optionId)
        ? prev.availability.filter((id) => id !== optionId)
        : [...prev.availability, optionId],
    }))
  }

  const handleImageUpload = (files) => {
    const newImages = Array.from(files).slice(0, 5 - formData.images.length)
    const imageUrls = newImages.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }))

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }))
  }

  const removeImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files)
    }
  }

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }))
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const addSkill = (skill) => {
    if (
      skill &&
      (!formData.skills || !formData.skills.includes(skill)) &&
      (!formData.skills || formData.skills.length < 10)
    ) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }))
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.title.trim())
        newErrors.title = postType === "service" ? "Service title is required" : "Request title is required"
      if (!formData.description.trim())
        newErrors.description =
          postType === "service" ? "Service description is required" : "Request description is required"
      if (!formData.category) newErrors.category = "Please select a category"

      if (postType === "service") {
        if (!formData.timeCredits || formData.timeCredits <= 0) {
          newErrors.timeCredits = "Time credits must be greater than 0"
        }
      } else {
        if (!formData.budget || formData.budget <= 0) {
          newErrors.budget = "Budget must be greater than 0"
        }
      }
    }

    if (step === 2) {
      if (!formData.location || !formData.location.trim()) {
        newErrors.location = "Location is required"
      }
      if (formData.availability.length === 0) {
        newErrors.availability = "Please select at least one availability option"
      }

      if (postType === "request" && !formData.deadline) {
        newErrors.deadline = "Deadline is required for requests"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 0) {
      if (postType) {
        setCurrentStep(1)
      }
    } else if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
  }

  const handlePublish = async () => {
    if (currentStep !== 3) {
      return;
    }
  
    if (!validateStep(currentStep)) return;
  
    if (!isLoggedIn) {
      alert("You must be logged in to publish a service or request");
      router.push("/login");
      return;
    }
  
    setIsLoading(true);
  
    try {
      console.log(`Submitting ${postType} data:`, formData);
  
      if (postType === "service") {
        // Format data for service creation
        const requestData = {
          title: formData.title,
          description: formData.description,
          category: mapCategoryValue(formData.category), // Map category value to database name
          timeCredits: formData.timeCredits, // Use timeCredits as is, transformed in addService
          location: formData.location,
          availability: formData.availability,
          whatIncluded: formData.whatIncluded || null,
          requirements: formData.requirements || null,
        };
        
        // Call addService from database-services.js
        const response = await addService(requestData);
        console.log("Service created:", response);
  
        // Redirect to services page or show success message
        alert("Service created successfully!");
        router.push("/services");
      } else {
        // Format data for request creation
        const requestData = {
          title: formData.title,
          description: formData.description,
          category: mapCategoryValue(formData.category),
          budget: Number.parseFloat(formData.budget),
          location: formData.location,
          deadline: formData.deadline,
          urgency: formData.urgency || "normal",
          whatIncluded: formData.whatIncluded || "",
          requirements: formData.requirements || "",
          tags: formData.tags || [],
          skills: formData.skills || [],
        };
        
        try {
          // Call addRequest from database-services.js
          const response = await addRequest(requestData);
          console.log("Request created:", response);
          
          // Redirect to requests page or show success message
          alert("Service request created successfully!");
          router.push("/requests");
        } catch (error) {
          console.error("Error creating request:", error);
          // Fall back to demo mode if backend request fails
          alert("Service request created in demo mode!");
          router.push("/requests");
        }
      }
    } catch (error) {
      console.error(`Error submitting ${postType}:`, error);
      if (postType === "service") {
        alert(`Error creating service: ${error.message}`);
      } else {
        alert(`Error creating request: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
};
  
  // Helper function to map category form values to database names
  function mapCategoryValue(categoryValue) {
    const categoryMap = {
      "home-garden": "Home & Garden",
      "tech-support": "Tech Support",
      tutoring: "Tutoring",
      transportation: "Transportation",
      cooking: "Cooking",
      childcare: "Childcare",
      repairs: "Repairs",
      "health-wellness": "Health & Wellness",
      "arts-crafts": "Arts & Crafts",
      photography: "Photography",
      "language-exchange": "Language Exchange",
      fitness: "Fitness",
      other: "Other",
    }
    return categoryMap[categoryValue] || categoryValue
  }

  const steps =
    postType === "service"
      ? [
          { number: 1, title: "Basic Info", description: "Service details and pricing" },
          { number: 2, title: "Availability", description: "Location and schedule" },
          { number: 3, title: "Additional Info", description: "Images and requirements" },
        ]
      : [
          { number: 1, title: "Request Details", description: "What you need and budget" },
          { number: 2, title: "Timeline", description: "Location and deadline" },
          { number: 3, title: "Additional Info", description: "Images and requirements" },
        ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Show loading while checking authentication */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Main Content - only show when not loading and user is authenticated */}
      {!loading && isLoggedIn && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/services">
            <Button variant="ghost" className="mb-4 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStep === 0
              ? "What would you like to do?"
              : postType === "service"
                ? "List Your Service"
                : "Post Service Request"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {currentStep === 0
              ? "Choose whether you want to offer a service or request one from the community"
              : postType === "service"
                ? "Share your skills with the TimeNest community and earn time credits"
                : "Request services from the TimeNest community using your time credits"}
          </p>
        </div>

        {/* Type Selection */}
        {currentStep === 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                postType === "service"
                  ? "ring-2 ring-blue-500 bg-blue-600 dark:bg-blue-700"
                  : "bg-white dark:bg-gray-800"
              }`}
              onClick={() => setPostType("service")}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle
                  className={`text-xl ${postType === "service" ? "text-white" : "text-gray-900 dark:text-white"}`}
                >
                  Offer a Service
                </CardTitle>
                <CardDescription
                  className={`text-base ${
                    postType === "service" ? "text-gray-100" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Share your skills and expertise with the community. Earn time credits by helping others.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul
                  className={`space-y-2 text-sm ${
                    postType === "service" ? "text-gray-100" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <li>• Set your own rates in time credits</li>
                  <li>• Choose your availability</li>
                  <li>• Build your reputation</li>
                  <li>• Help your community</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                postType === "request"
                  ? "ring-2 ring-blue-500 bg-blue-600 dark:bg-blue-700"
                  : "bg-white dark:bg-gray-800"
              }`}
              onClick={() => setPostType("request")}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle
                  className={`text-xl ${postType === "request" ? "text-white" : "text-gray-900 dark:text-white"}`}
                >
                  Request a Service
                </CardTitle>
                <CardDescription
                  className={`text-base ${
                    postType === "request" ? "text-gray-100" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Need help with something? Post a request and let service providers come to you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul
                  className={`space-y-2 text-sm ${
                    postType === "request" ? "text-gray-100" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <li>• Describe what you need</li>
                  <li>• Set your budget in time credits</li>
                  <li>• Receive proposals from providers</li>
                  <li>• Choose the best match</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Steps */}
        {currentStep > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step.number ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit}>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{postType === "service" ? "Service Details" : "Request Details"}</CardTitle>
                <CardDescription>
                  {postType === "service"
                    ? "Tell us about the service you want to offer"
                    : "Describe what you need help with"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{postType === "service" ? "Service Title *" : "Request Title *"}</Label>
                  <Input
                    id="title"
                    placeholder={
                      postType === "service"
                        ? "e.g., Guitar Lessons for Beginners"
                        : "e.g., Need help with garden maintenance"
                    }
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder={
                      postType === "service"
                        ? "Describe your service in detail. What will you provide? What makes your service special?"
                        : "Describe what you need help with. Be specific about your requirements and expectations."
                    }
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  <p className="text-sm text-gray-500">{formData.description.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={postType === "service" ? "timeCredits" : "budget"}>
                      {postType === "service" ? "Time Credits per Hour *" : "Budget (Time Credits) *"}
                    </Label>
                    <Input
                      id={postType === "service" ? "timeCredits" : "budget"}
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      placeholder="1.5"
                      value={postType === "service" ? formData.timeCredits : formData.budget}
                      onChange={(e) =>
                        handleInputChange(postType === "service" ? "timeCredits" : "budget", e.target.value)
                      }
                      className={errors[postType === "service" ? "timeCredits" : "budget"] ? "border-red-500" : ""}
                    />
                    {errors[postType === "service" ? "timeCredits" : "budget"] && (
                      <p className="text-sm text-red-500">
                        {errors[postType === "service" ? "timeCredits" : "budget"]}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {postType === "service" ? "Recommended: 1-3 credits per hour" : "Total budget for the entire job"}
                    </p>
                  </div>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {postType === "service"
                      ? "Time credits represent the value of your service. 1 credit = 1 hour of standard service time. Consider your skill level and service complexity when setting your rate."
                      : "Time credits represent the value you're willing to pay. 1 credit = 1 hour of standard service time. Set a fair budget based on the complexity and time required."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location & Availability/Timeline */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{postType === "service" ? "Location & Availability" : "Location & Timeline"}</CardTitle>
                <CardDescription>
                  {postType === "service"
                    ? "Where and when can you provide your service?"
                    : "Where do you need the service and by when?"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Service Location *</Label>
                  <LocationAutocomplete
                    name="location"
                    required
                    value={formData.location}
                    onChange={(value) => handleInputChange("location", value)}
                  />
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                  <p className="text-sm text-gray-500">
                    {postType === "service"
                      ? "This helps users find services in their area. You can offer services remotely or in-person."
                      : "Where do you need the service to be performed?"}
                  </p>
                </div>

                {postType === "request" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={formData.deadline}
                        onChange={(e) => handleInputChange("deadline", e.target.value)}
                        className={errors.deadline ? "border-red-500" : ""}
                      />
                      {errors.deadline && <p className="text-sm text-red-500">{errors.deadline}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency Level</Label>
                      <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          {urgencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={option.color}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>{postType === "service" ? "Availability *" : "Preferred Time Slots *"}</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availabilityOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={formData.availability.includes(option.id)}
                          onCheckedChange={() => handleAvailabilityChange(option.id)}
                        />
                        <Label htmlFor={option.id} className="text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.availability && <p className="text-sm text-red-500">{errors.availability}</p>}
                  <p className="text-sm text-gray-500">
                    {postType === "service"
                      ? "Select all time slots when you're typically available. You can always adjust specific bookings later."
                      : "Select your preferred time slots for when you'd like the service to be performed."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* <Card>
                <CardHeader>
                  <CardTitle>{postType === "service" ? "Service Images" : "Reference Images"}</CardTitle>
                  <CardDescription>
                    {postType === "service"
                      ? "Add photos to showcase your service (optional but recommended)"
                      : "Add photos to help providers understand what you need (optional)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {postType === "service" ? "Upload service images" : "Upload reference images"}
                    </p>
                    <p className="text-gray-500 mb-4">Drag and drop images here, or click to browse</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose Images</span>
                      </Button>
                    </Label>
                    <p className="text-sm text-gray-500 mt-2">Maximum 5 images, up to 5MB each</p>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url || "/placeholder.svg"}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>
                    {postType === "service"
                      ? "Help users understand what to expect"
                      : "Help providers understand your specific needs"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatIncluded">
                      {postType === "service" ? "What's Included" : "What You'll Provide"}
                    </Label>
                    <Textarea
                      id="whatIncluded"
                      placeholder={
                        postType === "service"
                          ? "e.g., All materials provided, 1-hour session, follow-up support..."
                          : "e.g., All materials will be provided, workspace is available, parking available..."
                      }
                      rows={3}
                      value={formData.whatIncluded}
                      onChange={(e) => handleInputChange("whatIncluded", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      {postType === "service" ? "Requirements" : "Special Requirements"}
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder={
                        postType === "service"
                          ? "e.g., Please have a quiet space available, bring your own instrument..."
                          : "e.g., Must have own tools, experience with specific materials required..."
                      }
                      rows={3}
                      value={formData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (Optional)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTag(e.target.value.trim())
                            e.target.value = ""
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector("input")
                          addTag(input.value.trim())
                          input.value = ""
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Add relevant tags to help users find your {postType} (e.g., beginner-friendly, online, weekend)
                    </p>
                  </div>
                  <div className="space-y-2">

                    {postType === "request" && (
                      <>
                                          <Label>Required Skills (for requests)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.skills?.map((skill) => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a required skill..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                const skill = e.target.value.trim()
                                addSkill(skill)
                                e.target.value = ""
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector("input")
                              addSkill(input.value.trim())
                              input.value = ""
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                          Add skills that service providers should have (e.g., Garden Design, Native Plants, Sustainable
                          Landscaping)
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/services">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              {currentStep === 0 ? (
                <Button type="button" onClick={handleNext} disabled={!postType}>
                  Continue
                </Button>
              ) : currentStep < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handlePublish} disabled={isLoading}>
                  {isLoading ? "Publishing..." : `Publish ${postType === "service" ? "Service" : "Request"}`}
                </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      )}
    </div>
  )
}