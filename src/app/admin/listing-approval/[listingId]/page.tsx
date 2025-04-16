import { getListingDetails } from '../../listing-approval-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ApprovalActions } from './approval-actions'

export default async function ListingApprovalDetail({
  params
}: {
  params: { listingId: string }
}) {
  const listing = await getListingDetails(params.listingId)

  if (!listing) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>{listing.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {listing.locationString || `${listing.city}, ${listing.state}`}
              </p>
            </div>
            <Badge variant={listing.approvalStatus === 'pendingReview' ? 'outline' : listing.approvalStatus === 'approved' ? 'success' : 'destructive'}>
              {listing.approvalStatus === 'pendingReview' ? 'Pending Review' : 
                listing.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Host Information</h2>
            <p><span className="font-medium">Name:</span> {listing.user.fullName}</p>
            <p><span className="font-medium">Email:</span> {listing.user.email}</p>
            <p><span className="font-medium">Submitted:</span> {formatDate(listing.createdAt)}</p>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="images">Images ({listing.listingImages.length})</TabsTrigger>
              <TabsTrigger value="bedrooms">Bedrooms ({listing.bedrooms.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Property Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Type:</span> {listing.category}</p>
                    <p><span className="font-medium">Bedrooms:</span> {listing.roomCount}</p>
                    <p><span className="font-medium">Bathrooms:</span> {listing.bathroomCount}</p>
                    <p><span className="font-medium">Square Footage:</span> {listing.squareFootage}</p>
                    <p><span className="font-medium">Furnished:</span> {listing.furnished ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Utilities Included:</span> {listing.utilitiesIncluded ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Pets Allowed:</span> {listing.petsAllowed ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Price Range:</span> ${listing.shortestLeasePrice} - ${listing.longestLeasePrice}</p>
                    <p><span className="font-medium">Lease Length:</span> {listing.shortestLeaseLength} - {listing.longestLeaseLength} months</p>
                    <p><span className="font-medium">Deposit:</span> {listing.depositSize ? `$${listing.depositSize}` : 'Not specified'}</p>
                    <p><span className="font-medium">Background Check Required:</span> {listing.requireBackgroundCheck ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {Object.entries(listing)
                    .filter(([key, value]) => 
                      typeof value === 'boolean' && 
                      value === true && 
                      !['isApproved', 'isTestListing', 'furnished', 'utilitiesIncluded', 'petsAllowed', 'requireBackgroundCheck'].includes(key)
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
            
            <TabsContent value="images">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listing.listingImages.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                      src={image.url}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="bedrooms">
              <div className="space-y-4">
                {listing.bedrooms.map((bedroom) => (
                  <Card key={bedroom.id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">Bedroom {bedroom.bedroomNumber}</h3>
                      <p><span className="font-medium">Bed Type:</span> {bedroom.bedType}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {listing.approvalStatus === 'pendingReview' && (
            <div className="mt-8">
              <ApprovalActions listingId={listing.id} listingTitle={listing.title} />
            </div>
          )}

          {listing.approvalStatus !== 'pendingReview' && (
            <div className="mt-8">
              <div className="p-4 bg-muted rounded-md mb-4">
                <h3 className="font-semibold">Decision Details</h3>
                <p><span className="font-medium">Decision Date:</span> {listing.lastApprovalDecision ? formatDate(listing.lastApprovalDecision) : 'N/A'}</p>
                {listing.lastDecisionComment && (
                  <div className="mt-2">
                    <p className="font-medium">Comment:</p>
                    <p className="mt-1">{listing.lastDecisionComment}</p>
                  </div>
                )}
              </div>
              
              <ApprovalActions listingId={listing.id} listingTitle={listing.title} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}