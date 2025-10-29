import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import { MoveInInstructionsDisplay } from "./_components/move-in-instructions-display";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface MoveInInstructionsPageProps {
  params: {
    bookingId: string;
  };
}

const formatAddress = (listing: any): string => {
  const parts = [
    listing.streetAddress1,
    listing.streetAddress2,
    listing.city,
    listing.state,
    listing.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
};

const fetchBookingWithInstructions = async (bookingId: string) => {
  return await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          streetAddress1: true,
          streetAddress2: true,
          city: true,
          state: true,
          postalCode: true,
          moveInPropertyAccess: true,
          moveInParkingInfo: true,
          moveInWifiInfo: true,
          moveInOtherNotes: true,
        },
      },
    },
  });
};

const verifyRenterOwnsBooking = (
  booking: any,
  userId: string
): boolean => {
  return booking && booking.userId === userId;
};

export default async function MoveInInstructionsPage({
  params,
}: MoveInInstructionsPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const booking = await fetchBookingWithInstructions(params.bookingId);

  if (!verifyRenterOwnsBooking(booking, userId)) {
    redirect("/app/rent/bookings");
  }

  const address = formatAddress(booking.listing);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href={`/app/rent/bookings/${params.bookingId}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Booking Details
          </Button>
        </Link>
      </div>

      <MoveInInstructionsDisplay
        address={address}
        propertyAccess={booking.listing.moveInPropertyAccess}
        parkingInfo={booking.listing.moveInParkingInfo}
        wifiInfo={booking.listing.moveInWifiInfo}
        otherNotes={booking.listing.moveInOtherNotes}
      />
    </div>
  );
}
