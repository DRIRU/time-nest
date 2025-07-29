import Link from "next/link"

const ServiceCard = ({ service }) => {
  return (
    <Link href={`/services/${service.id}`} className="block">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <img className="w-full h-48 object-cover" src={service.image || "/placeholder.svg"} alt={service.title} />
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-foreground mb-1">{service.title}</h3>
            <div className="flex flex-col gap-1">
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">{service.category}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>

          {/* Credits - Show actual cost */}
          <div className="mb-3">
            <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded">
              {service.timeCredits} credits
            </span>
          </div>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {service.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
              {service.tags.length > 3 && (
                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                  +{service.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Location, Provider, and Rating */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              {service.location || "Remote"}
            </div>
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {service.provider}
            </div>
            {typeof service.rating === 'number' && service.totalReviews > 0 ? (
              <div className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07 3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-yellow-400 font-medium">{service.rating.toFixed(1)}</span>
                <span className="ml-1">({service.totalReviews || 0})</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No rating</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ServiceCard
