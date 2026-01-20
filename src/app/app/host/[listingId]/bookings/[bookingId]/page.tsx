import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import { getPaymentTypeLabel } from "@/lib/payment-display-helpers";
import BookingDetailClient from "./booking-detail-client";

interface BookingDetailPageProps {
  params: {
    listingId: string;
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

function formatBookingStatus(status: string): string {
  switch (status) {
    case 'payment_processing': return 'Payment Processing';
    case 'pending_payment': return 'Pending Payment';
    case 'payment_failed': return 'Payment Failed';
    case 'reserved': return 'Reserved';
    case 'confirmed': return 'Confirmed';
    case 'cancelled': return 'Cancelled';
    case 'active': return 'Active';
    case 'completed': return 'Completed';
    case 'pending': return 'Pending';
    case 'issue_reported': return 'Issue Reported';
    case 'move_in_issue': return 'Move-In Issue';
    default:
      // Convert snake_case to Title Case
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }
}

type RentPayment = {
  id: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  status?: string;
};

function getPaymentStatus(rentPayment: RentPayment): string {
  // Check for explicit status field first
  if (rentPayment.status === 'SUCCEEDED') return "Paid";
  if (rentPayment.status === 'FAILED') return "Failed";
  if (rentPayment.status === 'PROCESSING') return "Processing";
  if (rentPayment.status === 'CANCELLED') return "Cancelled";
  if (rentPayment.status === 'REFUNDED') return "Refunded";

  // Fallback to legacy isPaid logic
  if (rentPayment.isPaid) return "Paid";

  const now = new Date();
  const dueDate = new Date(rentPayment.dueDate);

  if (dueDate < now) return "Overdue";
  if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "Due";
  return "Scheduled";
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
        select: {
          userId: true,
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          roomCount: true,
          bathroomCount: true,
          petsAllowed: true
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          imageUrl: true
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
          leaseDocumentId: true
        }
      }
    }
  });

  // Verify host owns the listing
  if (!booking || booking.listing.userId !== userId) {
    redirect("/app/host/dashboard");
  }

  // Format booking data for the card component
  const renterName = booking.user.fullName || `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email || 'Unknown Renter';

  // Get price from next upcoming payment or most recent past payment
  // Use baseAmount for hosts (what they receive, excludes service fees)
  const now = new Date();
  const sortedPayments = [...booking.rentPayments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const nextPayment = sortedPayments.find(p => new Date(p.dueDate) >= now);
  const mostRecentPayment = [...sortedPayments].reverse().find(p => new Date(p.dueDate) < now);
  const displayPayment = nextPayment || mostRecentPayment;
  const displayAmount = displayPayment?.baseAmount ?? displayPayment?.amount;
  const displayPrice = displayAmount
    ? `${formatPrice(displayAmount / 100)} / Month`
    : (booking.monthlyRent ? `${formatPrice(booking.monthlyRent)} / Month` : 'Price TBD');

  const bookingData = {
    name: renterName,
    status: formatBookingStatus(booking.status),
    dates: formatDateRange(booking.startDate, booking.endDate),
    address: formatAddress(booking.listing),
    description: `for ${booking.listing.title}`,
    price: displayPrice,
    occupants: [
      { type: "Adult", count: booking.trip?.numAdults || 1, icon: "/host-dashboard/svg/adult.svg" },
      { type: "Children", count: booking.trip?.numChildren || 0, icon: "/host-dashboard/svg/kid.svg" },
      { type: "pet", count: booking.trip?.numPets || 0, icon: "/host-dashboard/svg/pet.svg" },
    ],
    profileImage: booking.user.imageUrl || "/image-35.png",
    guestUserId: booking.user.id,
    matchId: booking.matchId,
    leaseDocumentId: booking.match?.leaseDocumentId || null,
    startDate: booking.startDate,
    endDate: booking.endDate,
  };

  // Format payment data for the table
  // Use baseAmount for hosts (what they receive, excludes service fees)
  const upcomingPayments = booking.rentPayments
    .filter((payment: any) => new Date(payment.dueDate) >= now)
    .map((payment: any) => {
      const hostAmount = payment.baseAmount ?? payment.amount;
      return {
        tenant: renterName,
        amount: (hostAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        type: getPaymentTypeLabel(payment.type),
        method: "ACH Transfer",
        bank: "Bank Account",
        dueDate: formatDate(new Date(payment.dueDate)),
        status: getPaymentStatus(payment),
        avatarUrl: booking.user.imageUrl || "/image-35.png",
        paymentId: payment.id,
        numericAmount: hostAmount,
        parsedDueDate: new Date(payment.dueDate)
      };
    });

  const pastPayments = booking.rentPayments
    .filter((payment: any) => new Date(payment.dueDate) < now)
    .reverse()
    .map((payment: any) => {
      const hostAmount = payment.baseAmount ?? payment.amount;
      return {
        tenant: renterName,
        amount: (hostAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        type: getPaymentTypeLabel(payment.type),
        method: "ACH Transfer",
        bank: "Bank Account",
        dueDate: formatDate(new Date(payment.dueDate)),
        status: getPaymentStatus(payment),
        avatarUrl: booking.user.imageUrl || "/image-35.png",
        paymentId: payment.id,
        numericAmount: hostAmount,
        parsedDueDate: new Date(payment.dueDate)
      };
    });

  const paymentsData = {
    upcoming: upcomingPayments,
    past: pastPayments
  };

  return (
    <BookingDetailClient
      bookingData={bookingData}
      paymentsData={paymentsData}
      renterName={renterName}
      renterAvatar={booking.user.imageUrl || "/image-35.png"}
      listingId={params.listingId}
      bookingId={params.bookingId}
    />
  );
}
