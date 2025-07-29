import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, Tag, ImageIcon } from "lucide-react"

export default function ServiceRequestListItem({ request }) {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Completed":
        return "bg-purple-100 text-purple-800"
      case "Closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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
    <div className="bg-card rounded-lg shadow-sm border-border hover:shadow-md transition-shadow p-5">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Image Section */}
        {request.images && request.images.length > 0 && (
          <div className="relative w-full lg:w-48 h-32 flex-shrink-0">
            <Image
              src={request.images[0].url || "/placeholder.svg?height=128&width=192&text=Request"}
              alt={request.title}
              fill
              className="object-cover rounded-lg"
            />
            {request.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {request.images.length}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground hover:text-blue-600 mb-2">
                <Link href={`/requests/${request.id}`}>{request.title}</Link>
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {request.category}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 text-xs">{request.budget} credits</Badge>
                <Badge className={`text-xs ${getUrgencyColor(request.urgency)}`}>{request.urgency} Priority</Badge>
                <Badge className={`text-xs ${getStatusColor(request.status)}`}>{request.status}</Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{request.description}</p>

          {/* Tags */}
          {request.tags && request.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {request.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {request.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{request.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Requirements and What's Included */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {request.requirements && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-xs font-medium text-card-foreground mb-1">Requirements:</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">{request.requirements}</p>
              </div>
            )}
            {request.whatIncluded && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <h4 className="text-xs font-medium text-primary mb-1">What's Provided:</h4>
                <p className="text-xs text-primary line-clamp-2">{request.whatIncluded}</p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{request.location}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{formatAvailability(request.availability)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
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
                  {typeof request.user.rating === 'number' && request.user.totalReviews > 0 ? (
                    <>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(request.user.rating) ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">{request.user.rating.toFixed(1)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No rating</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Posted: {new Date(request.createdAt).toLocaleDateString()}
              </span>
              <Link href={`/requests/${request.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
