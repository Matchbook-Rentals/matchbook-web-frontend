"use client";

import React, { useState } from "react";
import { StatisticsCard } from "../overview/statistics-card";
import { DollarSign, AlertTriangle, CreditCard, Shield, Eye } from "lucide-react";
import { PaymentsTable } from "./payments-table";

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

interface PaymentsClientProps {
  mockCards: PaymentCardData[];
  emptyCards: PaymentCardData[];
  mockData: PaymentsData;
  emptyData: PaymentsData;
  isAdmin: boolean;
}

export default function PaymentsClient({ mockCards, emptyCards, mockData, emptyData, isAdmin }: PaymentsClientProps) {
  const [useMockData, setUseMockData] = useState(false);
  
  // Replace the mock data card with a normal security deposits card for non-admins
  const getCardsForUser = () => {
    if (useMockData) return mockCards;
    
    if (isAdmin) return emptyCards;
    
    // For non-admins, replace the "view-mock-data" card with a security deposits card
    return emptyCards.map(card => 
      card.id === "view-mock-data" 
        ? {
            id: "security-deposits",
            title: "Total Amount of Security Deposits",
            value: "$0",
            iconName: "Shield",
            iconBg: "bg-purple-50",
            iconColor: "text-gray-700",
            subtitle: { text: "this month" },
          }
        : card
    );
  };
  
  const cards = getCardsForUser();
  const currentPaymentsData = useMockData ? mockData : emptyData;
  
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 grid-cols-2 gap-x-1 gap-y-4 sm:gap-6 lg:flex lg:justify-between">
        {cards.map((card, index) => {
          const IconComponent = iconMap[card.iconName as keyof typeof iconMap];
          const isViewMockDataCard = card.id === "view-mock-data";
          const isClickable = !useMockData && isAdmin && isViewMockDataCard;
          
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