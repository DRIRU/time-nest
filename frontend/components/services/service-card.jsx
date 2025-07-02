import Link from "next/link"

const ServiceCard = ({ service }) => {
  return (
    <Link href={`/services/${service.id}`} className="block">
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <img className="w-full h-48 object-cover" src={service.image || "/placeholder.svg"} alt={service.title} />
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-white mb-1">{service.title}</h3>
            <div className="flex flex-col gap-1">
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">{service.category}</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{service.description}</p>

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
                <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
              {service.tags.length > 3 && (
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                  +{service.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Location and Provider */}
          <div className="space-y-2 text-sm text-gray-400">
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
              {service.provider || "Service Provider"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ServiceCard
