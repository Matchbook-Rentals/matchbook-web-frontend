'use client'
import React, { createContext, useContext, useState, useEffect } from "react";
import { ListingAndImages } from "@/types";
import { HousingRequest, Trip, Application } from "@prisma/client";
import { useParams } from 'next/navigation';

interface HostPropertiesContextProps {
  listings: ListingAndImages[];
  getListingHousingRequests: Function;
  currListing: ListingAndImages | null;
  currHousingRequest: HousingRequest | null;
  setCurrHousingRequest: React.Dispatch<React.SetStateAction<HousingRequest | null>>;
  currApplication: Application | null;
  setCurrApplication: React.Dispatch<React.SetStateAction<Application | null>>;
  trip: Trip | null;
  setTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
}

interface HostPropertiesProviderProps {
  listings: ListingAndImages[];
  getListingHousingRequests: Function;
  children: React.ReactNode;
}

const HostPropertiesContext = createContext<HostPropertiesContextProps | undefined>(undefined);

export const HostPropertiesProvider: React.FC<HostPropertiesProviderProps> = ({ listings, getListingHousingRequests, children }) => {
  const [currListing, setCurrListing] = useState<ListingAndImages | null>(null);
  const params = useParams();
  const [currHousingRequest, setCurrHousingRequest] = useState<HousingRequest | null>(null);
  const [currApplication, setCurrApplication] = useState<Application | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const listingId = params.listingId as string | undefined;
    if (listingId) {
      const foundListing = listings.find(listing => listing.id === listingId);
      setCurrListing(foundListing || null);
    } else {
      setCurrListing(null);
    }
  }, [params.listingId, listings]);

  return (
    <HostPropertiesContext.Provider value={{
      listings,
      getListingHousingRequests,
      currListing,
      currHousingRequest,
      setCurrHousingRequest,
      currApplication,
      setCurrApplication,
      trip,
      setTrip
    }}>
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