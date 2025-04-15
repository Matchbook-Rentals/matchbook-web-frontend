"use client";
import React from "react";
import { Listing, ListingImage } from "@prisma/client";
import Link from "next/link";
import { StarIcon } from "lucide-react";

const IMAGE_HEIGHT = 220;
const DEFAULT_IMAGE_URL = "default-image-url.jpg";

interface PropertyCardProps {
  property: Listing & { listingImages: ListingImage[] };
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  // Demo: fallback rating and details for design
  const rating = property.rating ?? 4.9;
  const beds = property.beds ?? 4;
  const baths = property.baths ?? 2;
  const sqft = property.sqft ?? 2300;
  const price = property.price ?? 2350;

  return (
    <Link
      href={`/platform/host-dashboard/${property.id}`}
      className="w-[362px] rounded-2xl overflow-hidden bg-background transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-charcoalBrand group"
      style={{ textDecoration: 'none' }}
    >
      <div className="relative">
        <img
          className="w-full h-[220px] object-cover"
          src={property.listingImages.length > 0 ? property.listingImages[0].url : DEFAULT_IMAGE_URL}
          alt={`Image of ${property.title}`}
        />
        {/* Rating badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 rounded-full px-3 py-1 shadow-md">
          <StarIcon className="w-5 h-5 text-[#5a6754] fill-[#5a6754] mr-1" />
          <span className="text-lg font-semibold text-[#5a6754]">{rating}</span>
        </div>
      </div>
      <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-normal text-[#2d2f2e] [font-family:'Lora',Helvetica] group-hover:text-[#5a6754] transition-colors">
          {property.title}
        </h2>
        <div className="flex flex-row justify-between items-center text-lg text-[#2d2f2e99] [font-family:'Montserrat',Helvetica] font-medium">
          <span>{beds} bds</span>
          <span className="mx-1">|</span>
          <span>{baths} ba</span>
          <span className="mx-1">|</span>
          <span>{sqft} sft</span>
          <span className="mx-1">|</span>
          <span className="text-[#5a6754] font-semibold">${price} / mo</span>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
