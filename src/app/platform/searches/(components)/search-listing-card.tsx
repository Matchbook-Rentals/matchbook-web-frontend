import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { MoreHorizontal, Star, ChevronLeft, ChevronRight } from "lucide-react"
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
import { ArrowLeft, ArrowRight, QuestionMarkIcon } from '@/components/icons'
import { ListingStatus } from '@/constants/enums'

const TITLE_MAX_LENGTH = 30

interface SearchListingCardProps {
  listing: ListingAndImages
  status: ListingStatus
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
  const { lookup } = state;
  const { favIds, dislikedIds, maybeIds } = lookup;
  const { optimisticLike, optimisticDislike, optimisticRemoveLike, optimisticRemoveDislike, optimisticRemoveMaybe, optimisticMaybe } = actions;

  const getStatusStyles = (status: ListingStatus) => {
    if (favIds.has(listing.id)) {
      return 'bg-primaryBrand'
    } else if (maybeIds.has(listing.id)) {
      return 'bg-yellowBrand hover:bg-yellowBrand/80'
    } else if (dislikedIds.has(listing.id)) {
      return 'bg-pinkBrand'
    }

    switch (status) {
      case ListingStatus.Applied:
        return 'bg-primaryBrand'
      case ListingStatus.None:
      default:
        return 'bg-transparent hover:bg-white/60'
    }
  }

  const getStatusIcon = (status: ListingStatus) => {
    if (favIds.has(listing.id)) {
      return <BrandHeart className="w-5 h-5" />
    } else if (maybeIds.has(listing.id)) {
      return <QuestionMarkIcon className="w-5 h-5" />
    } else if (dislikedIds.has(listing.id)) {
      return <RejectIcon className="w-5 h-5 text-white" />
    }

    switch (status) {
      case ListingStatus.Applied:
        return <BrandHeart className="w-4 h-4" />
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
          <div className={`transition-opacity duration-300 ${(isHovered && !isMenuOpen) ? 'opacity-100' : 'opacity-0'}`}>
            <CarouselPrevious Icon={ArrowLeft} className="left-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pl-[4px] scale-125" />
            <CarouselNext Icon={ArrowRight} className="right-2 text-white border-none hover:text-white bg-black/40 hover:bg-black/20 pr-[4px] scale-125" />
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
            <div
              className={`rounded-full shadow-md overflow-hidden transition-all duration-300 ease-in-out bg-white/60 ${isMenuOpen ? 'w-[48px] h-[207px]' : 'w-[48px] h-[48px]'}`}
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <div
                className={`w-[48px] h-[48px] cursor-pointer flex items-center rounded-full justify-center hover:opacity-80 mx-auto ${getStatusStyles(status)}`}
              >
                {getStatusIcon(status)}
              </div>
              <div className={`flex flex-col space-y-2 items-center pt-2 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}>
                <button
                  onClick={() => {
                    if (favIds.has(listing.id)) {
                      optimisticRemoveLike(listing.id);
                    } else {
                      optimisticLike(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-[34px] h-[34px] rounded-full bg-primaryBrand hover:bg-primaryBrand/80 flex items-center justify-center relative cursor-pointer"
                >
                  <BrandHeart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (maybeIds.has(listing.id)) {
                      optimisticRemoveMaybe(listing.id)
                    } else {
                      optimisticMaybe(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-[34px] h-[34px] rounded-full bg-yellowBrand hover:bg-yellowBrand/80 flex items-center justify-center relative cursor-pointer"
                >
                  <QuestionMarkIcon className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => {
                    if (status === ListingStatus.Dislike) {
                      optimisticRemoveDislike(listing.id);
                    } else {
                      optimisticDislike(listing.id);
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-[34px] h-[34px] rounded-full bg-pinkBrand hover:bg-pinkBrand/80 flex items-center justify-center relative cursor-pointer"
                >
                  <RejectIcon className="w-5 h-5 text-pinkBrand" />
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
