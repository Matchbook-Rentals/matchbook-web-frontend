"use client";

import React from "react";
import { StatisticsCard } from "../overview/statistics-card";
import { DollarSign, AlertTriangle, CreditCard, Shield } from "lucide-react";
import { PaymentsTable } from "./payments-table";

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

interface PaymentsClientProps {
  cards: PaymentCardData[];
}

export default function PaymentsClient({ cards }: PaymentsClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between gap-6">
        {cards.map((card, index) => {
          const IconComponent = iconMap[card.iconName as keyof typeof iconMap];
          
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
                className="h-full"
              />
            </div>
          );
        })}
      </div>
      
      <PaymentsTable />
    </div>
  );
}