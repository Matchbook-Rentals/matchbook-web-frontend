'use client';

import { PropertyCard } from '@/app/booking/create/[matchId]/components/property-card';
import {
  BrandAccordionGroup,
  BrandAccordionItem,
  BrandAccordionTrigger,
  BrandAccordionContent,
  BrandAccordionDetailRow,
} from '@/components/ui/brand-accordion';

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

export function AdminStepReview() {
  return (
    <>
      <PropertyCard
        title="Your Home Away from Home"
        meta="2 Adults, 1 child, 1 pet"
        moveInDate="12 Jun 2025"
        moveOutDate="12 Jun 2025"
        chipVariant="pill"
      />

      <BrandAccordionGroup
        title="Monthly Rent Payments"
        type="multiple"
        defaultValue={["aug", "due-today"]}
      >
        {monthlyPayments.map((payment) => (
          <BrandAccordionItem key={payment.id} value={payment.id}>
            <BrandAccordionTrigger rightContent={payment.total}>
              {payment.date}
            </BrandAccordionTrigger>
            <BrandAccordionContent>
              {payment.details.map((d, i) => (
                <BrandAccordionDetailRow key={i} label={d.label} value={d.amount} />
              ))}
            </BrandAccordionContent>
          </BrandAccordionItem>
        ))}

        <div className="bg-brandBrown border-t border-brandBrown-100">
          <BrandAccordionItem value="due-today" className="border-b-0">
            <BrandAccordionTrigger rightContent={dueToday.total} className="font-bold">
              <span className="font-bold text-[15px]">Due today</span>
            </BrandAccordionTrigger>
            <BrandAccordionContent className="bg-brandBrown-50 border-b-0">
              {dueToday.details.map((d, i) => (
                <BrandAccordionDetailRow key={i} label={d.label} value={d.amount} />
              ))}
            </BrandAccordionContent>
          </BrandAccordionItem>
        </div>
      </BrandAccordionGroup>
    </>
  );
}
