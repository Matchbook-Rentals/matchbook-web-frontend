import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import PaymentModificationsClient from "./payment-modifications-client";

interface PaymentModificationsPageProps {
  params: {
    bookingId: string;
    paymentId: string;
  };
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function PaymentModificationsPage({ params }: PaymentModificationsPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the payment with all modifications
  const rentPayment = await prisma.rentPayment.findFirst({
    where: {
      id: params.paymentId,
      booking: {
        id: params.bookingId,
        userId: userId // Ensure user owns this booking
      }
    },
    include: {
      paymentModifications: {
        orderBy: { requestedAt: 'desc' },
        include: {
          requestor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              imageUrl: true
            }
          },
          recipient: {
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
      booking: {
        include: {
          listing: {
            select: {
              title: true,
              streetAddress1: true,
              city: true,
              state: true,
              postalCode: true,
              imageSrc: true
            }
          }
        }
      }
    }
  });

  // If no payment found, redirect back to bookings
  if (!rentPayment) {
    redirect(`/app/rent/bookings/${params.bookingId}`);
  }

  // Format the address
  const formatAddress = (listing: any): string => {
    const parts = [
      listing.streetAddress1,
      listing.city,
      listing.state,
      listing.postalCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Format payment data
  const paymentData = {
    paymentId: rentPayment.id,
    originalAmount: formatPrice(rentPayment.amount),
    originalDueDate: formatDate(rentPayment.dueDate),
    propertyTitle: rentPayment.booking.listing.title,
    propertyAddress: formatAddress(rentPayment.booking.listing),
    propertyImage: rentPayment.booking.listing.imageSrc || '/placeholder-property.jpg'
  };

  // Format modifications data
  const modifications = rentPayment.paymentModifications.map((mod) => {
    const requestorName = mod.requestor.fullName ||
      `${mod.requestor.firstName || ''} ${mod.requestor.lastName || ''}`.trim() ||
      mod.requestor.email || 'Unknown';

    const recipientName = mod.recipient.fullName ||
      `${mod.recipient.firstName || ''} ${mod.recipient.lastName || ''}`.trim() ||
      mod.recipient.email || 'Unknown';

    return {
      id: mod.id,
      status: mod.status,
      requestorName,
      requestorImage: mod.requestor.imageUrl || '/image-35.png',
      recipientName,
      recipientImage: mod.recipient.imageUrl || '/image-35.png',
      originalAmount: formatPrice(mod.originalAmount),
      originalDueDate: formatDate(mod.originalDueDate),
      newAmount: formatPrice(mod.newAmount),
      newDueDate: formatDate(mod.newDueDate),
      reason: mod.reason,
      requestedAt: formatDateTime(mod.requestedAt),
      viewedAt: mod.viewedAt ? formatDateTime(mod.viewedAt) : null,
      approvedAt: mod.approvedAt ? formatDateTime(mod.approvedAt) : null,
      rejectedAt: mod.rejectedAt ? formatDateTime(mod.rejectedAt) : null,
      rejectionReason: mod.rejectionReason,
      isRequestor: mod.requestorId === userId
    };
  });

  return (
    <PaymentModificationsClient
      paymentData={paymentData}
      modifications={modifications}
      bookingId={params.bookingId}
    />
  );
}
