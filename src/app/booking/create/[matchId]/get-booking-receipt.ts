import prisma from '@/lib/prismadb';

const CATEGORY_LABELS: Record<string, string> = {
  BASE_RENT: 'Rent',
  SECURITY_DEPOSIT: 'Refundable Security Deposit',
  PET_RENT: 'Pet Rent',
  PET_DEPOSIT: 'Pet Deposit',
  PLATFORM_FEE: 'MatchBook Service Fee',
  CREDIT_CARD_FEE: 'Credit Card Processing Fee',
  TRANSFER_FEE: 'Transfer Fee',
  DISCOUNT: 'Discount',
  OTHER: 'Other',
};

const fmtCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatMonthDay = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export interface BookingReceiptLine {
  label: string;
  amount: string;
}

export interface BookingReceiptItem {
  id: string;
  date: string;
  total: string;
  details: BookingReceiptLine[];
}

export interface BookingReceipt {
  monthlyPayments: BookingReceiptItem[];
  paidToday: {
    total: string;
    details: BookingReceiptLine[];
  };
}

/**
 * Build a receipt for a completed booking straight from the authoritative
 * RentPayment + RentPaymentCharge rows. Used by the confirmation step so the
 * numbers shown match what Stripe actually collected — any drift from
 * client-computed estimates surfaces a bug.
 *
 * Returns null if the booking doesn't exist or has no rent payments yet.
 */
export async function getBookingReceipt(bookingId: string): Promise<BookingReceipt | null> {
  const rentPayments = await prisma.rentPayment.findMany({
    where: { bookingId },
    orderBy: { dueDate: 'asc' },
    include: {
      charges: {
        where: { isApplied: true },
        orderBy: { appliedAt: 'asc' },
      },
    },
  });

  if (rentPayments.length === 0) return null;

  const depositPayment = rentPayments.find((p) => p.type === 'SECURITY_DEPOSIT');
  const monthlyPaymentRows = rentPayments.filter((p) => p.type !== 'SECURITY_DEPOSIT');

  const buildDetailsFromCharges = (charges: typeof rentPayments[number]['charges']): BookingReceiptLine[] => {
    if (charges.length === 0) return [];
    return charges.map((charge) => ({
      label: CATEGORY_LABELS[charge.category] || charge.category,
      amount: fmtCents(charge.amount),
    }));
  };

  const monthlyPayments: BookingReceiptItem[] = monthlyPaymentRows.map((payment, i) => {
    const totalCents = payment.totalAmount ?? payment.amount;
    return {
      id: `month-${i}`,
      date: formatMonthDay(new Date(payment.dueDate)),
      total: fmtCents(totalCents),
      details: buildDetailsFromCharges(payment.charges),
    };
  });

  const paidTodayTotalCents = depositPayment
    ? (depositPayment.totalAmount ?? depositPayment.amount)
    : 0;

  const paidToday = {
    total: fmtCents(paidTodayTotalCents),
    details: depositPayment ? buildDetailsFromCharges(depositPayment.charges) : [],
  };

  return { monthlyPayments, paidToday };
}
