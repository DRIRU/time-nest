import Layout from "@/components/layout/layout"
import ServiceRequestsPage from "@/components/service-requests/service-requests-page"

export const metadata = {
  title: "Service Requests | TimeNest",
  description: "Browse service requests from TimeNest community members",
}

export default function Requests() {
  return (
    <Layout>
      <ServiceRequestsPage />
    </Layout>
  )
}
