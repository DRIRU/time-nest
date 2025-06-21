import Layout from "@/components/layout/layout"
import LoginPage from "@/components/login-page"

export const metadata = {
  title: "Sign In | TimeNest",
  description: "Sign in to your TimeNest account",
}

export default function Login() {
  return (
    <Layout>
      <LoginPage />
    </Layout>
  )
}
