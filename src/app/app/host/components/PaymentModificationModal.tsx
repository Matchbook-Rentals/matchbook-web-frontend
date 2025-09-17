'use client'

import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from 'date-fns'
import BrandModal from '@/components/BrandModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createPaymentModification } from '@/app/actions/payment-modifications'
import { toast } from 'sonner'

interface BookingPaymentData {
  tenant: string
  amount: string
  type: string
  method: string
  bank: string
  dueDate: string
  status: string
  avatarUrl?: string
  paymentId?: string
  numericAmount?: number
  parsedDueDate?: Date
}

interface PaymentModificationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  payment: BookingPaymentData
  bookingId: string
  recipientId: string
}

const formatAmountToCents = (amount: number): number => {
  return Math.round(amount * 100)
}

const formatAmountFromCents = (cents: number): number => {
  return cents / 100
}

const formatDateForInput = (date: Date): string => {
  // Format as YYYY-MM-DD without timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function PaymentModificationModal({
  isOpen,
  onOpenChange,
  payment,
  bookingId,
  recipientId
}: PaymentModificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: payment.numericAmount ? formatAmountFromCents(payment.numericAmount) : 0,
    dueDate: payment.parsedDueDate ? formatDateForInput(payment.parsedDueDate) : '',
    reason: ''
  })

  // Calendar state
  const currentDate = payment.parsedDueDate || new Date()
  const [calendarMonth, setCalendarMonth] = useState(currentDate.getMonth())
  const [calendarYear, setCalendarYear] = useState(currentDate.getFullYear())
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  // Generate month names and year range
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i) // Show 2 years back and 7 years forward

  const resetForm = () => {
    setFormData({
      amount: payment.numericAmount ? formatAmountFromCents(payment.numericAmount) : 0,
      dueDate: payment.parsedDueDate ? formatDateForInput(payment.parsedDueDate) : '',
      reason: ''
    })
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Create a new date with the selected date components to avoid timezone issues
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const formattedDate = formatDateForInput(localDate)
      setFormData(prev => ({ ...prev, dueDate: formattedDate }))
      setCalendarOpen(false)
    }
  }

  const goToPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(calendarYear + 1)
    } else {
      setCalendarMonth(calendarMonth + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!payment.paymentId) {
      toast.error('Payment ID is required')
      return
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    if (!formData.dueDate) {
      toast.error('Due date is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Create date without timezone conversion by parsing the date string manually
      const [year, month, day] = formData.dueDate.split('-').map(Number)
      const newDueDate = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid timezone issues
      
      await createPaymentModification({
        rentPaymentId: payment.paymentId,
        newAmount: formatAmountToCents(formData.amount),
        newDueDate,
        reason: formData.reason.trim() || undefined,
        recipientId
      })

      toast.success('Payment modification request sent successfully')
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error creating payment modification:', error)
      toast.error('Failed to create payment modification request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  const originalAmount = payment.numericAmount ? formatAmountFromCents(payment.numericAmount) : 0
  const hasChanges = formData.amount !== originalAmount || 
                    formData.dueDate !== (payment.parsedDueDate ? formatDateForInput(payment.parsedDueDate) : '')

  return (
    <BrandModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="max-w-md"
      heightStyle="!top-[15vh]"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Modify Payment
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Original Payment</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Amount: ${originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div>Due Date: {payment.dueDate}</div>
              <div>Type: {payment.type}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              New Amount
            </Label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
              New Due Date
            </Label>
            <div className="mt-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="dueDate"
                    variant="outline"
                    className="w-full h-12 py-2 justify-between bg-white rounded-lg border border-solid border-[#d0d5dd] shadow-shadows-shadow-xs px-3 font-normal hover:bg-white"
                  >
                    <span className={formData.dueDate ? "text-gray-900" : "text-gray-400"}>
                      {formData.dueDate ? (() => {
                        const [year, month, day] = formData.dueDate.split('-').map(Number)
                        const localDate = new Date(year, month - 1, day)
                        return format(localDate, 'MMMM d, yyyy')
                      })() : 'Select due date'}
                    </span>
                    <CalendarIcon className="w-5 h-5 text-[#667085]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-3 z-[1100]" align="start" sideOffset={5}>
                  <div className="space-y-3">
                    {/* Month and Year Navigation Header */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="h-8 w-8 p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="font-medium text-gray-900">
                        {months[calendarMonth]} {calendarYear}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextMonth}
                        className="h-8 w-8 p-0 border-[#0b6969] text-[#0b6969] hover:bg-[#0b6969] hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Calendar */}
                    <Calendar
                      mode="single"
                      month={new Date(calendarYear, calendarMonth)}
                      onMonthChange={(date) => {
                        setCalendarMonth(date.getMonth());
                        setCalendarYear(date.getFullYear());
                      }}
                      selected={formData.dueDate ? (() => {
                        const [year, month, day] = formData.dueDate.split('-').map(Number)
                        return new Date(year, month - 1, day)
                      })() : undefined}
                      onSelect={handleDateSelect}
                      initialFocus
                      classNames={{
                        day_selected: "bg-[#0b6969] text-primary-foreground hover:bg-[#0b6969] hover:text-primary-foreground focus:bg-[#0b6969] focus:text-primary-foreground",
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-4 w-full",
                        caption: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-around",
                        head_cell: "text-muted-foreground rounded-md w-9 text-center font-normal text-[0.8rem]",
                        row: "flex w-full mt-2 justify-around",
                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
              Reason for Modification (Optional)
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Explain why you're requesting this modification..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="bg-[#0b6969] hover:bg-[#0a5a5a] text-white"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </div>
    </BrandModal>
  )
}