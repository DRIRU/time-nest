import Layout from "@/components/layout/layout"
import MyServicesPage from "@/components/dashboard/my-services-page"

export const metadata = {
  title: "My Services | TimeNest",
  description: "Manage your listed services on TimeNest",
}

export default function MyServices() {
  return (
    <Layout>
      <MyServicesPage />
    </Layout>
  )
}
