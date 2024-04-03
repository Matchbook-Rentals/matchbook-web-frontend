import React from 'react'
import ProgressBar from './progress-bar'
import AddPropertyClient from './app-property-client'

export default function AddPropertyPage() {
  const steps = ['Property Type', 'Details', 'Photos', 'Lease Terms', 'Amenities']
  return (
    <div>
      <AddPropertyClient />
    </div>
  )
}
