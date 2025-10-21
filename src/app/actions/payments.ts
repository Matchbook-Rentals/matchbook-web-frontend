'use server'

import prisma from '@/lib/prismadb'
import { auth } from '@clerk/nextjs/server'
import { getPaymentTypeLabel } from '@/lib/payment-display-helpers'

interface PaymentTableData {
  tenant: string;
  amount: string;
  type: string;
  method: string;
  bank: string;
  dueDate: string;
  status: string;
  avatarUrl: string;
  paymentId: string;
  numericAmount: number;
  parsedDueDate: Date;
}

interface PaymentsData {
  upcoming: PaymentTableData[];
  history: PaymentTableData[];
}

interface PaymentStats {
  totalPayments: number;
  latePayments: number;
  totalAmount: string;
  securityDeposits: string;
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

function getPaymentStatus(rentPayment: { isPaid: boolean; dueDate: Date }): string {
  if (rentPayment.isPaid) return "Completed";

  const now = new Date();
  const dueDate = new Date(rentPayment.dueDate);

  if (dueDate < now) return "Overdue";
  if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) return "Due";
  return "Scheduled";
}

export async function getAllHostPayments(): Promise<{ paymentsData: PaymentsData; stats: PaymentStats }> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get all bookings for the host's listings with payment information
    const bookings = await prisma.booking.findMany({
      where: {
        listing: {
          userId: userId // Get bookings where the listing belongs to the current user (host)
        }
      },
      include: {
        rentPayments: {
          orderBy: { dueDate: 'asc' }
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
        }
      }
    });

    // Flatten all payments from all bookings
    const allPayments: PaymentTableData[] = [];

    for (const booking of bookings) {
      const renterName = booking.user.fullName ||
        `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
        booking.user.email ||
        'Unknown Renter';

      const avatarUrl = booking.user.imageUrl || "/image-35.png";

      for (const payment of booking.rentPayments) {
        allPayments.push({
          tenant: renterName,
          amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          type: getPaymentTypeLabel(payment.type),
          method: "ACH Transfer",
          bank: "Bank Account",
          dueDate: formatDate(new Date(payment.dueDate)),
          status: getPaymentStatus({ isPaid: payment.isPaid, dueDate: payment.dueDate }),
          avatarUrl: avatarUrl,
          paymentId: payment.id,
          numericAmount: payment.amount,
          parsedDueDate: new Date(payment.dueDate)
        });
      }
    }

    // Split into upcoming and history, sorted chronologically
    const now = new Date();
    const upcomingPayments = allPayments
      .filter(p => p.parsedDueDate >= now)
      .sort((a, b) => a.parsedDueDate.getTime() - b.parsedDueDate.getTime()); // Ascending: soonest first

    const historyPayments = allPayments
      .filter(p => p.parsedDueDate < now)
      .sort((a, b) => b.parsedDueDate.getTime() - a.parsedDueDate.getTime()); // Descending: most recent first

    // Calculate statistics
    const totalPayments = allPayments.length;
    const latePayments = allPayments.filter(p => p.status === "Overdue").length;

    // Total amount of all payments (in cents, then convert to dollars)
    const totalAmountCents = allPayments.reduce((sum, p) => sum + p.numericAmount, 0);
    const totalAmount = (totalAmountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Total security deposits (filter by type)
    const securityDepositsCents = allPayments
      .filter(p => p.type === "Security Deposit" || p.type === "Pet Deposit")
      .reduce((sum, p) => sum + p.numericAmount, 0);
    const securityDeposits = (securityDepositsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      paymentsData: {
        upcoming: upcomingPayments,
        history: historyPayments
      },
      stats: {
        totalPayments,
        latePayments,
        totalAmount,
        securityDeposits
      }
    };
  } catch (error) {
    console.error('Error fetching host payments:', error);
    // Return empty data on error
    return {
      paymentsData: {
        upcoming: [],
        history: []
      },
      stats: {
        totalPayments: 0,
        latePayments: 0,
        totalAmount: '0.00',
        securityDeposits: '0.00'
      }
    };
  }
}

export async function getListingPayments(listingId: string): Promise<{ paymentsData: PaymentsData; stats: PaymentStats }> {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // First verify the listing belongs to the current user
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    });

    if (!listing || listing.userId !== userId) {
      throw new Error('Unauthorized to view payments for this listing');
    }

    // Get all bookings for this specific listing with payment information
    const bookings = await prisma.booking.findMany({
      where: {
        listingId: listingId
      },
      include: {
        rentPayments: {
          orderBy: { dueDate: 'asc' }
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
        }
      }
    });

    // Flatten all payments from all bookings
    const allPayments: PaymentTableData[] = [];

    for (const booking of bookings) {
      const renterName = booking.user.fullName ||
        `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
        booking.user.email ||
        'Unknown Renter';

      const avatarUrl = booking.user.imageUrl || "/image-35.png";

      for (const payment of booking.rentPayments) {
        allPayments.push({
          tenant: renterName,
          amount: (payment.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          type: getPaymentTypeLabel(payment.type),
          method: "ACH Transfer",
          bank: "Bank Account",
          dueDate: formatDate(new Date(payment.dueDate)),
          status: getPaymentStatus({ isPaid: payment.isPaid, dueDate: payment.dueDate }),
          avatarUrl: avatarUrl,
          paymentId: payment.id,
          numericAmount: payment.amount,
          parsedDueDate: new Date(payment.dueDate)
        });
      }
    }

    // Split into upcoming and history, sorted chronologically
    const now = new Date();
    const upcomingPayments = allPayments
      .filter(p => p.parsedDueDate >= now)
      .sort((a, b) => a.parsedDueDate.getTime() - b.parsedDueDate.getTime()); // Ascending: soonest first

    const historyPayments = allPayments
      .filter(p => p.parsedDueDate < now)
      .sort((a, b) => b.parsedDueDate.getTime() - a.parsedDueDate.getTime()); // Descending: most recent first

    // Calculate statistics
    const totalPayments = allPayments.length;
    const latePayments = allPayments.filter(p => p.status === "Overdue").length;

    // Total amount of all payments (in cents, then convert to dollars)
    const totalAmountCents = allPayments.reduce((sum, p) => sum + p.numericAmount, 0);
    const totalAmount = (totalAmountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Total security deposits (filter by type)
    const securityDepositsCents = allPayments
      .filter(p => p.type === "Security Deposit" || p.type === "Pet Deposit")
      .reduce((sum, p) => sum + p.numericAmount, 0);
    const securityDeposits = (securityDepositsCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      paymentsData: {
        upcoming: upcomingPayments,
        history: historyPayments
      },
      stats: {
        totalPayments,
        latePayments,
        totalAmount,
        securityDeposits
      }
    };
  } catch (error) {
    console.error('Error fetching listing payments:', error);
    // Return empty data on error
    return {
      paymentsData: {
        upcoming: [],
        history: []
      },
      stats: {
        totalPayments: 0,
        latePayments: 0,
        totalAmount: '0.00',
        securityDeposits: '0.00'
      }
    };
  }
}
