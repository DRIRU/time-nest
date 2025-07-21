import Layout from "@/components/layout/layout"
import ServiceDetailPage from "@/components/services/service-detail-page"
import { getServiceById } from "@/lib/database-services"

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const service = await getServiceById(id)

    if (!service) {
      return {
        title: "Service Not Found | TimeNest",
      }
    }

    return {
      title: `${service.title} | TimeNest`,
      description: service.description,
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Service | TimeNest",
    }
  }
}

export default async function ServiceDetail({ params }) {
  try {
    const { id } = await params
    const service = await getServiceById(id)
    
    if (!service) {
      return (
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
              <p className="text-gray-600">The service you're looking for doesn't exist.</p>
            </div>
          </div>
        </Layout>
      )
    }

    return (
      <Layout>
        <ServiceDetailPage initialService={service} />
      </Layout>
    )
  } catch (error) {
    console.error("Error loading service:", error)
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Temporarily Unavailable</h1>
            <p className="text-gray-600 mb-4">We're experiencing technical difficulties. Please try again later.</p>
          </div>
        </div>
      </Layout>
    )
  }
}