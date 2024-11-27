import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Star, X, Heart, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { ListingAndImages } from "@/types"
import { useState } from 'react'
import { useTripContext } from '@/contexts/trip-context-provider'
import { BrandHeart, RejectIcon } from '@/components/svgs/svg-components'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { QuestionMarkIcon } from '@/components/icons'

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
  className?: string
  detailsClassName?: string
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

export default function SearchListingCard({ listing, status, className, detailsClassName, callToAction, contextLabel }: SearchListingCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { state, actions } = useTripContext();
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike } = actions;

  const getStatusStyles = (status: Status) => {
    switch (status) {
      case Status.Favorite:
      case Status.Applied:
        return 'bg-primaryBrand'
      case Status.Dislike:
        return 'bg-pinkBrand'
      case Status.Maybe:
        return 'bg-yellowBrand'
      case Status.None:
      default:
        return 'bg-white/60'
    }
  }

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.Favorite:
        return <BrandHeart className="w-5 h-5" />
      case Status.Applied:
        return <BrandHeart className="w-4 h-4 " />
      case Status.Dislike:
        return <RejectIcon className="w-5 h-5 text-white" />
      case Status.Maybe:
        return <QuestionMarkIcon className="w-5 h-5" />
      default:
        return <MoreHorizontal className="w-7 h-7" />
    }
  }

  return (
    <Card
      className={`w-full overflow-hidden border-0 max-w-[267px] shadow-0 shadow-none ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-lg max-h-[297px] max-w-[267px] mx-auto aspect-[297/266]">
        <Carousel className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent>
            {listing.listingImages.map((image, index) => (
              <CarouselItem key={index} className="relative">
                <div className="aspect-[297/266] relative w-full h-full">
                  <Image
                    src={image.url}
                    alt={`${listing.title} - Image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                    sizes="(max-width: 267px) 100vw, 267px"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <CarouselPrevious Icon={ChevronLeft} className="left-2 text-white border-none hover:text-white bg-transparent scale-150 hover:bg-transparent " />
            <CarouselNext Icon={ChevronRight} className="right-2 text-white border-none hover:text-white bg-transparent scale-150 hover:bg-transparent " />
          </div>
        </Carousel>

        {/* Conditional render either context banner or action menu */}
        {contextLabel ? (
          <div className="absolute top-5 mx-auto flex justify-center  w-full">
            <button
              onClick={contextLabel.action}
              className={`w-4/5 py-2 px-4 text-center rounded-xl ${contextLabel.className || 'bg-white/60 hover:bg-white/80'}`}
            >
              {contextLabel.label}
            </button>
          </div>
        ) : (
          <div className="absolute top-2 right-2">
            <div className={`rounded-full shadow-md overflow-hidden transition-all duration-300 ease-in-out bg-white/60 ${isMenuOpen ? 'w-[51px] h-[207px]' : 'w-[51px] h-[51px]'}`}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-[51px] h-[51px] flex items-center rounded-full justify-center hover:bg-gray-100 mx-auto ${getStatusStyles(status)}`}
              >
                {getStatusIcon(status)}
              </button>
              <div className={`flex flex-col space-y-2 items-center pt-2 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => {
                    if (status === Status.Favorite || status === Status.Applied) {
                      optimisticRemoveLike(listing.id);
                    } else {
                      optimisticLike(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-[34px] h-[34px] rounded-full bg-primaryBrand hover:bg-primaryBrand/80 flex items-center justify-center relative"
                >
                  <BrandHeart className="w-4 h-4" />
                  {(status === Status.Favorite || status === Status.Applied) && (
                    <X className="w-4 h-4 text-red-500 absolute inset-0 m-auto" />
                  )}
                </button>
                <button
                  className="w-[34px] h-[34px] rounded-full bg-yellowBrand hover:bg-yellowBrand/80 flex items-center justify-center relative"
                >
                  <QuestionMarkIcon className="w-4 h-4 text-white" />
                  {status === Status.Maybe && (
                    <X className="w-4 h-4 text-red-500 absolute inset-0 m-auto" />
                  )}
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
                  className="w-[34px] h-[34px] rounded-full bg-pinkBrand hover:bg-pinkBrand/80 flex items-center justify-center relative"
                >
                  <RejectIcon className="w-5 h-5 text-pinkBrand" />
                  {status === Status.Dislike && (
                    <X className="w-4 h-4 text-red-500 absolute inset-0 m-auto" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={` pt-1 flex flex-col  sm:min-h-[80px] ${detailsClassName || ''}`}>
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
        <div className=" pt-0">
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
