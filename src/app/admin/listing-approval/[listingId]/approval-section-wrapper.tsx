'use client'

import { useState } from 'react'
import { LocationCoordinatesSection } from './location-coordinates-section'
import { ApprovalActions } from './approval-actions'

interface LocationChange {
  id: string
  createdAt: Date
  changedFields: string[]
  oldStreetAddress1: string | null
  oldStreetAddress2: string | null
  oldCity: string | null
  oldState: string | null
  oldPostalCode: string | null
  oldLatitude: number | null
  oldLongitude: number | null
  newStreetAddress1: string | null
  newStreetAddress2: string | null
  newCity: string | null
  newState: string | null
  newPostalCode: string | null
  newLatitude: number | null
  newLongitude: number | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

interface ApprovalSectionWrapperProps {
  listingId: string
  listingTitle?: string
  locationChanges: LocationChange[]
}

export function ApprovalSectionWrapper({ 
  listingId, 
  listingTitle, 
  locationChanges 
}: ApprovalSectionWrapperProps) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number, lng: number } | null>(null)

  const handleCoordinatesUpdate = (lat: number, lng: number) => {
    setSelectedCoordinates({ lat, lng })
  }

  return (
    <>
      <LocationCoordinatesSection 
        locationChanges={locationChanges}
        onCoordinatesUpdate={handleCoordinatesUpdate}
      />
      <ApprovalActions 
        listingId={listingId} 
        listingTitle={listingTitle}
        locationChanges={locationChanges}
        selectedCoordinates={selectedCoordinates}
      />
    </>
  )
}