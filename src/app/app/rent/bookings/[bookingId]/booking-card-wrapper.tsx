"use client";

import { useRouter } from "next/navigation";
import { RentBookingDetailsCard } from "../components/rent-booking-details-card";

interface BookingCardWrapperProps {
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
    startDate: Date;
    endDate: Date;
  };
  listingId: string;
  bookingId: string;
}

export default function BookingCardWrapper({
  bookingData,
  listingId,
  bookingId
}: BookingCardWrapperProps) {
  const router = useRouter();

  const handleViewLease = () => {
    if (bookingData.leaseDocumentId) {
      window.open(`/api/documents/${bookingData.leaseDocumentId}/view`, '_blank');
    } else {
      router.push(`/app/rent/match/${bookingData.matchId}/lease-signing-client`);
    }
  };

  const handleMessageHost = () => {
    console.log('Message host for booking:', bookingId);
  };

  const handleMakePayment = () => {
    router.push(`/app/rent/bookings/${bookingId}/payment`);
  };

  const handleViewListing = () => {
    router.push(`/app/rent/listing/${listingId}`);
  };

  return (
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
      bookingId={bookingId}
      bookingStartDate={bookingData.startDate}
      bookingEndDate={bookingData.endDate}
    />
  );
}
