import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import { ListingAndImages } from "@/types"
import RatingStar from '@/components/ui/rating-star'


interface SearchListingCardProps {
  listing: ListingAndImages
}

export function SearchListingCard({ listing }: SearchListingCardProps) {
  return (
    <Card className="flex flex-col w-full max-w-sm">
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
