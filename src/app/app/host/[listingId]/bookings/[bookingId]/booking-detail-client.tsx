"use client";

import React from "react";
import { HostBookingDetailsCard } from "../../../components/host-booking-details-card";
import { BookingPaymentsTable } from "../../../components/booking-payments-table";

interface BookingDetailClientProps {
  bookingData: {
    name: string;
    status: string;
    dates: string;
    address: string;
    description: string;
    price: string;
    occupants: Array<{
      type: string;
      count: number;
      icon: string;
    }>;
    profileImage: string;
    guestUserId: string;
    matchId: string;
    leaseDocumentId: string | null;
    startDate: Date | string;
    endDate: Date | string;
  };
  paymentsData: {
    upcoming: Array<{
      tenant: string;
      amount: string;
      type: string;
      method: string;
      bank: string;
      dueDate: string;
      status: string;
      avatarUrl: string;
    }>;
    past: Array<{
      tenant: string;
      amount: string;
      type: string;
      method: string;
      bank: string;
      dueDate: string;
      status: string;
      avatarUrl: string;
    }>;
  };
  renterName: string;
  renterAvatar: string;
  listingId: string;
  bookingId: string;
}

export default function BookingDetailClient({
  bookingData,
  paymentsData,
  renterName,
  renterAvatar,
  listingId,
  bookingId
}: BookingDetailClientProps) {
  // Convert dates from strings (serialized from server) to Date objects
  const startDate = bookingData.startDate instanceof Date
    ? bookingData.startDate
    : new Date(bookingData.startDate);
  const endDate = bookingData.endDate instanceof Date
    ? bookingData.endDate
    : new Date(bookingData.endDate);

  const handleViewLease = () => {
    if (bookingData.leaseDocumentId) {
      window.open(`/api/documents/${bookingData.leaseDocumentId}/view`, '_blank');
    } else {
      // Fallback to lease signing page if no document exists yet
      window.location.href = `/app/host/match/${bookingData.matchId}`;
    }
  };

  const handleManageListing = () => {
    console.log('Manage listing:', listingId);
    // TODO: Navigate to listing management
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="font-medium text-gray-800 text-2xl">
          Manage Booking
        </h1>

        <p className="text-gray-600 text-sm md:text-base leading-6">
          Here you can make changes to dates and payments, all changes must be
          reviewed and approved by renter before they take affect
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <HostBookingDetailsCard
          {...bookingData}
          primaryButtonText="Modify Dates"
          secondaryButtonText="View Lease"
          tertiaryButtonText="Message Renter"
          onSecondaryAction={handleViewLease}
          onManageListing={handleManageListing}
          listingId={listingId}
          guestUserId={bookingData.guestUserId}
          bookingId={bookingId}
          bookingStartDate={startDate}
          bookingEndDate={endDate}
          className="w-full"
        />
        
        <BookingPaymentsTable
          paymentsData={paymentsData}
          renterName={renterName}
          renterAvatar={renterAvatar}
          bookingId={bookingId}
          renterId={bookingData.guestUserId}
        />
      </div>
    </div>
  );
}