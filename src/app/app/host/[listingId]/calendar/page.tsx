"use client";

import React, { useState } from "react";
import { useListingDashboard } from '../listing-dashboard-context';
import StandaloneCalendar from '@/components/ui/standalone-calendar';
import UnavailabilityForm from '@/components/ui/unavailability-form';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';

export default function CalendarPage() {
  const { data, updateListing, addUnavailability, updateUnavailability, deleteUnavailability } = useListingDashboard();
  const [editingUnavailability, setEditingUnavailability] = useState<any>(null);

  const handleUnavailabilitySuccess = (unavailability: any) => {
    if (editingUnavailability) {
      // Update existing unavailability
      updateUnavailability(unavailability);
      setEditingUnavailability(null);
    } else {
      // Add new unavailability
      addUnavailability(unavailability);
    }
  };

  const handleUnavailabilityDelete = (unavailabilityId: string) => {
    deleteUnavailability(unavailabilityId);
    setEditingUnavailability(null);
  };

  const handleUnavailabilityClick = (unavailability: any) => {
    setEditingUnavailability(unavailability);
  };

  const handleClearEdit = () => {
    setEditingUnavailability(null);
  };

  // Convert booking data to the format expected by the calendar
  const calendarBookings = data.bookings?.map(booking => ({
    id: booking.id,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    guestName: `Guest ${booking.id.slice(0, 8)}` // Placeholder - you might want to get actual guest info
  })) || [];

  // Convert unavailability data to the format expected by the calendar
  const calendarUnavailabilities = data.listing.unavailablePeriods?.map(period => ({
    id: period.id,
    startDate: period.startDate,
    endDate: period.endDate,
    reason: period.reason || undefined
  })) || [];

  return (
    <div className={`${HOST_PAGE_STYLE} mt-8`}>
      <HostPageTitle 
        title="Calendar" 
        subtitle={`Calendar for ${data.listing.streetAddress1}`} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form on the left */}
        <div className="space-y-6">
          <UnavailabilityForm
            listingId={data.listing.id}
            onSuccess={handleUnavailabilitySuccess}
            onDelete={handleUnavailabilityDelete}
            onClearEdit={handleClearEdit}
            editingUnavailability={editingUnavailability}
          />
        </div>

        {/* Calendar on the right */}
        <div className="space-y-6">
          <StandaloneCalendar
            bookings={calendarBookings}
            unavailabilities={calendarUnavailabilities}
            onUnavailabilityClick={handleUnavailabilityClick}
            className="shadow-md"
          />
        </div>
      </div>
    </div>
  );
}