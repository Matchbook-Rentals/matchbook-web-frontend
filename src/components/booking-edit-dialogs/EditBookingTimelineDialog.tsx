'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import BrandModal from '@/components/BrandModal'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EditBookingTimelineDialogProps {
  bookingId: string
  currentStartDate: Date
  currentEndDate: Date
  currentStatus: string
  onUpdate?: () => void
}

const statusOptions = [
  { value: 'reserved', label: 'Reserved' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
]

export default function EditBookingTimelineDialog({
  bookingId,
  currentStartDate,
  currentEndDate,
  currentStatus,
  onUpdate
}: EditBookingTimelineDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    startDate: currentStartDate.toISOString().split('T')[0],
    endDate: currentEndDate.toISOString().split('T')[0],
    status: currentStatus
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const errors = []

    if (!formData.startDate) {
      errors.push('Start date is required')
    }

    if (!formData.endDate) {
      errors.push('End date is required')
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (start >= end) {
        errors.push('End date must be after start date')
      }
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
      const updates: any = {}

      // Check what changed and only update those fields
      if (formData.startDate !== currentStartDate.toISOString().split('T')[0]) {
        updates.startDate = new Date(formData.startDate)
      }

      if (formData.endDate !== currentEndDate.toISOString().split('T')[0]) {
        updates.endDate = new Date(formData.endDate)
      }

      if (formData.status !== currentStatus) {
        updates.status = formData.status
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were made to update.",
        })
        setOpen(false)
        return
      }

      // Use the specific server action
      const { updateBookingTimeline } = await import('@/app/admin/booking-management/_actions')
      await updateBookingTimeline(bookingId, updates)

      toast({
        title: "Timeline Updated",
        description: "Booking timeline has been updated successfully.",
      })

      setOpen(false)
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating booking timeline:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update booking timeline. Please try again.",
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
        startDate: currentStartDate.toISOString().split('T')[0],
        endDate: currentEndDate.toISOString().split('T')[0],
        status: currentStatus
      })
    }
    setOpen(newOpen)
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
            <Calendar className="w-5 h-5" />
            Edit Booking Timeline
          </h2>
          <p className="text-muted-foreground mt-2">
            Update the booking dates and status. Changes will be saved immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Check-in Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Check-out Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Booking Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
              <div className="space-y-1">
                <div>Current: {formatDate(currentStartDate)} to {formatDate(currentEndDate)}</div>
                <div>Status: {currentStatus}</div>
              </div>
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