import Layout from "@/components/layout/layout"
import ServiceRequestDetailPage from "@/components/service-requests/service-request-detail-page"

export default function ServiceRequestPage({ params }) {
  return (
    <Layout>
      <ServiceRequestDetailPage id={params.id} />
    </Layout>
  )
}
