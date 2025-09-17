import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import PaymentModificationClient from "./payment-modification-client";

interface PaymentModificationPageProps {
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

export default async function PaymentModificationPage({ params }: PaymentModificationPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the payment modification request
  const paymentModification = await prisma.paymentModification.findFirst({
    where: {
      rentPaymentId: params.paymentId,
      status: 'pending',
      recipientId: userId
    },
    include: {
      rentPayment: {
        include: {
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
              },
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      },
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
          email: true
        }
      }
    }
  });

  // If no pending modification found, redirect back to bookings
  if (!paymentModification) {
    redirect(`/app/rent/bookings/${params.bookingId}`);
  }

  // Verify the user is the recipient of this modification request
  if (paymentModification.recipientId !== userId) {
    redirect("/app/rent/bookings");
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

  // Prepare data for client component
  const modificationData = {
    id: paymentModification.id,
    requestorName: paymentModification.requestor.fullName || 
      `${paymentModification.requestor.firstName || ''} ${paymentModification.requestor.lastName || ''}`.trim() ||
      paymentModification.requestor.email || 'Unknown',
    requestorImage: paymentModification.requestor.imageUrl || '/image-35.png',
    propertyTitle: paymentModification.rentPayment.booking.listing.title,
    propertyAddress: formatAddress(paymentModification.rentPayment.booking.listing),
    propertyImage: paymentModification.rentPayment.booking.listing.imageSrc || '/placeholder-property.jpg',
    originalAmount: formatPrice(paymentModification.originalAmount),
    originalDueDate: formatDate(paymentModification.originalDueDate),
    newAmount: formatPrice(paymentModification.newAmount),
    newDueDate: formatDate(paymentModification.newDueDate),
    reason: paymentModification.reason,
    requestedAt: formatDate(paymentModification.requestedAt),
    bookingId: params.bookingId
  };

  return <PaymentModificationClient data={modificationData} />;
}