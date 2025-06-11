"use client";

import React, { createContext, useContext, useState } from 'react';
import { ListingAndImages, RequestWithUser } from '@/types';

interface ListingDashboardData {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  bookings: any[];
}

interface ListingDashboardContextValue {
  data: ListingDashboardData;
  updateListing: (updatedListing: ListingAndImages) => void;
}

const ListingDashboardContext = createContext<ListingDashboardContextValue | null>(null);

interface ListingDashboardProviderProps {
  children: React.ReactNode;
  data: ListingDashboardData;
}

export function ListingDashboardProvider({ children, data: initialData }: ListingDashboardProviderProps) {
  const [data, setData] = useState<ListingDashboardData>(initialData);

  const updateListing = (updatedListing: ListingAndImages) => {
    setData(prev => ({
      ...prev,
      listing: updatedListing
    }));
  };

  return (
    <ListingDashboardContext.Provider value={{ data, updateListing }}>
      {children}
    </ListingDashboardContext.Provider>
  );
}

export function useListingDashboard() {
  const context = useContext(ListingDashboardContext);
  if (!context) {
    throw new Error('useListingDashboard must be used within a ListingDashboardProvider');
  }
  return context;
}