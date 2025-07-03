import Layout from "@/components/layout/layout"
import ServiceDetailPage from "@/components/services/service-detail-page"

export const metadata = {
  title: "Service Details | TimeNest",
  description: "View details of a service offered by a TimeNest community member",
}

export default function ServiceDetail({ params }) {
  return (
    <Layout>
      <ServiceDetailPage />
    </Layout>
  )
}