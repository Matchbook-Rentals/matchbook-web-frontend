"use client";
import React from "react";
import PropertyCard from "./property-card";
import { Listing, ListingImage } from "@prisma/client";

interface PropertyListProps {
  properties: Listing & { listingImages: ListingImage[] }[];
  filter: string | null;
}

const PropertyList: React.FC<PropertyListProps> = ({ properties, filter }) => {
  if (!properties || properties.length === 0) {
    return (
      <h3 className="text-2xl text-center mt-10 text-gray-500">
        {filter ? `No properties with a status of ${filter}` : 'No properties found for this account'}
      </h3>
    );
  }

  return (
    <div className="flex justify-center mx-auto px-6 py-8 border">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-2 lg:gap-5 border">
        {properties.map((property, index) => (
          <PropertyCard
            key={index}
            property={property}
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
