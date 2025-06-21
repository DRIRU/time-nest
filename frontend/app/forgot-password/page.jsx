import Layout from "@/components/layout/layout"
import ForgotPasswordPage from "@/components/forgot-password-page"

export const metadata = {
  title: "Forgot Password | TimeNest",
  description: "Reset your TimeNest account password",
}

export default function ForgotPassword() {
  return (
    <Layout>
      <ForgotPasswordPage />
    </Layout>
  )
}
