'use client'

import { useState } from 'react'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Clock } from 'lucide-react'

interface ReschedulePaymentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  paymentId: string
  amount: number
  currentDueDate: Date
  onReschedule: (newDueDate: Date, reason: string) => Promise<void>
}

export default function ReschedulePaymentDialog({
  isOpen,
  onOpenChange,
  paymentId,
  amount,
  currentDueDate,
  onReschedule
}: ReschedulePaymentDialogProps) {
  const { toast } = useToast()
  const [newDueDate, setNewDueDate] = useState('')
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

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const validateForm = () => {
    const errors = []

    if (!newDueDate) {
      errors.push('New due date is required')
    } else {
      const selectedDate = new Date(newDueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        errors.push('Due date cannot be in the past')
      }

      if (selectedDate.getTime() === currentDueDate.getTime()) {
        errors.push('New due date must be different from current due date')
      }
    }

    if (!reason.trim()) {
      errors.push('Reason for rescheduling is required')
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
      const newDate = new Date(newDueDate)
      await onReschedule(newDate, reason.trim())

      toast({
        title: "Payment Rescheduled",
        description: `Payment has been rescheduled to ${formatDate(newDate)}`
      })

      setNewDueDate('')
      setReason('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule payment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      setNewDueDate('')
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
            <Calendar className="w-5 h-5" />
            Reschedule Payment
          </h2>
          <p className="text-muted-foreground mt-2">
            Change the due date for this rent payment.
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
              <span className="text-muted-foreground">Current Due Date:</span>
              <span className="font-medium">{formatDate(currentDueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment ID:</span>
              <span className="font-mono">{paymentId.slice(-8)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="newDueDate">New Due Date *</Label>
            <Input
              id="newDueDate"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={formatDateForInput(new Date())}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Rescheduling *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this payment is being rescheduled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-2"
              disabled={isLoading}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Both the guest and host will be notified of this schedule change.
                This action will be logged for audit purposes.
              </p>
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
              {isLoading ? "Rescheduling..." : "Reschedule Payment"}
            </Button>
          </div>
        </form>
      </div>
    </BrandModal>
  )
}