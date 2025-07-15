'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandButton } from '@/components/ui/brandButton'
import { Dialog, DialogContent, DialogTrigger } from '@/components/brandDialog'

interface AddPropertyModalProps {
  triggerButton?: React.ReactNode
  onPickUpWhereLeftOff?: () => void
  onStartBlank?: () => void
  listingInCreation?: { id: string } | null
}

export default function AddPropertyModal({ 
  triggerButton, 
  onPickUpWhereLeftOff,
  onStartBlank,
  listingInCreation 
}: AddPropertyModalProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePickUpWhereLeftOff = () => {
    if (onPickUpWhereLeftOff) {
      onPickUpWhereLeftOff()
    } else {
      // Default behavior - navigate to add property page with draftId if available
      if (listingInCreation?.id) {
        router.push(`/app/host/add-property?draftId=${listingInCreation.id}`)
      } else {
        router.push('/app/host/add-property')
      }
    }
  }

  const handleStartBlank = () => {
    if (onStartBlank) {
      onStartBlank()
    } else {
      // Default behavior - navigate to add property page with new=true
      router.push('/app/host/add-property?new=true')
    }
  }


  const defaultTrigger = (
    <BrandButton variant="default">
      Add Property
    </BrandButton>
  )

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent 
        className="flex flex-col items-center gap-6 p-6 bg-white w-full max-w-[calc(100%-2rem)] sm:max-w-md"
        showCloseButton={false}
      >
        <div className="flex items-center justify-center relative self-stretch w-full">
          <h2 className="text-lg font-semibold text-gray-900">How would you like to start?</h2>
        </div>

        <div className="flex flex-wrap gap-4 w-full">
          <BrandButton 
            variant="outline" 
            className="flex-1"
            onClick={handleStartBlank}
          >
            Start with a blank listing
          </BrandButton>
          <BrandButton 
            variant="default" 
            className="flex-1"
            onClick={handlePickUpWhereLeftOff}
          >
            Pick up where you left off
          </BrandButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
