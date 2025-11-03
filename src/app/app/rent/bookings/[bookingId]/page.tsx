import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import stripe from "@/lib/stripe";
import { getPaymentTypeLabel } from "@/lib/payment-display-helpers";
import { RentPaymentsTable } from "../components/rent-payments-table";

interface BookingDetailPageProps {
  params: {
    bookingId: string;
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

type RentPayment = {
  id: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  status?: string;
};

function getPaymentStatus(rentPayment: RentPayment): string {
  // Check for explicit status field first
  if (rentPayment.status === 'PENDING_MOVE_IN') return "Pending Move-In";
  if (rentPayment.status === 'FAILED_MOVE_IN') return "Move-In Failed";
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

  // Fetch booking with payment-related data only
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      rentPayments: {
        orderBy: { dueDate: 'asc' },
        include: {
          paymentModifications: {
            where: {
              recipientId: userId,
              status: 'pending'
            },
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
              }
            }
          }
        }
      },
      listing: {
        select: {
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          imageSrc: true,
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
      }
    }
  });

  // Verify renter owns the booking
  if (!booking || booking.userId !== userId) {
    redirect("/app/rent/bookings");
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
    // Continue with empty array - will fetch client-side as fallback
  }

  // Format host data
  const host = booking.listing.user;
  const hostName = host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email || 'Unknown Host';

  // Helper function to get payment method details
  const getPaymentMethodDisplay = (payment: any) => {
    // Find the payment method in the fetched list
    const paymentMethod = paymentMethods.find(pm => pm.id === payment.stripePaymentMethodId);

    if (!paymentMethod) {
      return {
        method: "Not Set",
        bank: "No Payment Method"
      };
    }

    if (paymentMethod.type === 'card') {
      const brand = paymentMethod.brand?.charAt(0).toUpperCase() + paymentMethod.brand?.slice(1);
      return {
        method: "Card",
        bank: `${brand} ••••${paymentMethod.lastFour}`
      };
    } else {
      return {
        method: "ACH Transfer",
        bank: paymentMethod.bankName || `Bank ••••${paymentMethod.lastFour}`
      };
    }
  };

  // Format payment data for the table
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Helper to check if payment is "paid"
  const isPaymentPaid = (payment: any) => {
    return payment.isPaid ||
           payment.status === 'SUCCEEDED' ||
           payment.status === 'REFUNDED';
  };

  // Upcoming: future payments OR same-day unpaid payments
  const upcomingPayments = booking.rentPayments
    .filter((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      // Future payments
      if (dueDate >= todayEnd) return true;
      // Same-day unpaid payments
      if (dueDate >= todayStart && dueDate < todayEnd && !isPaymentPaid(payment)) return true;
      return false;
    })
    .map((payment: any) => {
      const hasPendingModification = payment.paymentModifications.length > 0; // Show red dot for any pending modification
      const modification = payment.paymentModifications[0]; // Get the first (and should be only) pending modification

      let modificationData = null;
      if (modification) {
        const requestorName = modification.requestor.fullName ||
          `${modification.requestor.firstName || ''} ${modification.requestor.lastName || ''}`.trim() ||
          modification.requestor.email || 'Unknown';

        modificationData = {
          id: modification.id,
          requestorName,
          requestorImage: modification.requestor.imageUrl || '/image-35.png',
          propertyTitle: booking.listing.title,
          propertyAddress: formatAddress(booking.listing),
          propertyImage: booking.listing.imageSrc || '/placeholder-property.jpg',
          originalAmount: `$${(modification.originalAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          originalDueDate: formatDate(new Date(modification.originalDueDate)),
          newAmount: `$${(modification.newAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          newDueDate: formatDate(new Date(modification.newDueDate)),
          reason: modification.reason,
          requestedAt: formatDate(new Date(modification.requestedAt)),
          bookingId: params.bookingId
        };
      }

      const paymentMethodDisplay = getPaymentMethodDisplay(payment);

      return {
        amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        type: getPaymentTypeLabel(payment.type),
        method: paymentMethodDisplay.method,
        bank: paymentMethodDisplay.bank,
        dueDate: formatDate(new Date(payment.dueDate)),
        status: getPaymentStatus(payment),
        paymentId: payment.id,
        hasPendingModification,
        pendingModificationCount: payment.paymentModifications.length,
        modificationData
      };
    });

  // Past: past payments OR same-day paid payments
  const pastPayments = booking.rentPayments
    .filter((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      // Past payments
      if (dueDate < todayStart) return true;
      // Same-day paid payments
      if (dueDate >= todayStart && dueDate < todayEnd && isPaymentPaid(payment)) return true;
      return false;
    })
    .reverse()
    .map((payment: any) => {
      const hasPendingModification = payment.paymentModifications.length > 0; // Show red dot for any pending modification
      const modification = payment.paymentModifications[0]; // Get the first (and should be only) pending modification

      let modificationData = null;
      if (modification) {
        const requestorName = modification.requestor.fullName ||
          `${modification.requestor.firstName || ''} ${modification.requestor.lastName || ''}`.trim() ||
          modification.requestor.email || 'Unknown';

        modificationData = {
          id: modification.id,
          requestorName,
          requestorImage: modification.requestor.imageUrl || '/image-35.png',
          propertyTitle: booking.listing.title,
          propertyAddress: formatAddress(booking.listing),
          propertyImage: booking.listing.imageSrc || '/placeholder-property.jpg',
          originalAmount: `$${(modification.originalAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          originalDueDate: formatDate(new Date(modification.originalDueDate)),
          newAmount: `$${(modification.newAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          newDueDate: formatDate(new Date(modification.newDueDate)),
          reason: modification.reason,
          requestedAt: formatDate(new Date(modification.requestedAt)),
          bookingId: params.bookingId
        };
      }

      const paymentMethodDisplay = getPaymentMethodDisplay(payment);

      return {
        amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        type: getPaymentTypeLabel(payment.type),
        method: paymentMethodDisplay.method,
        bank: paymentMethodDisplay.bank,
        dueDate: formatDate(new Date(payment.dueDate)),
        status: getPaymentStatus(payment),
        paymentId: payment.id,
        hasPendingModification,
        pendingModificationCount: payment.paymentModifications.length,
        modificationData
      };
    });

  const paymentsData = {
    upcoming: upcomingPayments,
    past: pastPayments
  };

  return (
    <RentPaymentsTable
      paymentsData={paymentsData}
      hostName={hostName}
      hostAvatar={host.imageUrl || "/image-35.png"}
      bookingId={params.bookingId}
      initialPaymentMethods={paymentMethods}
    />
  );
}