import Link from "next/link"
import { Calendar, MapPin, Clock, Users, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ServiceRequestListItem({ request, getUrgencyColor }) {
  // Destructure with default values to prevent undefined errors
  const {
    id,
    title = "",
    requester = "Anonymous",
    requesterImage = "",
    budget = 0,
    category = "",
    location = "",
    image = "",
    availability = [],
    deadline = "",
    urgency = "normal",
    proposals = 0,
    description = "",
  } = request || {}

  // Get requester initials for avatar fallback with null check
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U"

    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return "No deadline"
    const date = new Date(deadline)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Due today"
    if (diffDays === 1) return "Due tomorrow"
    if (diffDays <= 7) return `Due in ${diffDays} days`
    return date.toLocaleDateString()
  }

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "Urgent"
      case "high":
        return "High Priority"
      case "normal":
        return "Normal"
      case "low":
        return "Low Priority"
      default:
        return "Normal"
    }
  }

  return (
    <Link href={`/requests/${id}`}>
      <div className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 hover:shadow-md transition-all duration-200">
        <div className="w-full md:w-48 h-32 flex-shrink-0 relative">
          <img
            src={image || "/placeholder.svg?height=200&width=300&text=Request"}
            alt={title}
            className="w-full h-full object-cover rounded-md"
          />
          <Badge className={`absolute top-2 left-2 text-xs ${getUrgencyColor(urgency)}`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            {getUrgencyLabel(urgency)}
          </Badge>
        </div>
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            <Badge className="w-fit bg-green-600">{budget} credits total</Badge>
          </div>
          <Badge variant="outline" className="mb-3">
            {category}
          </Badge>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDeadline(deadline)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{Array.isArray(availability) ? availability.join(", ") : "Flexible"}</span>
            </div>
          </div>
        </div>
        <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 md:w-40 flex-shrink-0 mt-4 md:mt-0 border-t pt-4 md:pt-0 md:border-t-0">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={requesterImage || "/placeholder.svg?height=40&width=40"} alt={requester} />
              <AvatarFallback>{getInitials(requester)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{requester}</span>
          </div>
          <div className="flex items-center text-blue-600">
            <Users className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{proposals} proposals</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
