"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Users,
  Heart,
  ArrowRight,
  Star,
  Wrench,
  BookOpen,
  Car,
  Home,
  Utensils,
  Baby,
  Laptop,
  Search,
  Plus,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

  const stats = [
    { label: "Active Members", value: "2,847", icon: Users },
    { label: "Services Exchanged", value: "15,632", icon: Heart },
    { label: "Time Credits Earned", value: "89,420", icon: Clock },
    { label: "Community Rating", value: "4.9/5", icon: Star },
  ]

  const serviceCategories = [
    {
      name: "Home & Garden",
      icon: Home,
      count: "234 services",
      color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    {
      name: "Tech Support",
      icon: Laptop,
      count: "156 services",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      name: "Tutoring",
      icon: BookOpen,
      count: "189 services",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    },
    {
      name: "Transportation",
      icon: Car,
      count: "98 services",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    {
      name: "Cooking",
      icon: Utensils,
      count: "145 services",
      color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    {
      name: "Childcare",
      icon: Baby,
      count: "87 services",
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    },
    {
      name: "Repairs",
      icon: Wrench,
      count: "203 services",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    },
    {
      name: "Other",
      icon: Plus,
      count: "312 services",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-gray-900 dark:to-purple-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-900">
                🎉 Join 2,800+ community members
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Exchange Services with <span className="text-blue-600 dark:text-blue-400">Time Credits</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Build stronger communities by sharing skills and services. Earn time credits by helping others, then use
                them to get the help you need. One hour given equals one hour received.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/services">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Start Exchanging
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    <Search className="mr-2 h-5 w-5" />
                    Browse Services
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/placeholder.svg?height=500&width=600"
                alt="Community members helping each other"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">1 Hour = 1 Credit</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fair exchange guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">How TimeNest Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, fair, and community-driven. Start building connections today.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <CardTitle className="dark:text-white">Offer Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base dark:text-gray-300">
                  List services you can provide - from tutoring to home repairs. Set your availability and earn time
                  credits.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <CardTitle className="dark:text-white">Help Others</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base dark:text-gray-300">
                  Provide services to community members. Every hour you help earns you one time credit to use later.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <CardTitle className="dark:text-white">Get Help</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base dark:text-gray-300">
                  Use your earned time credits to access services you need. Fair exchange, stronger community.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Service Categories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Discover the wide range of services our community offers
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {serviceCategories.map((category, index) => (
              <Link href={`/services?category=${category.name}`} key={index}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md h-full dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${category.color}`}
                    >
                      <category.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{category.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to Join Our Community?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Start building meaningful connections and exchanging services today. Your first hour of help earns your
              first time credit!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Join TimeNest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 text-white border-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
