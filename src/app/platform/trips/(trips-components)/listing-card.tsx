"use client";
import React from "react";
import { Listing, ListingImage } from "@prisma/client";
import Link from "next/link";

const IMAGE_HEIGHT = 250;
const LOCATION_STRING_MAX_LENGTH = 25;
const TITLE_STRING_MAX_LENGTH = 35;
const LOCATION_STRING_TRIM_LENGTH = 22;
const TITLE_STRING_TRIM_LENGTH = 32;
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
    // Change to link maybe?? Needs to push to larger listing view, may be modal
    <div className="max-w-sm flex flex-col justify-between rounded overflow-hidden shadow-lg bg-white">
      <img
        className="w-full"
        style={{ height: `${IMAGE_HEIGHT}px` }}
        src={listing.listingImages.length > 0 ? listing.listingImages[0].url : DEFAULT_IMAGE_URL}
        alt={`Image of ${listing.title}`}
      />
      <div id="listing-card-content" className="px-4 py-4  flex flex-col justify-evenly ">
        <div className="font-bold text-xl mb-2">
          {listing.title.length > TITLE_STRING_MAX_LENGTH
            ? listing.title.slice(0, TITLE_STRING_TRIM_LENGTH) + '...'
            : listing.title}
        </div>
        <div className="flex flex-row items-end items-center justify-between ">
          <p className="text-gray-700 text-md font-semibold">
            {listing.locationString.length > LOCATION_STRING_MAX_LENGTH
              ? listing.locationString.slice(0, LOCATION_STRING_TRIM_LENGTH) + '...'
              : listing.locationString}
          </p>
          <span onClick={() => console.log(listing)} className="bg-blueBrand/60 cursor-pointer px-2 py-1 text-md font-semibold h-fit text-green-800 whitespace-nowrap">
            Apply now
          </span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
