'use client'

import { useState, useEffect } from 'react'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Receipt, Calendar, DollarSign, CreditCard, Pets } from 'lucide-react'
import { PaymentBreakdown, formatPaymentBreakdown } from '@/lib/payment-breakdown'

interface PaymentReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  amount: number
  dueDate: Date
  isPaid: boolean
  breakdown: PaymentBreakdown | null
  loading?: boolean
}

export default function PaymentReceiptDialog({
  isOpen,
  onOpenChange,
  paymentId,
  amount,
  dueDate,
  isPaid,
  breakdown,
  loading = false
}: PaymentReceiptDialogProps) {
  const formatCurrency = (cents: number) => {
    const dollars = cents / 100
    return `$${dollars.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formattedBreakdown = breakdown ? formatPaymentBreakdown(breakdown) : null

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="max-w-md"
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Receipt
          </h2>
          <p className="text-muted-foreground mt-2">
            Itemized breakdown for rent payment
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Payment ID</span>
                <span className="text-sm font-mono">{paymentId.slice(-8)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Due Date</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(dueDate)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge variant={isPaid ? "default" : "outline"}>
                  {isPaid ? "Paid" : "Pending"}
                </Badge>
              </div>
            </div>

            {/* Breakdown */}
            {formattedBreakdown ? (
              <div className="space-y-4">
                <h3 className="font-medium">Payment Breakdown</h3>

                <div className="space-y-3">
                  {/* Base Rent */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Base Monthly Rent</span>
                    </div>
                    <span className="text-sm font-medium">{formattedBreakdown.baseRent}</span>
                  </div>

                  {/* Pet Rent */}
                  {breakdown.petRent > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pets className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Pet Rent ({breakdown.petCount} pets)</span>
                      </div>
                      <span className="text-sm font-medium">{formattedBreakdown.petRent}</span>
                    </div>
                  )}

                  {/* Service Fee */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Service Fee ({formattedBreakdown.serviceFeeRate})</span>
                    </div>
                    <span className="text-sm font-medium">{formattedBreakdown.serviceFee}</span>
                  </div>

                  <Separator />

                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-sm font-medium">{formattedBreakdown.subtotal}</span>
                  </div>

                  {/* Credit Card Fee */}
                  {breakdown.isUsingCard && breakdown.creditCardFee > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Credit Card Processing Fee (3%)</span>
                      </div>
                      <span className="text-sm font-medium">{formattedBreakdown.creditCardFee}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                </div>

                {/* Trip Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Trip Duration:</strong> {breakdown.tripMonths} months
                    <br />
                    <strong>Service Fee Rate:</strong> {formattedBreakdown.serviceFeeRate}
                    ({breakdown.tripMonths > 6 ? 'Long-term' : 'Short-term'} rate)
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No breakdown available for this payment</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </BrandModal>
  )
}