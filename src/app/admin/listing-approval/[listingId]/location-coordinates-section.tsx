'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'

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

interface LocationCoordinatesSectionProps {
  locationChanges: LocationChange[]
  onCoordinatesUpdate?: (lat: number, lng: number) => void
}

interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI/180)
}

export function LocationCoordinatesSection({ locationChanges, onCoordinatesUpdate }: LocationCoordinatesSectionProps) {
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodedCoords, setGeocodedCoords] = useState<GeocodeResult | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number, lng: number } | null>(null)
  
  if (locationChanges.length === 0) {
    return null
  }

  // Get the most recent location change
  const latestChange = locationChanges[0]
  
  // Check if coordinates have changed
  const hasCoordinateChanges = latestChange.oldLatitude !== latestChange.newLatitude || 
                               latestChange.oldLongitude !== latestChange.newLongitude

  if (!hasCoordinateChanges && !latestChange.newStreetAddress1) {
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

  const newAddress = formatAddress(
    latestChange.newStreetAddress1,
    latestChange.newStreetAddress2,
    latestChange.newCity,
    latestChange.newState,
    latestChange.newPostalCode
  )

  const handleGeocode = async () => {
    setIsGeocoding(true)
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(newAddress)}`)
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location
        const geocoded = {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address
        }
        setGeocodedCoords(geocoded)
        
        // Automatically select the geocoded coordinates
        setSelectedCoords(geocoded)
        onCoordinatesUpdate?.(geocoded.lat, geocoded.lng)
      } else {
        toast({
          title: 'Geocoding Failed',
          description: 'Could not find coordinates for the provided address.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast({
        title: 'Error',
        description: 'Failed to geocode address. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSelectCoordinates = (lat: number, lng: number, source: string) => {
    setSelectedCoords({ lat, lng })
    onCoordinatesUpdate?.(lat, lng)
    toast({
      title: 'Coordinates Selected',
      description: `Using ${source} coordinates for approval.`,
    })
  }

  const oldLat = latestChange.oldLatitude || 0
  const oldLng = latestChange.oldLongitude || 0
  const newLat = geocodedCoords?.lat || selectedCoords?.lat || 0
  const newLng = geocodedCoords?.lng || selectedCoords?.lng || 0

  const distance = (oldLat && oldLng && newLat && newLng) 
    ? calculateDistance(oldLat, oldLng, newLat, newLng)
    : null

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Navigation className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-600">Location Coordinates Update</h3>
        {hasCoordinateChanges && (
          <Badge variant="outline" className="bg-blue-50">Coordinates Changed</Badge>
        )}
      </div>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Coordinate Comparison & Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address and Geocoding Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">New Address:</p>
                <p className="text-sm text-gray-700">{newAddress}</p>
              </div>
              <Button
                onClick={handleGeocode}
                disabled={isGeocoding}
                size="sm"
                variant="outline"
                className="ml-4"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGeocoding ? 'Geocoding...' : 'See new coordinates'}
              </Button>
            </div>

            {geocodedCoords && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium text-green-700 mb-1">Geocoded Result:</p>
                <p className="text-xs text-gray-600 mb-2">{geocodedCoords.formatted_address}</p>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-xs">
                    Lat: {geocodedCoords.lat.toFixed(6)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Lng: {geocodedCoords.lng.toFixed(6)}
                  </Badge>
                  {!selectedCoords || (selectedCoords.lat !== geocodedCoords.lat || selectedCoords.lng !== geocodedCoords.lng) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectCoordinates(geocodedCoords.lat, geocodedCoords.lng, 'geocoded')}
                      className="ml-auto text-xs"
                    >
                      Use These Coordinates
                    </Button>
                  ) : (
                    <Badge className="ml-auto bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Coordinates Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left"></th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Latitude</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Longitude</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-medium">Current</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {oldLat ? oldLat.toFixed(6) : 'Not set'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {oldLng ? oldLng.toFixed(6) : 'Not set'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">-</td>
                </tr>
                {geocodedCoords && (
                  <tr className="bg-green-50">
                    <td className="border border-gray-300 px-3 py-2 font-medium text-green-700">Geocoded</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {geocodedCoords.lat.toFixed(6)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {geocodedCoords.lng.toFixed(6)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {!selectedCoords || (selectedCoords.lat !== geocodedCoords.lat || selectedCoords.lng !== geocodedCoords.lng) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectCoordinates(geocodedCoords.lat, geocodedCoords.lng, 'geocoded')}
                          className="text-xs"
                        >
                          Use These
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Distance Information */}
          {distance !== null && distance > 0 && (
            <Alert className={distance > 1 ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The new location is <strong>{distance < 1 ? `${(distance * 1000).toFixed(0)} meters` : `${distance.toFixed(2)} km`}</strong> away from the current location.
                {distance > 5 && ' This is a significant distance change that should be carefully reviewed.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Map Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Current Location</h4>
              <div className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border">
                {oldLat && oldLng ? (
                  <Image
                    src={`/api/map/static?latitude=${oldLat}&longitude=${oldLng}&zoom=13`}
                    alt="Current location map"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    No current coordinates
                  </div>
                )}
              </div>
              {oldLat && oldLng && (
                <p className="text-xs text-gray-600 mt-1">
                  {oldLat.toFixed(6)}, {oldLng.toFixed(6)}
                </p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">New Location</h4>
              <div className="relative aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border">
                {(geocodedCoords || selectedCoords) ? (
                  <Image
                    src={`/api/map/static?latitude=${selectedCoords?.lat || geocodedCoords?.lat}&longitude=${selectedCoords?.lng || geocodedCoords?.lng}&zoom=13`}
                    alt="New location map"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm px-4 text-center">
                    Click "See new coordinates" above to view new map location
                  </div>
                )}
              </div>
              {(geocodedCoords || selectedCoords) && (
                <p className="text-xs text-gray-600 mt-1">
                  {(selectedCoords?.lat || geocodedCoords?.lat)?.toFixed(6)}, {(selectedCoords?.lng || geocodedCoords?.lng)?.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Selected Coordinates Summary */}
          {selectedCoords && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Ready to update:</strong> Coordinates will be updated to {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)} upon approval.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}