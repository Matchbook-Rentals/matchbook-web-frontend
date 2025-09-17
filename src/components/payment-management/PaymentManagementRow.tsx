'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { ChevronDown, ChevronRight, Calendar, DollarSign, Edit, XCircle } from 'lucide-react'
import CancelPaymentDialog from './CancelPaymentDialog'
import ReschedulePaymentDialog from './ReschedulePaymentDialog'
import EditPaymentAmountDialog from './EditPaymentAmountDialog'
import { PaymentBreakdown, formatPaymentBreakdown } from '@/lib/payment-breakdown'
import {
  getRentPaymentBreakdown,
  cancelRentPayment,
  rescheduleRentPayment,
  updateRentPaymentAmount,
  toggleRentPaymentPaidStatus
} from '@/app/admin/booking-management/_actions'

interface PaymentManagementRowProps {
  payment: {
    id: string
    amount: number
    dueDate: Date
    isPaid: boolean
    stripePaymentMethodId?: string | null
  }
  bookingData: {
    monthlyRent: number | null
    startDate: Date
    endDate: Date
    trip: {
      numPets: number
    } | null
    match: {
      petRent: number | null
    } | null
    listing: {
      petRent: number | null
    }
  }
}

export default function PaymentManagementRow({
  payment,
  bookingData
}: PaymentManagementRowProps) {
  const { toast } = useToast()
  const router = useRouter()

  // Format payment amounts (may include service charges with decimals)
  const formatPaymentAmount = (amountInCents: number | null) => {
    if (!amountInCents) return 'Not Set';
    const dollars = amountInCents / 100;
    // Only show decimals if they exist
    return dollars % 1 === 0
      ? dollars.toLocaleString()
      : dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // UI states
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [showEditAmountDialog, setShowEditAmountDialog] = useState(false)

  // Loading states
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null)

  // Load payment breakdown
  const loadBreakdown = useCallback(async () => {
    if (breakdown) return breakdown // Already loaded

    setLoadingBreakdown(true)
    try {
      const paymentBreakdown = await getRentPaymentBreakdown(payment.id)
      setBreakdown(paymentBreakdown)
      return paymentBreakdown
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment breakdown",
        variant: "destructive"
      })
      return null
    } finally {
      setLoadingBreakdown(false)
    }
  }, [payment.id, breakdown, toast])

  // Action handlers
  const handleToggleExpand = useCallback(async () => {
    if (!isExpanded && !breakdown) {
      await loadBreakdown()
    }
    setIsExpanded(!isExpanded)
  }, [isExpanded, breakdown, loadBreakdown])

  const handleReschedule = useCallback(() => {
    setShowRescheduleDialog(true)
  }, [])

  const handleEditAmount = useCallback(async () => {
    if (!breakdown) {
      await loadBreakdown()
    }
    setShowEditAmountDialog(true)
  }, [breakdown, loadBreakdown])

  const handleCancel = useCallback(() => {
    setShowCancelDialog(true)
  }, [])

  const handleTogglePaid = useCallback(async () => {
    try {
      await toggleRentPaymentPaidStatus(payment.id)

      toast({
        title: "Payment Status Updated",
        description: `Payment has been marked as ${payment.isPaid ? 'unpaid' : 'paid'}`
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment status",
        variant: "destructive"
      })
    }
  }, [payment.id, payment.isPaid, toast, router])

  // Dialog action handlers
  const handleCancelPayment = useCallback(async (reason: string) => {
    await cancelRentPayment(payment.id, reason)
    router.refresh()
  }, [payment.id, router])

  const handleReschedulePayment = useCallback(async (newDueDate: Date, reason: string) => {
    await rescheduleRentPayment(payment.id, newDueDate, reason)
    router.refresh()
  }, [payment.id, router])

  const handleEditPaymentAmount = useCallback(async (newAmount: number, reason: string) => {
    await updateRentPaymentAmount(payment.id, newAmount, reason)
    router.refresh()
  }, [payment.id, router])

  const formattedBreakdown = breakdown ? formatPaymentBreakdown(breakdown) : null

  return (
    <>
      <div className="border rounded-lg bg-white overflow-hidden">
        {/* Payment Header - Clickable to expand */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={handleToggleExpand}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <div>
                <p className="font-medium">${formatPaymentAmount(payment.amount)}</p>
                <p className="text-sm text-muted-foreground">Due: {formatDate(payment.dueDate)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={payment.isPaid ? "default" : "outline"}>
              {payment.isPaid ? "Paid" : "Pending"}
            </Badge>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t bg-gray-50 p-4">
            {loadingBreakdown ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading breakdown...</div>
              </div>
            ) : breakdown && formattedBreakdown ? (
              <div className="space-y-4">
                {/* Payment Breakdown */}
                <div>
                  <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Payment Breakdown
                  </h4>
                  <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Rent:</span>
                      <span>{formattedBreakdown.baseRent}</span>
                    </div>
                    {breakdown.petRent > 0 && (
                      <div className="flex justify-between">
                        <span>Pet Rent:</span>
                        <span>{formattedBreakdown.petRent}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Service Fee ({(breakdown.serviceFeeRate * 100).toFixed(1)}%):</span>
                      <span>{formattedBreakdown.serviceFee}</span>
                    </div>
                    {breakdown.isUsingCard && (
                      <div className="flex justify-between">
                        <span>Card Fee:</span>
                        <span>{formattedBreakdown.creditCardFee}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${formatPaymentAmount(payment.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div>
                  <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReschedule}
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditAmount}
                      className="flex items-center gap-1"
                    >
                      <DollarSign className="w-4 h-4" />
                      Edit Amount
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      variant={payment.isPaid ? "outline" : "default"}
                      size="sm"
                      onClick={handleTogglePaid}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Mark as {payment.isPaid ? 'Unpaid' : 'Paid'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Failed to load breakdown</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CancelPaymentDialog
        isOpen={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        paymentId={payment.id}
        amount={payment.amount}
        dueDate={payment.dueDate}
        onCancel={handleCancelPayment}
      />

      <ReschedulePaymentDialog
        isOpen={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        paymentId={payment.id}
        amount={payment.amount}
        currentDueDate={payment.dueDate}
        onReschedule={handleReschedulePayment}
      />

      <EditPaymentAmountDialog
        isOpen={showEditAmountDialog}
        onOpenChange={setShowEditAmountDialog}
        paymentId={payment.id}
        currentAmount={payment.amount}
        originalBreakdown={breakdown}
        onEditAmount={handleEditPaymentAmount}
      />
    </>
  )
}