"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  FileText, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Services",
      href: "/dashboard/my-services",
      icon: Clock,
    },
    {
      name: "My Bookings",
      href: "/dashboard/my-bookings",
      icon: Calendar,
    },
    {
      name: "My Requests",
      href: "/dashboard/my-requests",
      icon: FileText,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white dark:bg-gray-800"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">TimeNest</span>
            </Link>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="px-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-500" : "text-gray-500"}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  )
}