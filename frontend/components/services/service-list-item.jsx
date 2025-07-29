import { MapPinIcon } from "@heroicons/react/20/solid"
import Link from "next/link"

function ServiceListItem({ service }) {
  return (
    <Link href={`/services/${service.id}`} className="block">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex">
        {service.imageUrl && (
          <img src={service.imageUrl || "/placeholder.svg"} alt={service.title} className="h-full w-32 object-cover" />
        )}
        <div className="p-4 flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{service.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{service.description}</p>
          <div>
            {service.categories &&
              service.categories.map((category) => (
                <span
                  key={category}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded mr-2"
                >
                  {category}
                </span>
              ))}
          </div>
          {service.location && (
            <div className="mt-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                {service.location}
              </span>
            </div>
          )}
          {typeof service.rating === 'number' && service.totalReviews > 0 ? (
            <div className="mt-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center">
                <svg className="h-4 w-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-yellow-400 font-medium">{service.rating.toFixed(1)}</span>
                <span className="ml-1">({service.totalReviews || 0} reviews)</span>
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs">No rating</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
          <div>
            Provided by:
            <span className="text-sm text-gray-600 dark:text-gray-300">{service.provider.name}</span>
          </div>
          {service.credits && (
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
              Credits: {service.credits}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ServiceListItem
