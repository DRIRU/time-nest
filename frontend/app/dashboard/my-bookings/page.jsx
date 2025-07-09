import Layout from "@/components/layout/layout"
import MyBookingsPage from "@/components/dashboard/my-bookings-page"

export const metadata = {
  title: "My Bookings | TimeNest",
  description: "Manage your service bookings on TimeNest",
}

export default function MyBookings() {
  return (
    <Layout>
      <MyBookingsPage />
    </Layout>
  )
}
