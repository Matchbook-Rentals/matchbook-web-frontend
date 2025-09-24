import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { BrandButton } from "@/components/ui/brandButton";
import { auth } from "@clerk/nextjs/server";
import ListingPaymentsClient from "./listing-payments-client";
import { getListingDisplayName } from '@/utils/listing-helpers';

interface PaymentsPageProps {
  params: { listingId: string };
}

interface PaymentTableData {
  tenant: string;
  amount: string;
  type: string;
  method: string;
  bank: string;
  dueDate: string;
  status: string;
}

interface PaymentsData {
  upcoming: PaymentTableData[];
  history: PaymentTableData[];
}

async function fetchMockListingPaymentsData(listingAddress: string): Promise<PaymentsData> {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock payment data for this specific listing
  return {
    upcoming: [
      {
        tenant: "Sarah Johnson",
        amount: "1,850.00",
        type: "Rent",
        method: "Bank Transfer",
        bank: "Wells Fargo",
        dueDate: "02/01/2025",
        status: "Scheduled",
      },
      {
        tenant: "Michael Chen",
        amount: "2,200.00",
        type: "Rent",
        method: "ACH Transfer",
        bank: "Bank of America",
        dueDate: "02/01/2025",
        status: "Scheduled",
      },
    ],
    history: [
      {
        tenant: "Daniel Resner",
        amount: "2,350.30",
        type: "Rent",
        method: "Bank Transfer",
        bank: "Chase",
        dueDate: "01/15/2025",
        status: "Completed",
      },
      {
        tenant: "Lisa Thompson",
        amount: "1,900.00",
        type: "Rent",
        method: "ACH Transfer",
        bank: "TD Bank",
        dueDate: "01/01/2025",
        status: "Completed",
      },
      {
        tenant: "Robert Miller",
        amount: "3,200.00",
        type: "Security Deposit",
        method: "Wire Transfer",
        bank: "JPMorgan Chase",
        dueDate: "12/28/2024",
        status: "Completed",
      },
    ],
  };
}

function getEmptyListingPaymentsData(): PaymentsData {
  return {
    upcoming: [],
    history: [],
  };
}

function buildListingPaymentCards(useMockData: boolean, listingAddress: string, isAdmin: boolean) {
  if (useMockData) {
    return [
      {
        id: "total-payments",
        title: "Total Payments",
        value: "12",
        iconName: "CreditCard",
        iconBg: "bg-blue-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "late-payments",
        title: "Late Payments",
        value: "0",
        iconName: "AlertTriangle",
        iconBg: "bg-red-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "total-amount",
        title: "Total Amount of Payments",
        value: "$9,500",
        iconName: "DollarSign",
        iconBg: "bg-green-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "security-deposits",
        title: "Total Amount of Security Deposits",
        value: "$3,200",
        iconName: "Shield",
        iconBg: "bg-purple-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
    ];
  }
  
  const baseCards = [
    {
      id: "total-payments",
      title: "Total Payments",
      value: "0",
      iconName: "CreditCard",
      iconBg: "bg-blue-50",
      iconColor: "text-gray-700",
      subtitle: { text: "this month" },
    },
    {
      id: "late-payments",
      title: "Late Payments",
      value: "0",
      iconName: "AlertTriangle",
      iconBg: "bg-red-50",
      iconColor: "text-gray-700",
      subtitle: { text: "this month" },
    },
    {
      id: "total-amount",
      title: "Total Amount of Payments",
      value: "$0",
      iconName: "DollarSign",
      iconBg: "bg-green-50",
      iconColor: "text-gray-700",
      subtitle: { text: "this month" },
    },
  ];

  if (isAdmin) {
    baseCards.push({
      id: "view-mock-data",
      title: "View Mock Data",
      value: "Click",
      iconName: "Eye",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      subtitle: { text: "for demo purposes" },
    });
  } else {
    baseCards.push({
      id: "security-deposits",
      title: "Total Amount of Security Deposits",
      value: "$0",
      iconName: "Shield",
      iconBg: "bg-purple-50",
      iconColor: "text-gray-700",
      subtitle: { text: "this month" },
    });
  }

  return baseCards;
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { listingId } = params;
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  
  console.log('PaymentsPage: Starting data fetch...');
  
  // Fetch data in parallel
  const [listing, bookings] = await Promise.all([
    getListingById(listingId),
    getBookingsByListingId(listingId)
  ]);

  if (!listing) return notFound();

  console.log('PaymentsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- bookings count:', bookings.length);
  
  const listingAddress = listing.streetAddress1;
  const mockData = await fetchMockListingPaymentsData(listingAddress);
  const emptyData = getEmptyListingPaymentsData();
  const mockCards = buildListingPaymentCards(true, listingAddress, isAdmin);
  const emptyCards = buildListingPaymentCards(false, listingAddress, isAdmin);
  
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
        mockCards={mockCards}
        emptyCards={emptyCards}
        mockData={mockData} 
        emptyData={emptyData}
        isAdmin={isAdmin}
        listingAddress={listingAddress}
      />
    </div>
  );
}