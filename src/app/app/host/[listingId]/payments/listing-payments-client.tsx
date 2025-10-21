"use client";

import React from "react";
import { StatisticsCard } from "../../dashboard/overview/statistics-card";
import { DollarSign, AlertTriangle, CreditCard, Shield } from "lucide-react";
import { PaymentsTable } from "../../dashboard/payments/payments-table";

const iconMap = {
  DollarSign,
  AlertTriangle,
  CreditCard,
  Shield,
};

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

interface ListingPaymentsClientProps {
  cards: PaymentCardData[];
  paymentsData: PaymentsData;
}

export default function ListingPaymentsClient({
  cards,
  paymentsData
}: ListingPaymentsClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 grid-cols-2 gap-x-1 gap-y-4 sm:gap-6 lg:flex lg:justify-between">
        {cards.map((card, index) => {
          const IconComponent = iconMap[card.iconName as keyof typeof iconMap];

          return (
            <div key={index} className="min-w-0 lg:flex-1">
              <StatisticsCard
                id={card.id}
                title={card.title}
                value={card.value}
                icon={IconComponent}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                subtitle={card.subtitle}
                asLink={false}
                className="h-full"
              />
            </div>
          );
        })}
      </div>

      <PaymentsTable paymentsData={paymentsData} />
    </div>
  );
}
