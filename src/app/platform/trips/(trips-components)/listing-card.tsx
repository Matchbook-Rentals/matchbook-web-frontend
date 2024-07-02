"use client";
import React from "react";
import { Listing, ListingImage } from "@prisma/client";
import Link from "next/link";

const IMAGE_HEIGHT = 250;
const LOCATION_STRING_MAX_LENGTH = 25;
const LOCATION_STRING_TRIM_LENGTH = 22;
const DEFAULT_IMAGE_URL = "default-image-url.jpg";

interface ListingCardProps {
  listing: Listing & { listingImages: ListingImage[] };
}

const ListingCard = ({ listing }: ListingCardProps) => {
  if (!listing) {
    return null;
  }

  if (!listing.title || !listing.locationString) {
    return (
      <div className="max-w-sm flex flex-col justify-between rounded overflow-hidden shadow-lg bg-white">
        <p className="p-4">Incomplete listing data</p>
      </div>
    );
  }

  return (
    <Link href="#" className="max-w-sm flex flex-col justify-between rounded overflow-hidden shadow-lg bg-white">
      <img
        className="w-full"
        style={{ height: `${IMAGE_HEIGHT}px` }}
        src={listing.listingImages.length > 0 ? listing.listingImages[0].url : DEFAULT_IMAGE_URL}
        alt={`Image of ${listing.title}`}
      />
      <div id="listing-card-content" className="px-4 py-4 flex flex-col justify-evenly ">
        <div className="font-bold text-xl mb-2">{listing.title}</div>
        <div className="flex flex-row items-end justify-between ">
          <p className="text-gray-700 text-base font-semibold">
            {listing.locationString.length > LOCATION_STRING_MAX_LENGTH
              ? listing.locationString.slice(0, LOCATION_STRING_TRIM_LENGTH) + '...'
              : listing.locationString}
          </p>
          <span onClick={() => console.log(listing)} className="bg-primaryBrand px-2 py-1 text-sm font-semibold h-fit text-green-800 whitespace-nowrap">
            {listing.status ? listing.status.toUpperCase() : 'N/A'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
