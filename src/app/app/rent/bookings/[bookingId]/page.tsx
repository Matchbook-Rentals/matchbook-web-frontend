import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import BookingDetailClient from "./booking-detail-client";

interface BookingDetailPageProps {
  params: {
    bookingId: string;
  };
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function formatAddress(listing: any): string {
  const parts = [
    listing.streetAddress1,
    listing.city,
    listing.state,
    listing.postalCode
  ].filter(Boolean);
  return parts.join(', ');
}

function getLargestRentPayment(rentPayments: RentPayment[]): number {
  if (rentPayments.length === 0) return 0;
  return Math.max(...rentPayments.map(payment => payment.amount));
}

type RentPayment = {
  id: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
};

function getPaymentStatus(rentPayment: RentPayment): string {
  if (rentPayment.isPaid) return "Paid";
  
  const now = new Date();
  const dueDate = new Date(rentPayment.dueDate);
  
  if (dueDate < now) return "Overdue";
  if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "Due";
  return "Pending";
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch booking with all necessary relationships
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      rentPayments: {
        orderBy: { dueDate: 'asc' }
      },
      listing: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              imageUrl: true
            }
          }
        }
      },
      trip: {
        select: {
          numAdults: true,
          numChildren: true,
          numPets: true
        }
      },
      match: {
        select: {
          id: true,
          leaseDocumentId: true
        }
      }
    }
  });

  // Verify renter owns the booking
  if (!booking || booking.userId !== userId) {
    redirect("/app/rent/bookings");
  }

  // Format host data
  const host = booking.listing.user;
  const hostName = host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email || 'Unknown Host';
  
  // Get the largest rent payment amount (convert from cents to dollars)
  const largestPaymentAmount = getLargestRentPayment(booking.rentPayments) / 100;
  
  const bookingData = {
    name: hostName,
    status: booking.status === 'active' ? 'Active' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
    dates: formatDateRange(booking.startDate, booking.endDate),
    address: formatAddress(booking.listing),
    description: booking.listing.title,
    price: largestPaymentAmount > 0 ? `${formatPrice(largestPaymentAmount)} / Month` : 'Price TBD',
    occupants: [
      { type: "Adult", count: booking.trip?.numAdults || 1, icon: "/host-dashboard/svg/adult.svg" },
      { type: "Children", count: booking.trip?.numChildren || 0, icon: "/host-dashboard/svg/kid.svg" },
      { type: "pet", count: booking.trip?.numPets || 0, icon: "/host-dashboard/svg/pet.svg" },
    ],
    profileImage: host.imageUrl || "/image-35.png",
    hostUserId: host.id,
    roomCount: booking.listing.roomCount,
    bathroomCount: booking.listing.bathroomCount,
    petsAllowed: booking.listing.petsAllowed,
    leaseDocumentId: booking.match?.leaseDocumentId || null,
    matchId: booking.match?.id || booking.matchId
  };

  // Format payment data for the table
  const now = new Date();
  const upcomingPayments = booking.rentPayments
    .filter((payment: RentPayment) => new Date(payment.dueDate) >= now)
    .map((payment: RentPayment) => ({
      amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      type: "Monthly Rent",
      method: "ACH Transfer",
      bank: "Bank Account",
      dueDate: formatDate(new Date(payment.dueDate)),
      status: getPaymentStatus(payment),
      paymentId: payment.id
    }));

  const pastPayments = booking.rentPayments
    .filter((payment: RentPayment) => new Date(payment.dueDate) < now)
    .reverse()
    .map((payment: RentPayment) => ({
      amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      type: "Monthly Rent",
      method: "ACH Transfer",
      bank: "Bank Account",
      dueDate: formatDate(new Date(payment.dueDate)),
      status: getPaymentStatus(payment),
      paymentId: payment.id
    }));

  const paymentsData = {
    upcoming: upcomingPayments,
    past: pastPayments
  };

  return (
    <BookingDetailClient
      bookingData={bookingData}
      paymentsData={paymentsData}
      hostName={hostName}
      hostAvatar={host.imageUrl || "/image-35.png"}
      listingId={booking.listingId}
      bookingId={params.bookingId}
    />
  );
}