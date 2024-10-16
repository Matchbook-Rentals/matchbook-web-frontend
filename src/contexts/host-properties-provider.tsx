"use client";
import React, { createContext, useContext } from "react";
import { type Listing, ListingImage, Bedroom } from "@prisma/client";

interface ListingsWithImagesAndBedrooms extends Listing {
  listingImages: ListingImage[];
  bedrooms: Bedroom[];
}

interface HostPropertiesContextProps {
  listings: ListingsWithImagesAndBedrooms[];
}

const HostPropertiesContext = createContext<
  HostPropertiesContextProps | undefined
>(undefined);

export const HostPropertiesProvider: React.FC<{
  listings: Listing[];
  children: React.ReactNode;
}> = ({ listings, children }) => {
  return (
    <HostPropertiesContext.Provider value={{ listings }}>
      {children}
    </HostPropertiesContext.Provider>
  );
};

export const useHostProperties = () => {
  const context = useContext(HostPropertiesContext);
  if (!context) {
    throw new Error(
      "useHostProperties must be used within a HostPropertiesProvider",
    );
  }
  return context;
};
