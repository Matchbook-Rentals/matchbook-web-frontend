
'use client'
import React, { createContext, useContext } from "react";
import { ListingAndImages } from "@/types";


interface HostPropertiesContextProps {
  listings: ListingAndImages[];
  getListingHousingRequests: Function;
}

interface HostPropertiesProviderProps {
  listings: ListingAndImages[];
  getListingHousingRequests: Function;
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
