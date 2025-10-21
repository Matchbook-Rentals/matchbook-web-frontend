import React from "react";
import PaymentsClient from "./payments-client";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { BrandButton } from "@/components/ui/brandButton";
import { getAllHostPayments } from "@/app/actions/payments";

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

function buildPaymentCards(
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

export default async function PaymentsPage() {
  const { paymentsData, stats } = await getAllHostPayments();

  const cards = buildPaymentCards(
    stats.totalPayments,
    stats.latePayments,
    stats.totalAmount,
    stats.securityDeposits
  );

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
        cards={cards}
        paymentsData={paymentsData}
      />
    </div>
  );
}
