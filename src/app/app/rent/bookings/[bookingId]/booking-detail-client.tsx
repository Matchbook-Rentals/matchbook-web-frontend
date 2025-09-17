"use client";

import React from "react";
import { RentBookingDetailsCard } from "../components/rent-booking-details-card";
import { RentPaymentsTable } from "../components/rent-payments-table";
import { useRouter } from "next/navigation";

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
    hostUserId: string;
    roomCount: number;
    bathroomCount: number;
    petsAllowed: boolean;
    leaseDocumentId: string | null;
    matchId: string;
  };
  paymentsData: {
    upcoming: Array<{
      amount: string;
      type: string;
      method: string;
      bank: string;
      dueDate: string;
      status: string;
      paymentId: string;
      hasUnviewedModification?: boolean;
      pendingModificationCount?: number;
    }>;
    past: Array<{
      amount: string;
      type: string;
      method: string;
      bank: string;
      dueDate: string;
      status: string;
      paymentId: string;
      hasUnviewedModification?: boolean;
      pendingModificationCount?: number;
    }>;
  };
  hostName: string;
  hostAvatar: string;
  listingId: string;
  bookingId: string;
  paymentMethods?: Array<{
    id: string;
    type: 'card' | 'bank';
    brand?: string;
    lastFour: string;
    expiry?: string;
    bankName?: string;
  }>;
}

export default function BookingDetailClient({
  bookingData,
  paymentsData,
  hostName,
  hostAvatar,
  listingId,
  bookingId,
  paymentMethods
}: BookingDetailClientProps) {
  const router = useRouter();

  const handleViewLease = () => {
    if (bookingData.leaseDocumentId) {
      // Open the lease document in a new tab for viewing (not downloading)
      window.open(`/api/documents/${bookingData.leaseDocumentId}/view`, '_blank');
    } else {
      // Fallback to lease signing page if no document exists yet
      router.push(`/app/rent/match/${bookingData.matchId}/lease-signing-client`);
    }
  };

  const handleMessageHost = () => {
    console.log('Message host for booking:', bookingId);
    // This will be handled by the card component using existing messaging logic
  };

  const handleMakePayment = () => {
    // Find the next unpaid payment
    const nextPayment = paymentsData.upcoming.find(payment => 
      payment.status === "Due" || payment.status === "Overdue" || payment.status === "Scheduled"
    );
    
    if (nextPayment) {
      router.push(`/app/rent/bookings/${bookingId}/payment`);
    } else {
      console.log('No payments due');
    }
  };

  const handleViewListing = () => {
    router.push(`/app/rent/listing/${listingId}`);
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-2 w-full">
        <h1 className="font-medium text-gray-800 text-2xl">
          Booking Details
        </h1>

        <p className="text-gray-600 text-sm md:text-base leading-6">
          View your booking information, payment schedule, and communicate with your host
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <RentBookingDetailsCard
          {...bookingData}
          primaryButtonText="View Lease"
          secondaryButtonText="Message Host"
          tertiaryButtonText="Make Payment"
          onPrimaryAction={handleViewLease}
          onSecondaryAction={handleMessageHost}
          onTertiaryAction={handleMakePayment}
          onViewListing={handleViewListing}
          listingId={listingId}
          hostUserId={bookingData.hostUserId}
          className="w-full"
        />
        
        <RentPaymentsTable
          paymentsData={paymentsData}
          hostName={hostName}
          hostAvatar={hostAvatar}
          bookingId={bookingId}
          initialPaymentMethods={paymentMethods}
        />
      </div>
    </div>
  );
}