'use client';

import { PropertyCard } from './property-card';
import { PaymentSchedule } from './payment-schedule';

const monthlyPayments = [
  {
    id: "aug",
    date: "August 1, 2025",
    total: "$2,862.20",
    details: [
      { label: "Prorated Rent", amount: "$2,800.00" },
      { label: "MatchBook Service Fee", amount: "$62.00" },
    ],
  },
  {
    id: "sep",
    date: "September 1, 2025",
    total: "$2,862.20",
    details: [
      { label: "Rent", amount: "$2,800.00" },
      { label: "MatchBook Service Fee", amount: "$62.00" },
    ],
  },
  {
    id: "oct",
    date: "October 1, 2025",
    total: "$2,862.20",
    details: [
      { label: "Rent", amount: "$2,800.00" },
      { label: "MatchBook Service Fee", amount: "$62.00" },
    ],
  },
];

const dueToday = {
  total: "$1,007.20",
  details: [
    { label: "Refundable Security Deposit", amount: "$1,000.20" },
    { label: "Transfer Fee", amount: "$7" },
  ],
};

export function StepReviewBooking() {
  return (
    <>
      <PropertyCard
        title="Your Home Away from Home"
        meta="2 Adults, 1 child, 1 pet"
        moveInDate="12 Jun 2025"
        moveOutDate="12 Jun 2025"
      />

      <PaymentSchedule
        monthlyPayments={monthlyPayments}
        dueToday={dueToday}
        defaultExpandedId="aug"
      />
    </>
  );
}
