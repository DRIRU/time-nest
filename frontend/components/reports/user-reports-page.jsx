"use client"

import { useState, useEffect } from "react"
import { Clock, Flag, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", icon: Clock, label: "Pending" },
  under_review: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", icon: Eye, label: "Under Review" },
  resolved: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle, label: "Resolved" },
  dismissed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", icon: XCircle, label: "Dismissed" },
  escalated: { color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: AlertTriangle, label: "Escalated" },
}

const REPORT_TYPE_LABELS = {
  service_quality: "Poor Service Quality",
  fraud_scam: "Fraud or Scam",
  inappropriate_content: "Inappropriate Content",
  payment_dispute: "Payment Dispute",
  no_show: "No Show",
  unprofessional_behavior: "Unprofessional Behavior",
  safety_concern: "Safety Concern",
  other: "Other",
}

export default function UserReportsPage() {
  const { currentUser, isLoggedIn } = useAuth()
  const [reports, setReports] = useState({
    made: [],
    received: [],
  })
  const [stats, setStats] = useState({
    reports_made_count: 0,
    reports_received_count: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      fetchUserReports()
      fetchUserStats()
    }
  }, [isLoggedIn, currentUser])

  const fetchUserReports = async () => {
    try {
      const response = await fetch("/api/reports", {
        headers: {
          "Authorization": `Bearer ${currentUser.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // Separate reports into made and received
        const reportsMade = data.filter(report => report.reporter_id === currentUser.user_id)
        const reportsReceived = data.filter(report => report.reported_user_id === currentUser.user_id)
        
        setReports({
          made: reportsMade,
          received: reportsReceived,
        })
      } else {
        console.error("Failed to fetch reports")
        setError("Failed to load reports")
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setError("Failed to load reports")
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/reports/user/${currentUser.user_id}/stats`, {
        headers: {
          "Authorization": `Bearer ${currentUser.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching report stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const ReportCard = ({ report, isReporter = true }) => {
    const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
    const StatusIcon = statusConfig.icon

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                </Badge>
                <Badge className={`text-xs ${statusConfig.color}`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {report.category}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{formatDate(report.created_at)}</p>
              {report.resolved_at && (
                <p className="text-xs">
                  Resolved: {formatDate(report.resolved_at)}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {report.category === "service" ? "Service:" : "Request:"}
              </p>
              <p className="font-medium">
                {report.service_title || report.request_title || "Unknown"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isReporter ? "Reported User:" : "Reporter:"}
              </p>
              <p className="font-medium">
                {isReporter ? report.reported_user_name : report.reporter_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <p className="text-sm leading-relaxed">
                {report.description.length > 200 
                  ? `${report.description.substring(0, 200)}...` 
                  : report.description
                }
              </p>
            </div>

            {report.admin_notes && (
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground mb-1">Admin Notes:</p>
                <p className="text-sm bg-muted p-2 rounded">{report.admin_notes}</p>
              </div>
            )}

            {report.resolution && (
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground mb-1">Resolution:</p>
                <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded text-green-800 dark:text-green-400">
                  {report.resolution}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please log in to view your reports.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports_made_count}</div>
            <p className="text-xs text-muted-foreground">Reports you've submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reports Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reports_received_count}</div>
            <p className="text-xs text-muted-foreground">Reports about your services/requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="made" className="w-full">
        <TabsList>
          <TabsTrigger value="made">
            Reports Made ({reports.made.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            Reports Received ({reports.received.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="made" className="mt-6">
          {reports.made.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Made</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any reports yet.
                </p>
                <Link href="/services">
                  <Button variant="outline">Browse Services</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div>
              {reports.made.map((report) => (
                <ReportCard key={report.report_id} report={report} isReporter={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          {reports.received.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Received</h3>
                <p className="text-muted-foreground">
                  Great! No one has reported issues with your services or requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {reports.received.map((report) => (
                <ReportCard key={report.report_id} report={report} isReporter={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
