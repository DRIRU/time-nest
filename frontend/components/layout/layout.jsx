"use client"

import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import NoSSR from "@/components/no-ssr"
import Navbar from "./navbar"

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <NoSSR>
        <AuthProvider>
          <WebSocketProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Navbar />
              <main className="flex-grow">{children}</main>
              {/* Uncomment when you create a Footer component */}
              {/* <Footer /> */}
            </div>
          </WebSocketProvider>
        </AuthProvider>
      </NoSSR>
    </ThemeProvider>
  )
}
