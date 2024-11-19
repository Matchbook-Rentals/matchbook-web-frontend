import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { ListingAndImages } from "@/types"

enum Status {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  None = 'none'
}

const TITLE_MAX_LENGTH = 30

interface SearchListingCardProps {
  listing: ListingAndImages
  status: Status
}

export default function SearchListingCard({ listing, status }: SearchListingCardProps) {
  const getStatusStyles = (status: Status) => {
    switch (status) {
      case Status.Favorite:
        return ''
      case Status.Dislike:
        return ''
      case Status.Applied:
        return ''
      case Status.None:
      default:
        return ''
    }
  }

  return (
    <Card className={`w-full overflow-hidden border-0  shadow-0 shadow-none ${getStatusStyles(status)}`}>

      <div className="relative rounded-lg aspect-[297/266]">
        <Image
          src={listing.listingImages[0].url}
          alt={listing.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shadow-md hover:bg-gray-100 transition-all">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 flex flex-col min-h-[100px]  ">
        <div className="flex justify-between gap-x-2 items-start">
          <h3 className="">
            {listing.title.length > TITLE_MAX_LENGTH
              ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
              : listing.title}
          </h3>
          <div className="flex items-center">
            <MoreHorizontal className="w-5 h-5 fill-charcoalBrand text-charcoalBrand" />
            <span className="ml-1 text-base font-semibold">{listing.rating || 4.9}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="text-base">
            ${listing.price || 2350}
            <span className=""> month</span>
          </div>
          <div className="">
            {listing.roomCount || 4} bds | {listing.bathroomCount || 2} ba
          </div>
        </div>
      </div>
    </Card>
  )
}
