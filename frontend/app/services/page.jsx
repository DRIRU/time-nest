import Layout from "@/components/layout/layout"
import ServicesPageClient from "@/components/services/services-page-client"
import { getAllServices } from "@/lib/database-services"

export const metadata = {
  title: "Browse Services | TimeNest",
  description: "Find services offered by TimeNest community members using time credits",
}

export default async function Services({ searchParams }) {
  try {
    // Get services from the backend
    const services = await getAllServices()
    return (
      <Layout>
        <ServicesPageClient initialServices={services} searchParams={searchParams} />
      </Layout>
    )
  } catch (error) {
    console.error("Error loading services:", error)

    // Return a fallback UI instead of crashing
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Services Temporarily Unavailable
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
