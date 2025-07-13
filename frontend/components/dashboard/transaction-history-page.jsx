"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, Coins, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardSidebar from "./dashboard-sidebar"
import { getUserTransactions } from "@/lib/database-services"
import { format } from "date-fns"
import Link from "next/link"

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState([])
  const [currentBalance, setCurrentBalance] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const limit = 20

  useEffect(() => {
    fetchTransactions(0, true)
  }, [])

  const fetchTransactions = async (skipCount, reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const data = await getUserTransactions({
        skip: skipCount,
        limit: limit
      })

      if (reset) {
        setTransactions(data.transactions)
      } else {
        setTransactions(prev => [...prev, ...data.transactions])
      }

      setCurrentBalance(data.current_balance)
      setTotalCount(data.total_count)
      setHasMore(data.transactions.length === limit)

    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const newPage = page + 1
    setPage(newPage)
    fetchTransactions(newPage * limit, false)
  }

  const getTransactionIcon = (type) => {
    const isPositive = type.includes('earning') || type.includes('bonus') || type.includes('refund')
    return isPositive ? TrendingUp : TrendingDown
  }

  const getTransactionColor = (type) => {
    if (type.includes('earning') || type.includes('bonus')) return "text-green-600 dark:text-green-400"
    if (type.includes('payment') || type.includes('spent')) return "text-red-600 dark:text-red-400"
    if (type.includes('refund')) return "text-blue-600 dark:text-blue-400"
    return "text-gray-600 dark:text-gray-400"
  }

  const getTransactionBadgeVariant = (type) => {
    if (type.includes('earning') || type.includes('bonus')) return "default"
    if (type.includes('payment') || type.includes('spent')) return "destructive"
    if (type.includes('refund')) return "secondary"
    return "outline"
  }

  const formatTransactionType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <DashboardSidebar />
        
        <div className="flex-1 p-8 md:ml-64">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track all your credit transactions and payments
              </p>
            </div>

            {/* Current Balance Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Coins className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {currentBalance.toFixed(2)} Credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && transactions.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button onClick={() => fetchTransactions(0, true)} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => {
                      const Icon = getTransactionIcon(transaction.transaction_type)
                      const colorClass = getTransactionColor(transaction.transaction_type)
                      const badgeVariant = getTransactionBadgeVariant(transaction.transaction_type)
                      const isPositive = parseFloat(transaction.amount) > 0

                      return (
                        <div key={transaction.transaction_id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800`}>
                              <Icon className={`h-5 w-5 ${colorClass}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatTransactionType(transaction.transaction_type)}
                                </p>
                                <Badge variant={badgeVariant} className="text-xs">
                                  {transaction.reference_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {transaction.description || 'No description'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-400">
                                  {format(new Date(transaction.created_at), 'MMM dd, yyyy at HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${colorClass}`}>
                              {isPositive ? '+' : ''}{parseFloat(transaction.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Balance: {parseFloat(transaction.balance_after).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button 
                          onClick={loadMore} 
                          variant="outline" 
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
