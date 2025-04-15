'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

interface ListingData {
  id: string
  title: string
  createdAt: Date
  locationString: string | null
  userId: string
  user: {
    fullName: string | null
    email: string | null
  }
  listingImages: {
    url: string
  }[]
}

export default function ListingApproval({
  listings
}: {
  listings: ListingData[]
}) {
  const router = useRouter()

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Listings ({listings.length})</h1>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-8">
              No listings pending approval at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative w-full h-48">
                {listing.listingImages.length > 0 ? (
                  <Image
                    src={listing.listingImages[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image</p>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {listing.locationString || 'Unknown location'}
                </p>
                <div className="mt-2 mb-3">
                  <p className="text-sm">
                    <span className="font-medium">Host:</span>{' '}
                    {listing.user.fullName || listing.user.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/admin/listing-approval/${listing.id}`)}
                >
                  Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}