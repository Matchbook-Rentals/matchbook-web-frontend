import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Star, X, Heart, HelpCircle } from "lucide-react"
import { ListingAndImages } from "@/types"
import { useState } from 'react'
import { useTripContext } from '@/contexts/trip-context-provider'

enum Status {
  Favorite = 'favorite',
  Dislike = 'dislike',
  Applied = 'applied',
  Maybe = 'maybe',
  None = 'none'
}

const TITLE_MAX_LENGTH = 30

interface SearchListingCardProps {
  listing: ListingAndImages
  status: Status
  callToAction?: {
    label: string
    action: () => void
    className?: string
  }
  contextLabel?: {
    label: string
    action: () => void
    className?: string
  }
}

export default function SearchListingCard({ listing, status, callToAction, contextLabel }: SearchListingCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { state, actions } = useTripContext();
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  const getStatusStyles = (status: Status) => {
    switch (status) {
      case Status.Favorite:
        return ''
      case Status.Dislike:
        return ''
      case Status.Applied:
        return ''
      case Status.Maybe:
        return ''
      case Status.None:
      default:
        return ''
    }
  }

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.Favorite:
        return <Heart className="w-5 h-5" />
      case Status.Applied:
        return <Heart className="w-5 h-5" />
      case Status.Dislike:
        return <X className="w-5 h-5" />
      case Status.Maybe:
        return <HelpCircle className="w-5 h-5" />
      default:
        return <MoreHorizontal className="w-5 h-5" />
    }
  }

  return (
    <Card className={`w-full overflow-hidden border-0 shadow-0 shadow-none ${getStatusStyles(status)}`}>
      <div className="relative rounded-lg aspect-[297/266]">
        <Image
          src={listing.listingImages[0].url}
          alt={listing.title}
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />

        {/* Conditional render either context banner or action menu */}
        {contextLabel ? (
          <div className="absolute top-5 mx-auto flex justify-center test w-full">
            <button
              onClick={contextLabel.action}
              className={`w-4/5 py-2 px-4 text-center ${contextLabel.className || 'bg-white/60 hover:bg-white/80'}`}
            >
              {contextLabel.label}
            </button>
          </div>
        ) : (
          <div className="absolute top-2 right-2">
            <div className={`bg-white/60 rounded-full shadow-md overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'w-8 h-36' : 'w-8 h-8'
              }`}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 flex items-center rounded-full justify-center hover:bg-gray-100"
              >
                {getStatusIcon(status)}
              </button>
              <div className={`flex flex-col items-center  ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => {
                    if (status === Status.Favorite) {
                      optimisticRemoveLike(listing.id);
                    } else {
                      optimisticLike(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (status === Status.Dislike) {
                      optimisticRemoveDislike(listing.id);
                    } else {
                      optimisticDislike(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 flex flex-col min-h-[180px] xs:min-h-[160px] sm:min-h-[100px]  ">
        <div className="flex justify-between gap-x-2 items-start">
          <h3 className="">
            {listing.title.length > TITLE_MAX_LENGTH
              ? `${listing.title.substring(0, TITLE_MAX_LENGTH)}...`
              : listing.title}
          </h3>
          <div className="flex items-center">
            <Star className="w-5 h-5 fill-charcoalBrand text-charcoalBrand" />
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

      {callToAction && (
        <div className="p-2 pt-0">
          <button
            onClick={() => callToAction.action()}
            className={`w-full py-2 px-4 rounded-lg ${callToAction.className || 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {callToAction.label}
          </button>
        </div>
      )}
    </Card>
  )
}
