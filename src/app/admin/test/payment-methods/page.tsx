'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw, AlertTriangle, CreditCard, User, Calendar, DollarSign, Loader2 } from 'lucide-react'

interface Match {
  id: string
  paymentStatus: string
  paymentAuthorized: boolean
  paymentCaptured: boolean
  paymentAmount: number | null
  paymentAuthorizedAt: string | null
  paymentCapturedAt: string | null
  tenantSigned: boolean
  landlordSigned: boolean
  listing: {
    id: string
    title: string
    locationString: string
  }
  trip: {
    id: string
    user: {
      id: string
      email: string
    }
  }
}

interface PaymentMethodInfo {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  totalMatches: number
  activeMatches: number
  matches: Match[]
}

export default function PaymentMethodDebugPage() {
  const { user } = useUser()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadPaymentMethods = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/payment-methods/current-user')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment methods')
      }

      setPaymentMethods(data.paymentMethods)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const refreshPaymentMethods = async () => {
    setRefreshing(true)
    await loadPaymentMethods()
    setRefreshing(false)
  }

  const clearStaleAssociations = async (paymentMethodId: string, force = false) => {
    const message = force
      ? 'FORCE MODE: This will clear ALL authorized but uncaptured payments, even recent ones. This is for stalled/failed bookings only. Are you sure?'
      : 'Are you sure you want to clear stale payment method associations? This will remove payment method references from completed or failed matches older than 7 days.'

    if (!confirm(message)) {
      return
    }

    setRefreshing(true)

    try {
      const url = `/api/admin/payment-methods/${paymentMethodId}/clear-stale${force ? '?force=true' : ''}`
      const response = await fetch(url, {
        method: 'POST'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear stale associations')
      }

      alert(`Successfully cleared ${data.clearedCount} stale associations`)

      // Refresh the payment methods list
      await loadPaymentMethods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadPaymentMethods()
    }
  }, [user])

  const getStatusBadge = (match: Match) => {
    if (match.paymentCaptured) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Captured</Badge>
    } else if (match.paymentAuthorized) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Authorized</Badge>
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  const getSigningStatus = (match: Match) => {
    if (match.tenantSigned && match.landlordSigned) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Fully Signed</Badge>
    } else if (match.tenantSigned) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Tenant Signed</Badge>
    } else if (match.landlordSigned) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Landlord Signed</Badge>
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Not Signed</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment methods...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Payment Methods</h1>
            <p className="text-muted-foreground">
              View and manage payment method associations that may prevent deletion
            </p>
          </div>
          <Button
            onClick={refreshPaymentMethods}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment Methods Found</h3>
            <p className="text-muted-foreground">
              You don't have any payment methods associated with your account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {paymentMethods.map((paymentMethod) => (
            <Card key={paymentMethod.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    •••• •••• •••• {paymentMethod.last4}
                    <Badge variant="outline" className="ml-2">
                      {paymentMethod.brand.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Expires {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
                    </span>
                    {paymentMethod.activeMatches > 0 && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => clearStaleAssociations(paymentMethod.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={refreshing}
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear Stale (7d+)
                        </Button>
                        <Button
                          onClick={() => clearStaleAssociations(paymentMethod.id, true)}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={refreshing}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Force Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                          <p className="text-2xl font-bold">{paymentMethod.totalMatches}</p>
                        </div>
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active (Blocking)</p>
                          <p className={`text-2xl font-bold ${paymentMethod.activeMatches > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {paymentMethod.activeMatches}
                          </p>
                        </div>
                        {paymentMethod.activeMatches > 0 ? (
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        ) : (
                          <DollarSign className="h-8 w-8 text-green-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {paymentMethod.totalMatches - paymentMethod.activeMatches}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  Payment Method ID: <span className="font-mono">{paymentMethod.id}</span>
                </div>

                {paymentMethod.activeMatches > 0 && (
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Blocking Matches ({paymentMethod.activeMatches})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {paymentMethod.matches.map((match) => (
                          <Card key={match.id} className="bg-gray-50">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">{match.listing.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{match.listing.locationString}</p>
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{match.trip.user.email}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {getStatusBadge(match)}
                                    {getSigningStatus(match)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">Match ID:</span>
                                    <span className="ml-2 font-mono text-xs">{match.id}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Trip ID:</span>
                                    <span className="ml-2 font-mono text-xs">{match.trip.id}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Listing ID:</span>
                                    <span className="ml-2 font-mono text-xs">{match.listing.id}</span>
                                  </div>
                                  {match.paymentAmount && (
                                    <div className="text-sm">
                                      <span className="font-medium">Amount:</span>
                                      <span className="ml-2">${(match.paymentAmount / 100).toFixed(2)}</span>
                                    </div>
                                  )}
                                  {match.paymentAuthorizedAt && (
                                    <div className="text-sm">
                                      <span className="font-medium">Authorized:</span>
                                      <span className="ml-2">{new Date(match.paymentAuthorizedAt).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {match.paymentCapturedAt && (
                                    <div className="text-sm">
                                      <span className="font-medium">Captured:</span>
                                      <span className="ml-2">{new Date(match.paymentCapturedAt).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {paymentMethod.activeMatches === 0 && paymentMethod.totalMatches > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <DollarSign className="h-4 w-4" />
                      All matches using this payment method have been completed. You can safely delete this payment method.
                    </div>
                  </div>
                )}

                {paymentMethod.totalMatches === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CreditCard className="h-4 w-4" />
                      This payment method is not associated with any matches. You can safely delete it.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}