import Layout from "@/components/layout/layout"
import ChatPage from "@/components/chat/chat-page"

export default async function Chat({ params }) {
  const { userId } = await params
  
  return (
    <Layout>
      <ChatPage userId={userId} />
    </Layout>
  )
}
