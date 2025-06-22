import Layout from "@/components/layout/layout"
import ChatPage from "@/components/chat/chat-page"

export default function Chat({ params }) {
  return (
    <Layout>
      <ChatPage userId={params.userId} />
    </Layout>
  )
}
