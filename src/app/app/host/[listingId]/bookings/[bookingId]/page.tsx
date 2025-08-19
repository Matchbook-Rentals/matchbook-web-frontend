"use client";

import React from "react";
import { HostBookingDetailsCard } from "../../../components/host-booking-details-card";
import { BookingPaymentsTable } from "../../../components/booking-payments-table";
import { UserIcon, BabyIcon, PawPrintIcon } from "lucide-react";

// Hardcoded booking data
const bookingData = {
  name: "Hassan Jehangir",
  status: "Active",
  dates: "5/31/2025 - 6/30/2025",
  address: "2270 CheminBicolas-Austin Austin, TX",
  description: "for Beville Beauty 1 bed 1 bath pet friendly",
  price: "$2,800 / Month",
  occupants: [
    { type: "Adult", count: 1, icon: "/host-dashboard/svg/adult.svg" },
    { type: "Children", count: 2, icon: "/host-dashboard/svg/kid.svg" },
    { type: "pet", count: 0, icon: "/host-dashboard/svg/pet.svg" },
  ],
  profileImage: "/image-35.png",
  // Hardcoded IDs for testing - in real implementation these would come from the booking data
  guestUserId: "user_123", // This would be the actual renter's user ID
};

// Hardcoded payment data for this booking
const paymentsData = {
  upcoming: [
    {
      tenant: "Hassan Jehangir",
      amount: "2,800",
      type: "Monthly Rent",
      method: "ACH Transfer",
      bank: "Chase Bank",
      dueDate: "Jan 1, 2025",
      status: "Due",
      avatarUrl: "/image-35.png"
    },
    {
      tenant: "Hassan Jehangir",
      amount: "2,800",
      type: "Monthly Rent",
      method: "ACH Transfer", 
      bank: "Chase Bank",
      dueDate: "Feb 1, 2025",
      status: "Pending",
      avatarUrl: "/image-35.png"
    }
  ],
  past: [
    {
      tenant: "Hassan Jehangir",
      amount: "2,800",
      type: "Monthly Rent",
      method: "ACH Transfer",
      bank: "Chase Bank", 
      dueDate: "Dec 1, 2024",
      status: "Paid",
      avatarUrl: "/image-35.png"
    },
    {
      tenant: "Hassan Jehangir",
      amount: "2,800",
      type: "Monthly Rent",
      method: "ACH Transfer",
      bank: "Chase Bank",
      dueDate: "Nov 1, 2024", 
      status: "Paid",
      avatarUrl: "/image-35.png"
    },
    {
      tenant: "Hassan Jehangir",
      amount: "1,000",
      type: "Security Deposit",
      method: "Wire Transfer",
      bank: "Chase Bank",
      dueDate: "Oct 15, 2024",
      status: "Paid",
      avatarUrl: "/image-35.png"
    }
  ]
};

interface BookingDetailPageProps {
  params: {
    listingId: string;
    bookingId: string;
  };
}

export const Body = ({ listingId, bookingId }: { listingId: string; bookingId: string }): JSX.Element => {
  const handleModifyDates = () => {
    console.log('Modify dates for booking:', bookingId);
    // TODO: Implement modify dates functionality
  };

  const handleViewLease = () => {
    console.log('View lease for booking:', bookingId);
    // TODO: Implement view lease functionality
  };

  const handleMessageRenter = () => {
    console.log('Message renter for booking:', bookingId);
    // TODO: Implement message renter functionality
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
          onPrimaryAction={handleModifyDates}
          onSecondaryAction={handleViewLease}
          onTertiaryAction={handleMessageRenter}
          onManageListing={handleManageListing}
          listingId={listingId}
          guestUserId={bookingData.guestUserId}
          className="w-full"
        />
        
        <BookingPaymentsTable
          paymentsData={paymentsData}
          renterName={bookingData.name}
          renterAvatar={bookingData.profileImage}
        />
      </div>
    </div>
  );
};

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  return <Body listingId={params.listingId} bookingId={params.bookingId} />;
}
