'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandModal from '@/components/BrandModal'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, DollarSign } from 'lucide-react'

interface EditBookingSummaryDialogProps {
  bookingId: string
  currentMonthlyRent: number | null
  onUpdate?: () => void
}

export default function EditBookingSummaryDialog({
  bookingId,
  currentMonthlyRent,
  onUpdate
}: EditBookingSummaryDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    monthlyRent: currentMonthlyRent ? (currentMonthlyRent / 100).toFixed(2) : ''
  })

  const handleInputChange = (value: string) => {
    // Allow decimal numbers for currency
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setFormData({ monthlyRent: value })
    }
  }

  const validateForm = () => {
    const errors = []

    if (!formData.monthlyRent || isNaN(Number(formData.monthlyRent))) {
      errors.push('Valid monthly rent is required')
    } else if (Number(formData.monthlyRent) <= 0) {
      errors.push('Monthly rent must be greater than 0')
    } else if (Number(formData.monthlyRent) > 50000) {
      errors.push('Monthly rent seems unusually high (max $50,000)')
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
      // Convert monthly rent from dollars to cents for storage
      const monthlyRentCents = Math.round(Number(formData.monthlyRent) * 100)

      if (monthlyRentCents === currentMonthlyRent) {
        toast({
          title: "No Changes",
          description: "No changes were made to update.",
        })
        setOpen(false)
        return
      }

      // Use the specific server action
      const { updateBookingRent } = await import('@/app/admin/booking-management/_actions')
      await updateBookingRent(bookingId, monthlyRentCents)

      toast({
        title: "Monthly Rent Updated",
        description: `Monthly rent has been updated to $${Number(formData.monthlyRent).toLocaleString()}.`,
      })

      setOpen(false)
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating monthly rent:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update monthly rent. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        monthlyRent: currentMonthlyRent ? (currentMonthlyRent / 100).toFixed(2) : ''
      })
    }
    setOpen(newOpen)
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not Set'
    const dollars = amount / 100
    // Only show decimals if they exist
    const formattedAmount = dollars % 1 === 0
      ? dollars.toLocaleString()
      : dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `$${formattedAmount}`
  }

  return (
    <BrandModal
      isOpen={open}
      onOpenChange={handleOpenChange}
      triggerButton={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="w-4 h-4" />
        </Button>
      }
      className="max-w-md"
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Edit Monthly Rent
          </h2>
          <p className="text-muted-foreground mt-2">
            Update the monthly rent amount for this booking.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="monthlyRent"
                  type="text"
                  inputMode="decimal"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange(e.target.value)}
                  disabled={isLoading}
                  placeholder="2500.00"
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter amount in dollars (e.g., 2500.00)
              </p>
            </div>

            <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded space-y-1">
              <div>Current: {formatCurrency(currentMonthlyRent)}</div>
              {formData.monthlyRent && !isNaN(Number(formData.monthlyRent)) && (
                <div className="pt-2 border-t">
                  New: ${(() => {
                    const amount = Number(formData.monthlyRent)
                    return amount % 1 === 0
                      ? amount.toLocaleString()
                      : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  })()}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Changing the monthly rent will affect future payment calculations.
                Existing payments will not be automatically updated.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </BrandModal>
  )
}