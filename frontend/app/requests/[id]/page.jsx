import Layout from "@/components/layout/layout"
import ServiceRequestDetailPage from "@/components/service-requests/service-request-detail-page"
import { getServiceRequestById } from "@/lib/service-requests-data"

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const request = await getServiceRequestById(id)

    if (!request) {
      return {
        title: "Request Not Found | TimeNest",
      }
    }

    return {
      title: `${request.title} | TimeNest Service Requests`,
      description: request.description,
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Service Request | TimeNest",
    }
  }
}

export default async function ServiceRequestPage({ params }) {
  try {
    const { id } = await params
    const request = await getServiceRequestById(id)

    if (!request) {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Request Not Found</h1>
              <p className="text-gray-600">The service request you're looking for doesn't exist.</p>
            </div>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        <ServiceRequestDetailPage id={id} initialRequest={request} />
      </Layout>
    )
  } catch (error) {
    console.error("Error loading service request:", error)
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Request Temporarily Unavailable</h1>
            <p className="text-gray-600 mb-4">We're experiencing technical difficulties. Please try again later.</p>
          </div>
        </div>
      </Layout>
    )
  }
}