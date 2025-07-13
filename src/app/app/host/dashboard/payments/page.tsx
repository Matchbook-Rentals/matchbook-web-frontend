import React from "react";
import PaymentsClient from "./payments-client";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { BrandButton } from "@/components/ui/brandButton";

function buildPaymentCards() {
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

export default function PaymentsPage() {
  const cards = buildPaymentCards();

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle 
        title="All Payments" 
        subtitle="Manage payments and financial data for your properties"
        rightContent={
          <BrandButton
            href="/app/stripe/onboarding"
            disabled={true}
            spinOnClick={true}
            size="sm"
          >
            Manage Settings
          </BrandButton>
        }
      />
      <PaymentsClient cards={cards} />
    </div>
  );
}
