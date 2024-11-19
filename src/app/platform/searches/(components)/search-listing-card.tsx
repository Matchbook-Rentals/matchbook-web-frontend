import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { MoreHorizontal, X, Heart, HelpCircle } from "lucide-react"
import { ListingAndImages } from "@/types"
import { useState } from 'react'

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    // Main card container with dynamic status-based styling
    <Card className={`w-full overflow-hidden border-0  shadow-0 shadow-none ${getStatusStyles(status)}`}>

      {/* Image Section with Overlay Menu */}
      <div className="relative rounded-lg aspect-[297/266]">

        {/* Main listing image */}
        <Image
          src={listing.listingImages[0].url}
          alt={listing.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />

        {/* Floating action menu in top-right corner */}
        <div className="absolute top-2 right-2 ">

          {/* Expandable menu container with animation */}
          <div className={`bg-white/60 rounded-full shadow-md overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'w-8 h-48' : 'w-8 h-8'
          }`}>

            {/* Menu toggle button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 flex items-center rounded-full justify-center hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Menu options (favorite, help, dismiss) */}
            <div className={`flex flex-col items-center  ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
              <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Details Section */}
      <div className="p-2 flex flex-col min-h-[100px]  ">

        {/* Title and Rating Row */}
        <div className="flex justify-between gap-x-2 items-start">

          {/* Truncated title */}
          <h3 className="">
            {listing.title.length > TITLE_MAX_LENGTH
              ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
              : listing.title}
          </h3>

          {/* Rating display */}
          <div className="flex items-center">
            <MoreHorizontal className="w-5 h-5 fill-charcoalBrand text-charcoalBrand" />
            <span className="ml-1 text-base font-semibold">{listing.rating || 4.9}</span>
          </div>
        </div>

        {/* Price and Property Details Row */}
        <div className="flex items-center justify-between mt-auto">

          {/* Monthly price */}
          <div className="text-base">
            ${listing.price || 2350}
            <span className=""> month</span>
          </div>

          {/* Bedroom and bathroom count */}
          <div className="">
            {listing.roomCount || 4} bds | {listing.bathroomCount || 2} ba
          </div>
        </div>
      </div>
    </Card>
  )
}
