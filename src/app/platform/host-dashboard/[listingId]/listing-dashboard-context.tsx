"use client";

import React, { createContext, useContext, useState } from 'react';
import { ListingAndImages, RequestWithUser } from '@/types';
import { ListingUnavailability } from '@prisma/client';

interface ListingDashboardData {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  bookings: any[];
}

interface ListingDashboardContextValue {
  data: ListingDashboardData;
  updateListing: (updatedListing: ListingAndImages) => void;
  addUnavailability: (unavailability: ListingUnavailability) => void;
  updateUnavailability: (unavailability: ListingUnavailability) => void;
  deleteUnavailability: (unavailabilityId: string) => void;
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

  const addUnavailability = (unavailability: ListingUnavailability) => {
    setData(prev => ({
      ...prev,
      listing: {
        ...prev.listing,
        unavailablePeriods: [
          ...(prev.listing.unavailablePeriods || []),
          unavailability
        ]
      }
    }));
  };

  const updateUnavailability = (updatedUnavailability: ListingUnavailability) => {
    setData(prev => ({
      ...prev,
      listing: {
        ...prev.listing,
        unavailablePeriods: (prev.listing.unavailablePeriods || []).map(period =>
          period.id === updatedUnavailability.id ? updatedUnavailability : period
        )
      }
    }));
  };

  const deleteUnavailability = (unavailabilityId: string) => {
    setData(prev => ({
      ...prev,
      listing: {
        ...prev.listing,
        unavailablePeriods: (prev.listing.unavailablePeriods || []).filter(
          period => period.id !== unavailabilityId
        )
      }
    }));
  };

  return (
    <ListingDashboardContext.Provider value={{ 
      data, 
      updateListing, 
      addUnavailability, 
      updateUnavailability, 
      deleteUnavailability 
    }}>
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