import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismadb";
import stripe from "@/lib/stripe";
import { getPaymentTypeLabel } from "@/lib/payment-display-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PropertyDetailsSection from "./property-details-section";
import MapPlaceholder from "./map-placeholder";
import { TablelessPaymentsTable } from "@/app/newnew/demo/tableless-payments-table";
import RenterNavbar from "@/components/renter-navbar";

interface BookingDetailsPageProps {
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
  if (rentPayment.status === 'SUCCEEDED') return "Paid";
  if (rentPayment.status === 'FAILED') return "Failed";
  if (rentPayment.status === 'PROCESSING') return "Processing";
  if (rentPayment.status === 'CANCELLED') return "Cancelled";
  if (rentPayment.status === 'REFUNDED') return "Refunded";

  if (rentPayment.isPaid) return "Paid";

  const now = new Date();
  const dueDate = new Date(rentPayment.dueDate);

  if (dueDate < now) return "Overdue";
  if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "Due";
  return "Scheduled";
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      trip: true,
      match: true,
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
          id: true,
          title: true,
          streetAddress1: true,
          city: true,
          state: true,
          postalCode: true,
          imageSrc: true,
          latitude: true,
          longitude: true,
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

  if (!booking || booking.userId !== userId) {
    redirect("/rent/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      email: true,
      stripeCustomerId: true,
    }
  });

  let paymentMethods: any[] = [];
  try {
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

  const host = booking.listing.user;
  const hostName = host.fullName || `${host.firstName || ''} ${host.lastName || ''}`.trim() || host.email || 'Unknown Host';

  const getPaymentMethodDisplay = (payment: any) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === payment.stripePaymentMethodId);

    if (!paymentMethod) {
      return { method: "Not Set", bank: "No Payment Method" };
    }

    if (paymentMethod.type === 'card') {
      const brand = paymentMethod.brand?.charAt(0).toUpperCase() + paymentMethod.brand?.slice(1);
      return { method: "Card", bank: `${brand} ••••${paymentMethod.lastFour}` };
    } else {
      return { method: "ACH Transfer", bank: paymentMethod.bankName || `Bank ••••${paymentMethod.lastFour}` };
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const isPaymentPaid = (payment: any) => {
    return payment.isPaid || payment.status === 'SUCCEEDED' || payment.status === 'REFUNDED';
  };

  const mapPayment = (payment: any) => {
    const hasPendingModification = payment.paymentModifications.length > 0;
    const modification = payment.paymentModifications[0];

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
  };

  const upcomingPayments = booking.rentPayments
    .filter((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      if (dueDate >= todayEnd) return true;
      if (dueDate >= todayStart && dueDate < todayEnd && !isPaymentPaid(payment)) return true;
      return false;
    })
    .map(mapPayment);

  const pastPayments = booking.rentPayments
    .filter((payment: any) => {
      const dueDate = new Date(payment.dueDate);
      if (dueDate < todayStart) return true;
      if (dueDate >= todayStart && dueDate < todayEnd && isPaymentPaid(payment)) return true;
      return false;
    })
    .reverse()
    .map(mapPayment);

  const paymentsData = { upcoming: upcomingPayments, past: pastPayments };

  const leaseDocumentId = booking.match?.leaseDocumentId ?? null;

  const propertyData = {
    title: booking.listing.title || "Your Home Away from Home",
    imageSrc: booking.listing.imageSrc || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    address: formatAddress(booking.listing),
    startDate: booking.startDate,
    endDate: booking.endDate,
    numAdults: booking.trip?.numAdults || 0,
    numChildren: booking.trip?.numChildren || 0,
    numPets: booking.trip?.numPets || 0,
    bookingId: params.bookingId,
    matchId: booking.matchId,
    leaseDocumentId,
    listingId: booking.listing.id,
  };

  const navbarUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl || '',
  } : null;

  return (
    <>
      <RenterNavbar
        userId={userId}
        user={navbarUser}
        isSignedIn={!!userId}
      />
      <div className="max-w-[1280px] mx-auto">
        <div className="px-6">
        <Link href="/rent/dashboard">
          <Button
            variant="outline"
            className="border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            Back
          </Button>
        </Link>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PropertyDetailsSection {...propertyData} />
        <div className="hidden lg:block">
          <MapPlaceholder
            latitude={booking.listing.latitude}
            longitude={booking.listing.longitude}
          />
        </div>
      </div>

      <div className="px-6 py-8">
        <TablelessPaymentsTable
          paymentsData={paymentsData}
          hostName={hostName}
          hostAvatar={host.imageUrl || "/image-35.png"}
          bookingId={params.bookingId}
          initialPaymentMethods={paymentMethods}
        />
      </div>
    </div>
    </>
  );
}
