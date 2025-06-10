"use client";

import React, { createContext, useContext } from 'react';
import { ListingAndImages, RequestWithUser } from '@/types';

interface ListingDashboardData {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  bookings: any[];
}

interface ListingDashboardContextValue {
  data: ListingDashboardData;
}

const ListingDashboardContext = createContext<ListingDashboardContextValue | null>(null);

interface ListingDashboardProviderProps {
  children: React.ReactNode;
  data: ListingDashboardData;
}

export function ListingDashboardProvider({ children, data }: ListingDashboardProviderProps) {
  return (
    <ListingDashboardContext.Provider value={{ data }}>
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