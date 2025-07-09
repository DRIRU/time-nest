import Layout from "@/components/layout/layout"
import MyRequestsPage from "@/components/dashboard/my-requests-page"

export const metadata = {
  title: "My Requests | TimeNest",
  description: "Manage your service requests on TimeNest",
}

export default function MyRequests() {
  return (
    <Layout>
      <MyRequestsPage />
    </Layout>
  )
}
