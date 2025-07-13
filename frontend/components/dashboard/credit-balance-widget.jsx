"use client"

import { useState, useEffect } from "react"
import { Coins, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getUserCreditBalance } from "@/lib/database-services"
import { useAuth } from "@/contexts/auth-context"

export default function CreditBalanceWidget({ className = "" }) {
  const { currentUser } = useAuth()
  const [creditData, setCreditData] = useState({
    current_balance: 0,
    total_earned: 0,
    total_spent: 0,
    last_updated: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCreditBalance()
  }, [currentUser])

  const fetchCreditBalance = async () => {
    if (!currentUser?.user_id) return

    try {
      setLoading(true)
      setError(null)
      
      const data = await getUserCreditBalance()
      setCreditData(data)
      
    } catch (err) {
      console.error("Error fetching credit balance:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p className="text-sm">Failed to load credits</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCreditBalance}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Time Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Number(creditData.current_balance || 0).toFixed(2)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600">{Number(creditData.total_earned || 0).toFixed(2)}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Earned</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-600">{Number(creditData.total_spent || 0).toFixed(2)}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Spent</p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <Badge variant={Number(creditData.current_balance || 0) > 10 ? "default" : "secondary"}>
              {Number(creditData.current_balance || 0) > 10 ? "Active" : "Low Balance"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
