"use client";
import React from "react";
import { Listing, ListingImage } from "@prisma/client";
import Link from "next/link";

const IMAGE_HEIGHT = 250;
const LOCATION_STRING_MAX_LENGTH = 25;
const LOCATION_STRING_TRIM_LENGTH = 22;
const DEFAULT_IMAGE_URL = "default-image-url.jpg";

interface PropertyCardProps {
  property: Listing & { listingImages: ListingImage[] };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Link href={`/platform/host-dashboard/${property.id}`} className="max-w-sm flex flex-col justify-between rounded overflow-hidden shadow-lg bg-white">
      <img
        className="w-full"
        style={{ height: `${IMAGE_HEIGHT}px` }}
        src={property.listingImages.length > 0 ? property.listingImages[0].url : DEFAULT_IMAGE_URL}
        alt={`Image of ${property.title}`}
      />
      <div id="property-card-content" className="px-4 py-4 flex flex-col justify-evenly ">
        <div className="font-bold text-xl mb-2">{property.title}</div>
        <div className="flex flex-row items-end justify-between ">
          <p className="text-gray-700 text-base font-semibold">
            {property.locationString?.length && property.locationString.length > LOCATION_STRING_MAX_LENGTH
              ? property.locationString.slice(0, LOCATION_STRING_TRIM_LENGTH) + '...'
              : property.locationString}
          </p>
          <span onClick={() => console.log(property)} className="bg-primaryBrand px-2 py-1 text-sm font-semibold h-fit text-green-800 whitespace-nowrap">
            {property?.status?.toUpperCase()}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
