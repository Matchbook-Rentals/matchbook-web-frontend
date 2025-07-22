import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocationChangeById } from '../_actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink, MapPin, User, Calendar, FileText } from 'lucide-react'

interface PageProps {
  params: {
    changeId: string
  }
}

export default async function LocationChangeDetailPage({ params }: PageProps) {
  try {
    const locationChange = await getLocationChangeById(params.changeId)

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
      
      return parts.length > 0 ? parts.join(', ') : 'No address provided'
    }

    const getApprovalStatusBadge = (approvalStatus: string, isApproved: boolean) => {
      if (approvalStatus === 'approved' && isApproved) {
        return <Badge variant="success">Approved</Badge>
      }
      if (approvalStatus === 'rejected') {
        return <Badge variant="destructive">Rejected</Badge>
      }
      return <Badge variant="warning">Pending Review</Badge>
    }

    const fieldLabels: Record<string, string> = {
      streetAddress1: 'Street Address',
      streetAddress2: 'Apartment/Unit',
      city: 'City',
      state: 'State',
      postalCode: 'ZIP Code'
    }

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/address-change-approvals">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Address Changes
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Address Change Details</h1>
              <p className="text-gray-600 mt-1">
                Review the location change for {locationChange.listing.title}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/admin/listing-approval/${locationChange.listing.id}`}>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Listing
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Change Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fields Changed */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Fields Changed</h4>
                  <div className="flex flex-wrap gap-2">
                    {(locationChange.changedFields as string[]).map((field) => (
                      <Badge key={field} variant="outline">
                        {fieldLabels[field] || field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Address Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Old Address */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-700">Previous Address</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Street Address:</span>
                        <div className="text-sm">{locationChange.oldStreetAddress1 || 'Not provided'}</div>
                      </div>
                      {locationChange.oldStreetAddress2 && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Apartment/Unit:</span>
                          <div className="text-sm">{locationChange.oldStreetAddress2}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">City:</span>
                        <div className="text-sm">{locationChange.oldCity || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">State:</span>
                        <div className="text-sm">{locationChange.oldState || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">ZIP Code:</span>
                        <div className="text-sm">{locationChange.oldPostalCode || 'Not provided'}</div>
                      </div>
                      {(locationChange.oldLatitude && locationChange.oldLongitude) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                          <div className="text-sm">{locationChange.oldLatitude}, {locationChange.oldLongitude}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Address */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700">New Address</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Street Address:</span>
                        <div className="text-sm">{locationChange.newStreetAddress1 || 'Not provided'}</div>
                      </div>
                      {locationChange.newStreetAddress2 && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Apartment/Unit:</span>
                          <div className="text-sm">{locationChange.newStreetAddress2}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">City:</span>
                        <div className="text-sm">{locationChange.newCity || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">State:</span>
                        <div className="text-sm">{locationChange.newState || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">ZIP Code:</span>
                        <div className="text-sm">{locationChange.newPostalCode || 'Not provided'}</div>
                      </div>
                      {(locationChange.newLatitude && locationChange.newLongitude) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                          <div className="text-sm">{locationChange.newLatitude}, {locationChange.newLongitude}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Change Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Change Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Change Date:</span>
                  <div className="text-sm">{new Date(locationChange.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Change ID:</span>
                  <div className="text-xs text-gray-500 font-mono">{locationChange.id}</div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Changed By
                </CardTitle>
              </CardHeader>
              <CardContent>
                {locationChange.user ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <div className="text-sm">{locationChange.user.firstName} {locationChange.user.lastName}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <div className="text-sm">{locationChange.user.email}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">User ID:</span>
                      <div className="text-xs text-gray-500 font-mono">{locationChange.user.id}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Unknown user</div>
                )}
              </CardContent>
            </Card>

            {/* Listing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Listing Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Approval Status:</span>
                  <div className="mt-1">
                    {getApprovalStatusBadge(locationChange.listing.approvalStatus, locationChange.listing.isApproved)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Current Status:</span>
                  <div className="text-sm capitalize">{locationChange.listing.status}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Listing ID:</span>
                  <div className="text-xs text-gray-500 font-mono">{locationChange.listing.id}</div>
                </div>
                <Link href={`/admin/listing-approval/${locationChange.listing.id}`}>
                  <Button className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Review Listing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading location change:', error)
    notFound()
  }
}