import React from "react";
import { getListingById } from '@/app/actions/listings';
import { notFound } from 'next/navigation';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { BrandButton } from "@/components/ui/brandButton";
import ListingPaymentsClient from "./listing-payments-client";
import { getListingDisplayName } from '@/utils/listing-helpers';
import { getListingPayments } from '@/app/actions/payments';

interface PaymentsPageProps {
  params: { listingId: string };
}

interface PaymentCardData {
  id: string;
  title: string;
  value: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
  subtitle?: {
    text?: string;
  };
}

function buildListingPaymentCards(
  totalPayments: number,
  latePayments: number,
  totalAmount: string,
  securityDeposits: string
): PaymentCardData[] {
  return [
    {
      id: "total-payments",
      title: "Total Payments",
      value: totalPayments.toString(),
      iconName: "CreditCard",
      iconBg: "bg-blue-50",
      iconColor: "text-gray-700",
      subtitle: { text: "all time" },
    },
    {
      id: "late-payments",
      title: "Late Payments",
      value: latePayments.toString(),
      iconName: "AlertTriangle",
      iconBg: "bg-red-50",
      iconColor: "text-gray-700",
      subtitle: { text: "overdue" },
    },
    {
      id: "total-amount",
      title: "Total Amount of Payments",
      value: `$${totalAmount}`,
      iconName: "DollarSign",
      iconBg: "bg-green-50",
      iconColor: "text-gray-700",
      subtitle: { text: "all time" },
    },
    {
      id: "security-deposits",
      title: "Total Amount of Security Deposits",
      value: `$${securityDeposits}`,
      iconName: "Shield",
      iconBg: "bg-purple-50",
      iconColor: "text-gray-700",
      subtitle: { text: "all time" },
    },
  ];
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { listingId } = params;

  console.log('PaymentsPage: Starting data fetch...');

  // Fetch data in parallel
  const [listing, { paymentsData, stats }] = await Promise.all([
    getListingById(listingId),
    getListingPayments(listingId)
  ]);

  if (!listing) return notFound();

  console.log('PaymentsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- total payments:', stats.totalPayments);

  const cards = buildListingPaymentCards(
    stats.totalPayments,
    stats.latePayments,
    stats.totalAmount,
    stats.securityDeposits
  );

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle
        title="Payments"
        subtitle={`Manage payments for ${getListingDisplayName(listing)}`}
        rightContent={
          <BrandButton
            href={`/app/host/${listingId}/payments/stripe`}
            size="sm"
          >
            Manage Settings
          </BrandButton>
        }
      />
      <ListingPaymentsClient
        cards={cards}
        paymentsData={paymentsData}
      />
    </div>
  );
}
