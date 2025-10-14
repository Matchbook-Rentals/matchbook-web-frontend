import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import stripe from "@/lib/stripe";
import ChangePaymentMethodClient from "./change-payment-method-client";

interface ChangePaymentMethodPageProps {
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

export default async function ChangePaymentMethodPage({ params }: ChangePaymentMethodPageProps) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the payment
  const rentPayment = await prisma.rentPayment.findFirst({
    where: {
      id: params.paymentId,
      booking: {
        id: params.bookingId,
        userId: userId // Ensure user owns this booking
      }
    },
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
          }
        }
      }
    }
  });

  // If no payment found, redirect back to bookings
  if (!rentPayment) {
    redirect(`/app/rent/bookings/${params.bookingId}`);
  }

  // Fetch user's payment methods
  let paymentMethods: any[] = [];
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true }
    });

    if (user?.stripeCustomerId) {
      const [cardMethods, bankMethods] = await Promise.all([
        stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'card',
        }),
        stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'us_bank_account',
        })
      ]);

      // Format for the component
      paymentMethods = [...cardMethods.data, ...bankMethods.data].map((pm: any) => {
        if (pm.type === 'card') {
          return {
            id: pm.id,
            type: 'card' as const,
            brand: pm.card?.brand,
            lastFour: pm.card?.last4,
            expiry: `${String(pm.card?.exp_month).padStart(2, '0')}/${pm.card?.exp_year}`,
          };
        } else if (pm.type === 'us_bank_account') {
          return {
            id: pm.id,
            type: 'bank' as const,
            bankName: pm.us_bank_account?.bank_name,
            lastFour: pm.us_bank_account?.last4,
          };
        }
        return null;
      }).filter(Boolean);
    }
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
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
  const paymentData = {
    paymentId: rentPayment.id,
    amount: rentPayment.amount, // in cents
    dueDate: formatDate(rentPayment.dueDate),
    propertyTitle: rentPayment.booking.listing.title,
    propertyAddress: formatAddress(rentPayment.booking.listing),
    propertyImage: rentPayment.booking.listing.imageSrc || '/placeholder-property.jpg',
    currentPaymentMethodId: rentPayment.stripePaymentMethodId || null
  };

  return (
    <ChangePaymentMethodClient
      paymentData={paymentData}
      bookingId={params.bookingId}
      initialPaymentMethods={paymentMethods}
    />
  );
}
