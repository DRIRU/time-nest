import Link from "next/link"
import { Calendar, MapPin, Clock, Users, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ServiceRequestCard({ request, getUrgencyColor }) {
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
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col">
        <div className="aspect-video relative overflow-hidden">
          <img
            src={image || "/placeholder.svg?height=200&width=300&text=Request"}
            alt={title}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-2 right-2 bg-green-600">{budget} credits total</Badge>
          <Badge className={`absolute top-2 left-2 ${getUrgencyColor(urgency)}`}>
            <AlertCircle className="h-3 w-3 mr-1" />
            {getUrgencyLabel(urgency)}
          </Badge>
        </div>
        <CardContent className="p-4 flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{title}</h3>
          </div>
          <Badge variant="outline" className="mb-3">
            {category}
          </Badge>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{formatDeadline(deadline)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{Array.isArray(availability) ? availability.join(", ") : "Flexible"}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 border-t">
          <div className="flex justify-between items-center w-full">
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
        </CardFooter>
      </Card>
    </Link>
  )
}
