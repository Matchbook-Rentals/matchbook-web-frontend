"use client";

import React, { useState } from "react";
import { StatisticsCard } from "../../dashboard/overview/statistics-card";
import { DollarSign, AlertTriangle, CreditCard, Shield, Eye } from "lucide-react";
import { PaymentsTable } from "../../dashboard/payments/payments-table";

const iconMap = {
  DollarSign,
  AlertTriangle,
  CreditCard,
  Shield,
  Eye,
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
  mockCards: PaymentCardData[];
  emptyCards: PaymentCardData[];
  mockData: PaymentsData;
  emptyData: PaymentsData;
  isAdmin: boolean;
  listingAddress: string;
}

export default function ListingPaymentsClient({ 
  mockCards, 
  emptyCards, 
  mockData, 
  emptyData, 
  isAdmin,
  listingAddress
}: ListingPaymentsClientProps) {
  const [useMockData, setUseMockData] = useState(false);
  
  const cards = useMockData ? mockCards : emptyCards;
  const currentPaymentsData = useMockData ? mockData : emptyData;
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between gap-6">
        {cards.map((card, index) => {
          const IconComponent = iconMap[card.iconName as keyof typeof iconMap];
          const isViewMockDataCard = card.id === "view-mock-data";
          const isClickable = !useMockData && isAdmin && isViewMockDataCard;
          
          return (
            <div key={index} className="flex-1 min-w-[300px]">
              <StatisticsCard
                id={card.id}
                title={card.title}
                value={card.value}
                icon={IconComponent}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                subtitle={card.subtitle}
                asLink={false}
                className={`h-full ${isClickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                onClick={isClickable ? () => setUseMockData(true) : undefined}
              />
            </div>
          );
        })}
      </div>
      
      <PaymentsTable paymentsData={currentPaymentsData} />
    </div>
  );
}