import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { ListingAndImages } from "@/types"
import RatingStar from '@/components/ui/rating-star'

// Add the Status enum
enum Status {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  None = 'none'
}

interface SearchListingCardProps {
  listing: ListingAndImages
  status: Status // Add the status prop
}

export function SearchListingCard({ listing, status }: SearchListingCardProps) {
  // Function to get the background color based on status
  const getBackgroundColor = (status: Status) => {
    switch (status) {
      case Status.Favorite:
        return 'bg-primaryBrand' // Placeholder for favorite color
      case Status.Dislike:
        return 'bg-pinkBrand' // Placeholder for dislike color
      case Status.Applied:
        return 'bg-blueBrand' // Placeholder for applied color
      case Status.None:
      default:
        return ''
    }
  }

  return (
    <Card className={`flex flex-col w-full max-w-sm ${getBackgroundColor(status)}`}>
      <div className="relative w-full h-48">
        <Image
          src={listing.listingImages[0].url}
          alt={listing.title}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
        <div className="flex items-center mb-2">
          <RatingStar rating={listing?.rating || 3.5} />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{listing.roomCount} rooms</span>
          <span>{listing.bathroomCount} bathrooms</span>
        </div>
      </CardContent>
    </Card>
  )
}