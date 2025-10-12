'use client'

import { useState, useEffect } from 'react'

// Extend window interface for payment method refresh
declare global {
  interface Window {
    refreshPaymentMethods?: () => void;
  }
}
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw, Check, AlertCircle, Calendar, DollarSign, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentMethodsSection } from '@/components/payment-review/sections/PaymentMethodsSection'
import { AddPaymentMethodInline } from '@/components/stripe/add-payment-method-inline'

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  hasPaymentMethod: boolean;
  retryCount: number;
}

interface ResetResponse {
  success: boolean;
  message: string;
  deleted: number;
  created: number;
  payments: Payment[];
  testScenarios: {
    overduePayment: {
      id: string;
      dueDate: string;
      hasPaymentMethod: boolean;
      note: string;
    };
    futurePayments: Array<{
      id: string;
      dueDate: string;
      hasPaymentMethod: boolean;
      note?: string;
    }>;
    mixedPaymentMethods?: boolean;
    note: string;
  };
}

export default function RentPaymentsTestPage() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [result, setResult] = useState<ResetResponse | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = useState<'card' | 'bank'>('card')
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false)

  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as string
      const hasAdminAccess = userRole?.includes('admin')
      if (!hasAdminAccess) {
        router.push('/unauthorized')
        return
      }
    }
    setIsLoading(false)
  }, [user, router])

  const handlePaymentMethodSelect = (methodId: string, methodType: 'card' | 'bank') => {
    setSelectedPaymentMethod(methodId)
    setSelectedPaymentMethodType(methodType)
  }

  const handleReset = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method first')
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/admin/test/reset-rent-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: selectedPaymentMethod,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        toast.success(`Reset complete! Deleted ${data.deleted}, created ${data.created} payments`)
      } else {
        toast.error(data.error || 'Failed to reset rent payments')
      }
    } catch (error) {
      console.error('Error resetting rent payments:', error)
      toast.error('Error resetting rent payments')
    } finally {
      setIsResetting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2)
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/test')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Test Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Rent Payment Test Data Reset</h1>
        <p className="text-muted-foreground">
          Reset all rent payments and create test data for cron job testing
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Test Scenarios
            </CardTitle>
            <CardDescription className="text-amber-800">
              This will create the following test payments:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-amber-900">
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>1 Payment Due Oct 12:</strong> $26.58 with selected payment method (should process if running on Oct 12)
              </li>
              <li>
                <strong>3 Future Payments:</strong>
                <ul className="ml-6 mt-1 space-y-1 list-circle">
                  <li>$16.48 due Nov 1 (with payment method)</li>
                  <li>$1.03 due Nov 1 (with payment method)</li>
                  <li>$0.03 due Dec 1 (with payment method)</li>
                </ul>
              </li>
              <li>
                <strong>All Have Payment Methods:</strong> All 4 payments will use your selected payment method
              </li>
              <li>
                <strong>Real Bookings:</strong> Uses your existing bookings or finds bookings in the system
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method Selection</CardTitle>
            <CardDescription>
              Select a payment method to attach to test payments, or add a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentMethodsSection
              selectedMethod={selectedPaymentMethod}
              onSelectMethod={handlePaymentMethodSelect}
              onProceedToPayment={() => {}} // Not used in test context
              isProcessing={false}
              hidePaymentMethods={false}
            />

            {!showAddPaymentForm && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal"
                onClick={() => setShowAddPaymentForm(true)}
              >
                <div className="w-5 h-5 rounded-full border-2 border-teal-600 flex items-center justify-center">
                  <PlusIcon className="w-3.5 h-3.5" />
                </div>
                Add New Payment Method
              </Button>
            )}

            {showAddPaymentForm && (
              <AddPaymentMethodInline
                onSuccess={() => {
                  setShowAddPaymentForm(false)
                  // Trigger refresh of payment methods
                  if (window.refreshPaymentMethods) {
                    window.refreshPaymentMethods()
                  }
                }}
                onCancel={() => setShowAddPaymentForm(false)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reset Database</CardTitle>
            <CardDescription>
              This will DELETE ALL existing rent payments and create 4 test payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleReset}
              disabled={isResetting || !selectedPaymentMethod}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting...' : 'Reset Rent Payments'}
            </Button>
            {!selectedPaymentMethod && (
              <p className="text-xs text-red-600 mt-2">Please select a payment method first</p>
            )}
          </CardContent>
        </Card>

        {result && (
          <>
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Check className="h-5 w-5" />
                  Reset Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="text-green-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Deleted</p>
                    <p className="text-2xl font-bold">{result.deleted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Created</p>
                    <p className="text-2xl font-bold">{result.created}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Created Test Payments</CardTitle>
                <CardDescription>
                  {result.created} payments created for testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-lg">
                              ${formatAmount(payment.amount)}
                            </span>
                            {isOverdue(payment.dueDate) && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                            {!payment.hasPaymentMethod && (
                              <Badge variant="outline" className="ml-2">
                                No Payment Method
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(payment.dueDate)}</span>
                          </div>

                          <div className="text-xs text-gray-500">
                            <p>Payment ID: {payment.id}</p>
                            <p>Booking ID: {payment.bookingId}</p>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <Badge variant={payment.isPaid ? "success" : "secondary"}>
                            {payment.isPaid ? "Paid" : "Unpaid"}
                          </Badge>
                          {payment.retryCount > 0 && (
                            <p className="text-xs text-gray-500">
                              Retries: {payment.retryCount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Test Scenario Details</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-900 space-y-4">
                <div>
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    Overdue Payment
                    {result.testScenarios.overduePayment.hasPaymentMethod && (
                      <Badge variant="outline" className="text-xs">Has Payment Method</Badge>
                    )}
                  </p>
                  <p className="text-sm text-blue-800">
                    Payment <code className="bg-blue-100 px-1 py-0.5 rounded">{result.testScenarios.overduePayment.id}</code>
                    {' '}due {formatDate(result.testScenarios.overduePayment.dueDate)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {result.testScenarios.overduePayment.note}
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Test Payments</p>
                  <ul className="text-sm text-blue-800 space-y-2">
                    {result.testScenarios.futurePayments.map((p) => (
                      <li key={p.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{p.id}</code>
                          {' '}due {formatDate(p.dueDate)}
                          {p.hasPaymentMethod ? (
                            <Badge variant="outline" className="text-xs">With Payment Method</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No Payment Method</Badge>
                          )}
                        </div>
                        {p.note && (
                          <p className="text-xs text-blue-700 ml-4">{p.note}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-1">Payment Method Status</p>
                  <p className="text-sm text-blue-800">
                    {result.testScenarios.note}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
