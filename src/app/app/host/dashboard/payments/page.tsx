import React from "react";
import PaymentsClient from "./payments-client";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { BrandButton } from "@/components/ui/brandButton";
import { auth } from "@clerk/nextjs/server";

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

async function fetchMockPaymentsData(): Promise<PaymentsData> {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock payment data separated by upcoming and history
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
      {
        tenant: "Emma Davis",
        amount: "1,500.00",
        type: "Security Deposit Return",
        method: "Check",
        bank: "Chase",
        dueDate: "02/10/2025",
        status: "Pending",
      },
      {
        tenant: "James Wilson",
        amount: "2,750.00",
        type: "Rent",
        method: "Bank Transfer",
        bank: "CitiBank",
        dueDate: "02/15/2025",
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
      {
        tenant: "Anna Garcia",
        amount: "2,100.00",
        type: "Rent",
        method: "Bank Transfer",
        bank: "Wells Fargo",
        dueDate: "12/15/2024",
        status: "Completed",
      },
      {
        tenant: "David Brown",
        amount: "1,750.00",
        type: "Late Fee",
        method: "Credit Card",
        bank: "American Express",
        dueDate: "12/20/2024",
        status: "Failed",
      },
      {
        tenant: "Jennifer Lee",
        amount: "2,450.00",
        type: "Rent",
        method: "Bank Transfer",
        bank: "Bank of America",
        dueDate: "12/01/2024",
        status: "Completed",
      },
    ],
  };
}

function getEmptyPaymentsData(): PaymentsData {
  return {
    upcoming: [],
    history: [],
  };
}

function buildPaymentCards(useMockData: boolean, isAdmin: boolean) {
  if (useMockData) {
    return [
      {
        id: "total-payments",
        title: "Total Payments",
        value: "24",
        iconName: "CreditCard",
        iconBg: "bg-blue-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "late-payments",
        title: "Late Payments",
        value: "3",
        iconName: "AlertTriangle",
        iconBg: "bg-red-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "total-amount",
        title: "Total Amount of Payments",
        value: "$5,000",
        iconName: "DollarSign",
        iconBg: "bg-green-50",
        iconColor: "text-gray-700",
        subtitle: { text: "this month" },
      },
      {
        id: "security-deposits",
        title: "Total Amount of Security Deposits",
        value: "$3,500",
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

export default async function PaymentsPage() {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  
  const mockData = await fetchMockPaymentsData();
  const emptyData = getEmptyPaymentsData();
  const mockCards = buildPaymentCards(true, isAdmin);
  const emptyCards = buildPaymentCards(false, isAdmin);

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle 
        title="All Payments" 
        subtitle="Manage payments and financial data for your properties"
        rightContent={
          <BrandButton
            href="/app/host/dashboard/payments/stripe"
            size="sm"
          >
            Manage Settings
          </BrandButton>
        }
      />
      <PaymentsClient 
        mockCards={mockCards}
        emptyCards={emptyCards}
        mockData={mockData} 
        emptyData={emptyData}
        isAdmin={isAdmin}
      />
    </div>
  );
}
