import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, Tag, ImageIcon } from "lucide-react"

export default function ServiceRequestCard({ request }) {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "Normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "Closed":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) return "Flexible"

    const availabilityMap = {
      "weekday-mornings": "Weekday Mornings",
      "weekday-afternoons": "Weekday Afternoons",
      "weekday-evenings": "Weekday Evenings",
      "weekend-mornings": "Weekend Mornings",
      "weekend-afternoons": "Weekend Afternoons",
      "weekend-evenings": "Weekend Evenings",
      flexible: "Flexible",
    }

    return availability.map((slot) => availabilityMap[slot] || slot).join(", ")
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Request Image */}
      {request.images && request.images.length > 0 && (
        <div className="relative h-48 w-full">
          <Image
            src={request.images[0].url || "/placeholder.svg?height=200&width=300&text=Request"}
            alt={request.title}
            fill
            className="object-cover rounded-t-lg"
          />
          {request.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {request.images.length}
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header with title and status */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-foreground hover:text-primary line-clamp-2">
            <Link href={`/requests/${request.id}`}>{request.title}</Link>
          </h3>
          <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
            <Badge className={`text-xs ${getUrgencyColor(request.urgency)}`}>{request.urgency}</Badge>
            <Badge className={`text-xs ${getStatusColor(request.status)}`}>{request.status}</Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{request.description}</p>

        {/* Category and Budget */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs">
            {request.category}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs">{request.budget} credits</Badge>
        </div>

        {/* Tags */}
        {request.tags && request.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {request.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {request.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{request.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Location and Deadline */}
        <div className="flex flex-col gap-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            {request.location}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Due: {new Date(request.deadline).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            {formatAvailability(request.availability)}
          </div>
        </div>

        {/* Requirements Preview */}
        {request.requirements && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-xs font-medium text-foreground mb-1">Requirements:</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{request.requirements}</p>
          </div>
        )}

        {/* What's Included Preview */}
        {request.whatIncluded && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <h4 className="text-xs font-medium text-primary mb-1">What's Provided:</h4>
            <p className="text-xs text-primary/80 line-clamp-2">{request.whatIncluded}</p>
          </div>
        )}

        {/* Footer with requester info */}
        <div className="pt-4 border-t flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
              <Image
                src={request.user.image || "/placeholder.svg?height=32&width=32&text=User"}
                alt={request.user.name}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{request.user.name}</p>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-3 w-3 ${i < Math.floor(request.user.rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">{request.user.rating}</span>
              </div>
            </div>
          </div>
          <Link href={`/requests/${request.id}`} className="text-sm font-medium text-primary hover:text-primary/90">
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
