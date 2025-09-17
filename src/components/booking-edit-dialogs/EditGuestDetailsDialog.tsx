'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandModal from '@/components/BrandModal'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, Users } from 'lucide-react'

interface EditGuestDetailsDialogProps {
  bookingId: string
  tripId?: string
  currentNumAdults: number
  currentNumChildren: number
  currentNumPets: number
  onUpdate?: () => void
}

export default function EditGuestDetailsDialog({
  bookingId,
  tripId,
  currentNumAdults,
  currentNumChildren,
  currentNumPets,
  onUpdate
}: EditGuestDetailsDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    numAdults: currentNumAdults.toString(),
    numChildren: currentNumChildren.toString(),
    numPets: currentNumPets.toString()
  })

  const handleInputChange = (field: string, value: string) => {
    // Only allow numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateForm = () => {
    const errors = []

    if (!formData.numAdults || isNaN(Number(formData.numAdults)) || Number(formData.numAdults) < 1) {
      errors.push('Number of adults must be at least 1')
    }

    if (isNaN(Number(formData.numChildren)) || Number(formData.numChildren) < 0) {
      errors.push('Number of children must be 0 or greater')
    }

    if (isNaN(Number(formData.numPets)) || Number(formData.numPets) < 0) {
      errors.push('Number of pets must be 0 or greater')
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
      if (Number(formData.numAdults) !== currentNumAdults) {
        updates.numAdults = Number(formData.numAdults)
      }

      if (Number(formData.numChildren) !== currentNumChildren) {
        updates.numChildren = Number(formData.numChildren)
      }

      if (Number(formData.numPets) !== currentNumPets) {
        updates.numPets = Number(formData.numPets)
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
      if (!tripId) {
        throw new Error('Trip ID is required to update guest details')
      }

      const { updateGuestDetails } = await import('@/app/admin/booking-management/_actions')
      await updateGuestDetails(bookingId, tripId, updates)

      toast({
        title: "Guest Details Updated",
        description: "Guest information has been updated successfully.",
      })

      setOpen(false)
      if (onUpdate) {
        onUpdate()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating guest details:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update guest details. Please try again.",
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
        numAdults: currentNumAdults.toString(),
        numChildren: currentNumChildren.toString(),
        numPets: currentNumPets.toString()
      })
    }
    setOpen(newOpen)
  }

  const getTotalGuests = () => {
    return Number(formData.numAdults || 0) + Number(formData.numChildren || 0)
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
            <Users className="w-5 h-5" />
            Edit Guest Details
          </h2>
          <p className="text-muted-foreground mt-2">
            Update the number of guests staying in this booking.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="numAdults">Number of Adults *</Label>
              <Input
                id="numAdults"
                type="text"
                inputMode="numeric"
                value={formData.numAdults}
                onChange={(e) => handleInputChange('numAdults', e.target.value)}
                disabled={isLoading}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Minimum 1 adult required</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numChildren">Number of Children</Label>
              <Input
                id="numChildren"
                type="text"
                inputMode="numeric"
                value={formData.numChildren}
                onChange={(e) => handleInputChange('numChildren', e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numPets">Number of Pets</Label>
              <Input
                id="numPets"
                type="text"
                inputMode="numeric"
                value={formData.numPets}
                onChange={(e) => handleInputChange('numPets', e.target.value)}
                disabled={isLoading}
                placeholder="0"
              />
            </div>

            <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded space-y-1">
              <div>Current: {currentNumAdults + currentNumChildren} guests total</div>
              <div>• {currentNumAdults} adults</div>
              {currentNumChildren > 0 && <div>• {currentNumChildren} children</div>}
              {currentNumPets > 0 && <div>• {currentNumPets} pets</div>}
              <div className="pt-2 border-t">
                New total: {getTotalGuests()} guests
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