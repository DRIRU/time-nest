import Layout from "@/components/layout/layout"
import RegisterPage from "@/components/register-page"

export const metadata = {
  title: "Join Community | TimeNest",
  description: "Join the TimeNest community and start exchanging services",
}

export default function Register() {
  return (
    <Layout>
      <RegisterPage />
    </Layout>
  )
}
