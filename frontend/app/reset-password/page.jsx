import Layout from "@/components/layout/layout"
import ResetPasswordPage from "@/components/reset-password-page"

export const metadata = {
  title: "Reset Password | TimeNest",
  description: "Reset your TimeNest account password",
}

export default function ResetPassword() {
  return (
    <Layout>
      <ResetPasswordPage />
    </Layout>
  )
}