import Layout from "@/components/layout/layout"
import DashboardPage from "@/components/dashboard/dashboard-page"

export const metadata = {
  title: "Dashboard | TimeNest",
  description: "Manage your TimeNest account and services",
}

export default function Dashboard() {
  return (
    <Layout>
      <DashboardPage />
    </Layout>
  )
}