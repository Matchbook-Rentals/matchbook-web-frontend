'use client'

import { useState } from 'react'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { XCircle, AlertTriangle } from 'lucide-react'

interface CancelPaymentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  amount: number
  dueDate: Date
  onCancel: (reason: string) => Promise<void>
}

export default function CancelPaymentDialog({
  isOpen,
  onOpenChange,
  paymentId,
  amount,
  dueDate,
  onCancel
}: CancelPaymentDialogProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await onCancel(reason.trim())

      toast({
        title: "Payment Cancelled",
        description: "The payment has been cancelled successfully"
      })

      setReason('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel payment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setReason('')
    }
    onOpenChange(open)
  }

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      className="max-w-lg"
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Cancel Payment
          </h2>
          <p className="text-muted-foreground mt-2">
            Cancel this rent payment and provide a reason for audit purposes.
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-medium">{formatDate(dueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment ID:</span>
              <span className="font-mono">{paymentId.slice(-8)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this payment is being cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
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
                  Warning: This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>The payment will be permanently cancelled</li>
                    <li>Both guest and host will be notified</li>
                    <li>This action will be logged for audit purposes</li>
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
              variant="destructive"
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? "Cancelling..." : "Cancel Payment"}
            </Button>
          </div>
        </form>
      </div>
    </BrandModal>
  )
}