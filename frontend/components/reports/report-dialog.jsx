"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Flag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

const REPORT_TYPES = [
  { value: "service_quality", label: "Poor Service Quality" },
  { value: "fraud_scam", label: "Fraud or Scam" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "payment_dispute", label: "Payment Dispute" },
  { value: "no_show", label: "No Show" },
  { value: "unprofessional_behavior", label: "Unprofessional Behavior" },
  { value: "safety_concern", label: "Safety Concern" },
  { value: "other", label: "Other" },
]

export default function ReportDialog({ 
  trigger,
  serviceId = null,
  requestId = null,
  reportedUserId,
  serviceName = "",
  requestName = "",
  onReportSubmitted = () => {},
  // External control props
  isOpen: externalIsOpen = null,
  onClose: externalOnClose = null,
  reportType = "service" // Add this prop for external usage
}) {
  const router = useRouter()
  const { currentUser, isLoggedIn } = useAuth()
  
  // Use external control if provided, otherwise use internal state
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== null ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnClose !== null ? externalOnClose : setInternalIsOpen
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    reportType: "",
    title: "",
    description: "",
  })

  // Determine category based on what's being reported
  const category = serviceId ? "service" : "request"
  const itemName = serviceId ? serviceName : requestName

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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.reportType) {
      newErrors.reportType = "Please select a report type"
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      alert("You must be logged in to submit a report")
      return
    }

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const requestData = {
        reported_service_id: serviceId ? parseInt(serviceId) : null,
        reported_request_id: requestId ? parseInt(requestId) : null,
        reported_user_id: parseInt(reportedUserId),
        report_type: formData.reportType,
        category: category, // Use the computed category
        title: formData.title,
        description: formData.description,
      };
      
      // Remove null fields to avoid sending them
      const cleanedData = Object.fromEntries(
        Object.entries(requestData).filter(([key, value]) => value !== null && value !== undefined)
      );
      
      console.log("Submitting report with data:", cleanedData);
      console.log("Raw serviceId:", serviceId, "type:", typeof serviceId);
      console.log("Raw requestId:", requestId, "type:", typeof requestId);
      console.log("Raw reportedUserId:", reportedUserId, "type:", typeof reportedUserId);
      console.log("Auth token:", currentUser.accessToken);
      
      const response = await fetch("http://localhost:8000/api/v1/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.accessToken}`,
        },
        body: JSON.stringify(cleanedData),
      })

      if (response.ok) {
        const reportData = await response.json()
        
        // Reset form
        setFormData({
          reportType: "",
          title: "",
          description: "",
        })
        setIsOpen(false)
        
        // Show success message
        alert("Report submitted successfully. We will review it and take appropriate action.")
        
        // Call callback
        onReportSubmitted(reportData)
      } else {
        // Try to get error details
        let errorMessage = "Failed to submit report";
        try {
          const errorData = await response.json()
          console.error("Error submitting report:", errorData)
          console.error("Response status:", response.status)
          console.error("Response statusText:", response.statusText)
          
          if (response.status === 400) {
            errorMessage = errorData.detail || "Invalid request. Please check your input."
          } else if (response.status === 404) {
            errorMessage = "The item you're trying to report was not found."
          } else if (response.status === 401) {
            errorMessage = "Authentication required. Please log in again."
          } else if (response.status === 422) {
            errorMessage = "Validation error. Please check your input fields."
            if (errorData.detail && Array.isArray(errorData.detail)) {
              const fieldErrors = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
              errorMessage += ` Details: ${fieldErrors}`;
            }
          } else {
            errorMessage = errorData.detail || `Server error (${response.status}). Please try again.`
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          console.log("Response status:", response.status)
          console.log("Response headers:", response.headers)
          
          // The response might be HTML instead of JSON
          const responseText = await response.text()
          console.log("Response text:", responseText.substring(0, 500))
          
          if (responseText.includes("<!DOCTYPE")) {
            errorMessage = "Server returned an HTML page instead of JSON. The API endpoint might not be available."
          }
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Failed to submit report. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (externalOnClose && !open) {
        externalOnClose();
      } else {
        setInternalIsOpen(open);
      }
    }}>
      {/* Only render trigger if no external control is provided */}
      {externalIsOpen === null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Report
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report {reportType === "service" ? "Service" : "Request"}
          </DialogTitle>
          <DialogDescription>
            Report issues with "{itemName || "this item"}" to help maintain a safe and trustworthy community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Type of Issue *</Label>
            <Select 
              value={formData.reportType} 
              onValueChange={(value) => handleInputChange("reportType", value)}
            >
              <SelectTrigger className={errors.reportType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select the type of issue" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reportType && <p className="text-sm text-red-500">{errors.reportType}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              maxLength={200}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            <p className="text-sm text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about the issue, including what happened, when it occurred, and any relevant context."
              rows={6}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            <p className="text-sm text-muted-foreground">
              {formData.description.length} characters (minimum 10)
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> False reports may result in account suspension. 
              Please only report genuine issues that violate our community guidelines.
            </AlertDescription>
          </Alert>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
