"use client";

import React, { useState } from "react";
import { updateUnavailability, deleteUnavailability } from "@/app/actions/listings";
import { ScheduleViewerDays } from "@/components/ui/custom-calendar/date-range-selector/schedule-viewer-days";
import { HostPageTitle } from "../(components)/host-page-title";
import { getListingDisplayName } from "@/utils/listing-helpers";
import { ListingAndImages } from '@/types';
import { ListingUnavailability } from '@prisma/client';
import { BlockDatesForm } from './block-dates-form';

interface CalendarClientProps {
  listing: ListingAndImages;
  bookings: any[];
}

export function CalendarClient({ listing: initialListing, bookings }: CalendarClientProps) {
  const [listing, setListing] = useState(initialListing);

  const handleUnavailabilityAdded = (unavailability: ListingUnavailability) => {
    setListing(prev => ({
      ...prev,
      unavailablePeriods: [
        ...(prev.unavailablePeriods || []),
        unavailability
      ]
    }));
  };

  const handleEditUnavailability = async (unavailability: any) => {
    try {
      const updatedUnavailability = await updateUnavailability(
        unavailability.id,
        unavailability.startDate,
        unavailability.endDate,
        unavailability.reason
      );
      
      // Update local state
      setListing(prev => ({
        ...prev,
        unavailablePeriods: (prev.unavailablePeriods || []).map(period =>
          period.id === updatedUnavailability.id ? updatedUnavailability : period
        )
      }));
    } catch (error) {
      console.error("Error updating unavailability:", error);
      alert("Failed to update unavailability period");
    }
  };

  const handleDeleteUnavailability = async (unavailabilityId: string) => {
    if (!confirm("Are you sure you want to delete this unavailability period?")) {
      return;
    }
    
    try {
      await deleteUnavailability(unavailabilityId);
      
      // Update local state
      setListing(prev => ({
        ...prev,
        unavailablePeriods: (prev.unavailablePeriods || []).filter(
          period => period.id !== unavailabilityId
        )
      }));
    } catch (error) {
      console.error("Error deleting unavailability:", error);
      alert("Failed to delete unavailability period");
    }
  };
  
  return (
    <div className="flex flex-col w-full items-start">
      <HostPageTitle 
        title="Calendar Management" 
        subtitle={`Manage availability for ${getListingDisplayName(listing)}`} 
      />
      <section className="flex flex-col items-start px-0 py-0 self-stretch w-full bg-[#f9f9f9]">

        {/* Calendar Schedule Viewer */}
        <div className="md:pb-12 w-full">
          <ScheduleViewerDays
            bookings={bookings}
            unavailablePeriods={listing.unavailablePeriods || []}
            onDeleteUnavailability={handleDeleteUnavailability}
            onEditUnavailability={handleEditUnavailability}
          />
        </div>

        <div className="flex flex-col mb-4 items-start gap-[18px] self-stretch w-full">
          <div className="flex flex-col items-start gap-6 self-stretch w-full">
            <BlockDatesForm 
              listingId={listing.id}
              onUnavailabilityAdded={handleUnavailabilityAdded}
            />
          </div>
        </div>
      </section>
    </div>
  );
}