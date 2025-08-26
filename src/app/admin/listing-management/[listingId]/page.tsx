import { getListingDetailsForEdit } from '../../listing-management-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import CopyListingButton from './copy-listing-button'

export default async function ListingDetailPage({
  params
}: {
  params: { listingId: string }
}) {
  const listing = await getListingDetailsForEdit(params.listingId)

  if (!listing) {
    notFound()
  }

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'pendingReview':
      default:
        return <Badge variant="outline">Pending Review</Badge>
    }
  }

  const getActiveBadge = (active: boolean) => {
    return active ? 
      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge> :
      <Badge variant="outline" className="text-gray-600">Inactive</Badge>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                {listing.title}
                <div className="flex gap-2">
                  <Link href={`/admin/listing-management/${listing.id}/edit`}>
                    <Button size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Listing
                    </Button>
                  </Link>
                  <CopyListingButton 
                    listingId={listing.id} 
                    listingTitle={listing.title}
                    size="sm"
                  />
                </div>
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {listing.locationString || `${listing.city}, ${listing.state}`}
              </p>
            </div>
            <div className="flex gap-2">
              {getApprovalBadge(listing.approvalStatus)}
              {getActiveBadge(listing.markedActiveByUser)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Host Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Name:</span> {listing.user.firstName} {listing.user.lastName}</p>
                <p><span className="font-medium">Email:</span> {listing.user.email}</p>
              </div>
              <div>
                <p><span className="font-medium">Created:</span> {formatDate(listing.createdAt)}</p>
                <p><span className="font-medium">Last Modified:</span> {formatDate(listing.lastModified)}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="images">Images ({listing.listingImages.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Property Information</h2>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Type:</span> {listing.category}
                      </div>
                      <div>
                        <span className="font-medium">Bedrooms:</span> {listing.roomCount}
                      </div>
                      <div>
                        <span className="font-medium">Bathrooms:</span> {listing.bathroomCount}
                      </div>
                      <div>
                        <span className="font-medium">Square Footage:</span> {listing.squareFootage?.toLocaleString() || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Furnished:</span> {listing.furnished ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Pets Allowed:</span> {listing.petsAllowed ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-3">Lease Terms</h2>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="font-medium">Lease Length:</span> {listing.shortestLeaseLength} - {listing.longestLeaseLength} months
                      </div>
                      <div>
                        <span className="font-medium">Security Deposit:</span> {listing.depositSize ? `$${listing.depositSize.toLocaleString()}` : 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Rent Due at Booking:</span> {listing.rentDueAtBooking ? `$${listing.rentDueAtBooking.toLocaleString()}` : 'Not specified'}
                      </div>
                      {listing.petsAllowed && (
                        <>
                          <div>
                            <span className="font-medium">Pet Rent:</span> {listing.petRent ? `$${listing.petRent.toLocaleString()}` : 'Not specified'}
                          </div>
                          <div>
                            <span className="font-medium">Pet Deposit:</span> {listing.petDeposit ? `$${listing.petDeposit.toLocaleString()}` : 'Not specified'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Description</h2>
                <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere text-gray-700">
                  {listing.description}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(listing)
                    .filter(([key, value]) => 
                      typeof value === 'boolean' && 
                      value === true && 
                      !['isApproved', 'isTestListing', 'furnished', 'petsAllowed', 'markedActiveByUser', 'requireBackgroundCheck'].includes(key)
                    )
                    .map(([key]) => (
                      <Badge key={key} variant="secondary" className="justify-center">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())}
                      </Badge>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Address Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Full Address:</span>
                      <div className="mt-1">
                        {listing.streetAddress1}
                        {listing.streetAddress2 && (
                          <><br />{listing.streetAddress2}</>
                        )}
                        <br />{listing.city}, {listing.state} {listing.postalCode}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Location String:</span> {listing.locationString || 'Not specified'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Coordinates:</span>
                      <div className="mt-1">
                        Latitude: {listing.latitude}<br />
                        Longitude: {listing.longitude}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Monthly Pricing</h2>
                {listing.monthlyPricing && listing.monthlyPricing.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-3 text-left font-medium">Lease Length</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-medium">Monthly Rent</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-medium">Utilities</th>
                        </tr>
                      </thead>
                      <tbody>
                        {listing.monthlyPricing.map((pricing) => (
                          <tr key={pricing.months} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3">
                              {pricing.months} month{pricing.months > 1 ? 's' : ''}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 font-medium">
                              ${pricing.price.toLocaleString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              {pricing.utilitiesIncluded ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                  Included
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600">
                                  Not included
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">No pricing information available</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="images">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Property Images</h2>
                {listing.listingImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {listing.listingImages.map((image, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                        <Image
                          src={image.url}
                          alt={`Property image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {image.rank && (
                          <Badge 
                            className="absolute top-2 left-2 bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {image.rank}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No images available</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Decision History */}
          {listing.lastApprovalDecision && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Latest Decision</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Status:</span> {getApprovalBadge(listing.approvalStatus)}</p>
                <p><span className="font-medium">Decision Date:</span> {formatDate(listing.lastApprovalDecision)}</p>
                {listing.lastDecisionComment && (
                  <div>
                    <p className="font-medium">Comments:</p>
                    <p className="mt-1 text-gray-700">{listing.lastDecisionComment}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}