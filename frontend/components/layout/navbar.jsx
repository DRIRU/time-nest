"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, User, LogOut, ChevronDown, MessageCircle, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Navbar() {
  const pathname = usePathname()
  const { isLoggedIn, currentUser, logout } = useAuth()
  console.log(currentUser)

  // Navigation items with their paths and labels
  const navItems = [
    { path: "/services", label: "Browse Services" },
    { path: "/requests", label: "Service Requests" },
    ...(isLoggedIn ? [{ path: "/list-service", label: "List Service" }] : []),
    ...(isLoggedIn ? [{ path: "/messages", label: "Messages" }] : []),
  ]

  const handleLogout = () => {
    logout()
    // Optionally redirect to home page after logout
    if (pathname === "/profile" || pathname === "/messages" || pathname.startsWith("/dashboard")) {
      window.location.href = "/"
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-foreground">TimeNest</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  pathname === item.path ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
                } transition-colors flex items-center space-x-1`}
                onClick={item.onClick}
              >
                {item.path === "/messages" && <MessageCircle className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{currentUser?.firstName || "User"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Join Community</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}