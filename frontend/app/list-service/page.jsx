import Layout from "@/components/layout/layout"
import ListServicePage from "@/components/list-service-page"

export const metadata = {
  title: "List Your Service | TimeNest",
  description: "Offer your skills and services to the TimeNest community using time credits",
}

export default function ListService() {
  return (
    <Layout>
      <ListServicePage />
    </Layout>
  )
}
