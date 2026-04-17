'use client';

import { useMemo } from 'react';
import { PropertyCard } from './property-card';
import { PaymentSchedule } from './payment-schedule';
import { calculatePayments } from '@/lib/calculate-payments';
import { getServiceFeeRate, FEES } from '@/lib/fee-constants';
import type { MatchWithRelations } from '@/types';
import type { BookingReceipt } from '../get-booking-receipt';

interface BookingSummaryProps {
  match: MatchWithRelations;
  defaultExpandedPaymentId?: string;
  /**
   * 'summary' — pre-payment review (default). "Due today" label.
   *              Always uses client-computed values from the match/listing.
   * 'receipt' — post-payment confirmation. "Paid today" label.
   *              Uses the real-data `receipt` prop if provided (authoritative
   *              RentPayment rows), otherwise falls back to computed.
   */
  variant?: 'summary' | 'receipt';
  /** Real-data receipt from RentPayment rows. Only used when variant === 'receipt'. */
  receipt?: BookingReceipt | null;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Shared property card + payment schedule for both the Review Booking step
 * and the Confirmation step. Future mods to the booking summary display
 * should land here so both steps stay in sync.
 */
export function BookingSummary({
  match,
  defaultExpandedPaymentId = 'month-0',
  variant = 'summary',
  receipt = null,
}: BookingSummaryProps) {
  const isReceipt = variant === 'receipt';
  const useRealData = isReceipt && receipt !== null;
  const paymentDetails = calculatePayments({
    listing: match.listing,
    trip: match.trip,
    monthlyRentOverride: match.monthlyRent,
    petRentOverride: match.petRent,
    petDepositOverride: match.petDeposit,
  });

  const tripStart = new Date(match.trip.startDate);
  const tripEnd = new Date(match.trip.endDate);
  const monthsDiff = (tripEnd.getFullYear() - tripStart.getFullYear()) * 12 + (tripEnd.getMonth() - tripStart.getMonth());
  const serviceFeeRate = getServiceFeeRate(monthsDiff);
  const baseRent = paymentDetails.totalMonthlyRent;

  const monthlyPayments = useMemo(() => {
    const payments: { id: string; date: string; total: string; details: { label: string; amount: string }[] }[] = [];
    const cursor = new Date(tripStart);
    let i = 0;

    while (cursor < tripEnd) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const isFirst = i === 0;
      const dayOfMonth = cursor.getDate();
      const isFirstProrated = isFirst && dayOfMonth > 1;

      const monthEnd = new Date(year, month + 1, 0);
      const isLastProrated = !isFirstProrated && monthEnd >= tripEnd && tripEnd.getDate() < daysInMonth;

      let rent = baseRent;
      let prorateLabel = 'Rent';
      if (isFirstProrated) {
        const daysRemaining = daysInMonth - dayOfMonth + 1;
        rent = Math.round((baseRent * daysRemaining / daysInMonth) * 100) / 100;
        prorateLabel = `Prorated Rent (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'})`;
      } else if (isLastProrated) {
        const daysUsed = tripEnd.getDate();
        rent = Math.round((baseRent * daysUsed / daysInMonth) * 100) / 100;
        prorateLabel = `Prorated Rent (${daysUsed} ${daysUsed === 1 ? 'day' : 'days'})`;
      }

      const fee = Math.round(rent * serviceFeeRate * 100) / 100;
      const total = Math.round((rent + fee) * 100) / 100;
      const dateLabel = cursor.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const details = [
        { label: (isFirstProrated || isLastProrated) ? prorateLabel : 'Rent', amount: fmt(rent) },
      ];
      if (paymentDetails.monthlyPetRent > 0) {
        details.push({ label: 'Pet Rent', amount: fmt(paymentDetails.monthlyPetRent) });
      }
      details.push({ label: 'MatchBook Service Fee', amount: fmt(fee) });

      payments.push({ id: `month-${i}`, date: dateLabel, total: fmt(total), details });

      cursor.setMonth(cursor.getMonth() + 1);
      cursor.setDate(1);
      i++;
    }

    return payments;
  }, [baseRent, serviceFeeRate, tripStart, tripEnd, paymentDetails.monthlyPetRent]);

  const dueToday = useMemo(() => {
    const details: { label: string; amount: string }[] = [];
    let subtotal = 0;

    details.push({ label: 'Refundable Security Deposit', amount: fmt(paymentDetails.securityDeposit) });
    subtotal += paymentDetails.securityDeposit;

    if (paymentDetails.petDeposit > 0) {
      details.push({ label: 'Pet Deposit', amount: fmt(paymentDetails.petDeposit) });
      subtotal += paymentDetails.petDeposit;
    }

    details.push({ label: 'Transfer Fee', amount: fmt(subtotal > 0 ? FEES.TRANSFER_FEE_DOLLARS : 0) });
    subtotal += subtotal > 0 ? FEES.TRANSFER_FEE_DOLLARS : 0;

    return { total: fmt(subtotal), details };
  }, [paymentDetails]);

  const meta = [
    `${match.trip.numAdults} ${match.trip.numAdults === 1 ? 'Adult' : 'Adults'}`,
    match.trip.numChildren > 0 ? `${match.trip.numChildren} ${match.trip.numChildren === 1 ? 'Child' : 'Children'}` : null,
    match.trip.numPets > 0 ? `${match.trip.numPets} ${match.trip.numPets === 1 ? 'Pet' : 'Pets'}` : null,
  ].filter(Boolean).join(', ');

  const listingImage = match.listing.listingImages?.[0]?.url;

  return (
    <>
      <PropertyCard
        title={match.listing.title || 'Your Home Away from Home'}
        meta={meta}
        imageUrl={listingImage}
        moveInDate={formatDate(match.trip.startDate)}
        moveOutDate={formatDate(match.trip.endDate)}
      />

      <PaymentSchedule
        monthlyPayments={useRealData && receipt ? receipt.monthlyPayments : monthlyPayments}
        dueToday={useRealData && receipt ? receipt.paidToday : dueToday}
        defaultExpandedId={defaultExpandedPaymentId}
        dueTodayLabel={isReceipt ? 'Paid today' : 'Due today'}
      />
    </>
  );
}
