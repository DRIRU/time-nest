import Layout from "@/components/layout/layout"
import ServiceRequestsPage from "@/components/service-requests/service-requests-page"
import { getServiceRequestsWithRatings } from "@/lib/service-requests-data"

export const metadata = {
  title: "Service Requests | TimeNest",
  description: "Browse service requests from TimeNest community members",
}

export default async function Requests() {
  try {
    // Get requests from the backend with actual user ratings
    const requests = await getServiceRequestsWithRatings()
    
    return (
      <Layout>
        <ServiceRequestsPage initialRequests={requests} />
      </Layout>
    )
  } catch (error) {
    console.error("Error loading service requests:", error)

    // Return a fallback UI instead of crashing
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Service Requests Temporarily Unavailable
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We're experiencing technical difficulties. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }
}