import React from 'react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { MapPin } from 'lucide-react'

interface LocationChange {
  id: string
  createdAt: Date
  changedFields: string[]
  oldStreetAddress1: string | null
  oldStreetAddress2: string | null
  oldCity: string | null
  oldState: string | null
  oldPostalCode: string | null
  newStreetAddress1: string | null
  newStreetAddress2: string | null
  newCity: string | null
  newState: string | null
  newPostalCode: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

interface LocationChangesSectionProps {
  locationChanges: LocationChange[]
}

export function LocationChangesSection({ locationChanges }: LocationChangesSectionProps) {
  if (locationChanges.length === 0) {
    return null
  }

  const formatAddress = (
    streetAddress1: string | null,
    streetAddress2: string | null,
    city: string | null,
    state: string | null,
    postalCode: string | null
  ) => {
    const parts = [
      streetAddress1,
      streetAddress2,
      city,
      state,
      postalCode
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'No address'
  }

  const fieldLabels: Record<string, string> = {
    streetAddress1: 'Street Address',
    streetAddress2: 'Apartment/Unit',
    city: 'City',
    state: 'State',
    postalCode: 'ZIP Code'
  }

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-600">Location Change History</h3>
        <Badge variant="outline">{locationChanges.length} change{locationChanges.length !== 1 ? 's' : ''}</Badge>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800 mb-4">
          This listing has recent location changes that require review as part of the approval process.
        </p>
        
        <div className="space-y-4">
          {locationChanges.map((change) => (
            <div key={change.id} className="bg-background border border-orange-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-sm">
                    {change.user ? `${change.user.firstName} ${change.user.lastName}` : 'Unknown user'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })} • {new Date(change.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(change.changedFields as string[]).map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {fieldLabels[field] || field}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-red-700 mb-1">Previous Address</div>
                  <div className="text-sm bg-red-50 border border-red-200 rounded p-2">
                    {formatAddress(
                      change.oldStreetAddress1,
                      change.oldStreetAddress2,
                      change.oldCity,
                      change.oldState,
                      change.oldPostalCode
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-green-700 mb-1">New Address</div>
                  <div className="text-sm bg-green-50 border border-green-200 rounded p-2">
                    {formatAddress(
                      change.newStreetAddress1,
                      change.newStreetAddress2,
                      change.newCity,
                      change.newState,
                      change.newPostalCode
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}