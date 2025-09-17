'use client'

import { useState } from 'react'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { PaymentBreakdown, formatPaymentBreakdown } from '@/lib/payment-breakdown'

interface EditPaymentAmountDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  currentAmount: number
  originalBreakdown: PaymentBreakdown | null
  onEditAmount: (newAmount: number, reason: string) => Promise<void>
}

export default function EditPaymentAmountDialog({
  isOpen,
  onOpenChange,
  paymentId,
  currentAmount,
  originalBreakdown,
  onEditAmount
}: EditPaymentAmountDialogProps) {
  const { toast } = useToast()
  const [newAmount, setNewAmount] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const formatCurrency = (cents: number) => {
    const dollars = cents / 100
    return `$${dollars.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatDollars = (dollars: number) => {
    return `$${dollars.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }


  const handleAmountChange = (value: string) => {
    // Allow decimal numbers for currency
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setNewAmount(value)
    }
  }

  const validateForm = () => {
    const errors = []

    if (!newAmount || isNaN(Number(newAmount))) {
      errors.push('Valid amount is required')
    } else {
      const amount = Number(newAmount)
      if (amount <= 0) {
        errors.push('Amount must be greater than 0')
      }
      if (amount > 50000) {
        errors.push('Amount seems unusually high (max $50,000)')
      }
      const currentAmountDollars = currentAmount / 100
      if (Math.abs(amount - currentAmountDollars) < 0.01) {
        errors.push('New amount must be different from current amount')
      }
    }

    if (!reason.trim()) {
      errors.push('Reason for change is required')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const newAmountCents = Math.round(Number(newAmount) * 100)
      await onEditAmount(newAmountCents, reason.trim())

      toast({
        title: "Payment Amount Updated",
        description: `Payment amount has been updated to ${formatDollars(Number(newAmount))}`
      })

      setNewAmount('')
      setReason('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment amount",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setNewAmount('')
      setReason('')
    }
    onOpenChange(open)
  }

  const currentAmountDollars = currentAmount / 100
  const formattedOriginal = originalBreakdown ? formatPaymentBreakdown(originalBreakdown) : null

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      className="max-w-2xl"
    >
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Edit Payment Amount
          </h2>
          <p className="text-muted-foreground mt-2">
            Modify the payment amount and see the itemized breakdown.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <Label htmlFor="newAmount">New Payment Amount *</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="newAmount"
                type="text"
                inputMode="decimal"
                value={newAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={currentAmountDollars.toFixed(2)}
                className="pl-8"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Current Breakdown */}
          {originalBreakdown && (
            <div>
              <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Current Payment Breakdown
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Rent:</span>
                  <span>{formattedOriginal?.baseRent}</span>
                </div>
                {originalBreakdown.petRent > 0 && (
                  <div className="flex justify-between">
                    <span>Pet Rent:</span>
                    <span>{formattedOriginal?.petRent}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Service Fee:</span>
                  <span>{formattedOriginal?.serviceFee}</span>
                </div>
                {originalBreakdown.isUsingCard && (
                  <div className="flex justify-between">
                    <span>Card Fee:</span>
                    <span>{formattedOriginal?.creditCardFee}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Current Total:</span>
                  <span>{formatCurrency(currentAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Amount Change *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this payment amount is being changed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>This will modify the payment amount from the calculated breakdown</li>
                    <li>Both guest and host will be notified of this change</li>
                    <li>The change will be logged for audit purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Amount"}
            </Button>
          </div>
        </form>
      </div>
    </BrandModal>
  )
}