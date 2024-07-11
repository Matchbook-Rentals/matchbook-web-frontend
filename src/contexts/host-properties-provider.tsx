
'use client'
import React, { createContext, useContext } from "react";
import { type Listing, ListingImage, Bedroom, HousingRequest } from "@prisma/client";

interface ListingsWithImagesAndBedrooms extends Listing {
  listingImages: ListingImage[];
  bedrooms: Bedroom[];
}

interface HostPropertiesContextProps {
  listings: ListingsWithImagesAndBedrooms[];
  getListingHousingRequests: HousingRequest[];
}

interface HostPropertiesProviderProps {
  listings: ListingsWithImagesAndBedrooms[];
  getListingHousingRequests: HousingRequest[];
  children: React.ReactNode;
}

const HostPropertiesContext = createContext<HostPropertiesContextProps | undefined>(undefined);

export const HostPropertiesProvider: React.FC<HostPropertiesProviderProps> = ({ listings, getListingHousingRequests, children }) => {
  return (
    <HostPropertiesContext.Provider value={{ listings, getListingHousingRequests }}>
      {children}
    </HostPropertiesContext.Provider>
  );
};

export const useHostProperties = () => {
  const context = useContext(HostPropertiesContext);
  if (!context) {
    throw new Error("useHostProperties must be used within a HostPropertiesProvider");
  }
  return context;
};
