'use client';

import {
  BrandAccordionGroup,
  BrandAccordionItem,
  BrandAccordionTrigger,
  BrandAccordionContent,
  BrandAccordionDetailRow,
} from '@/components/ui/brand-accordion';

interface PaymentDetail {
  label: string;
  amount: string;
}

interface MonthlyPayment {
  id: string;
  date: string;
  total: string;
  details: PaymentDetail[];
}

interface DueToday {
  total: string;
  details: PaymentDetail[];
}

interface PaymentScheduleProps {
  monthlyPayments: MonthlyPayment[];
  dueToday: DueToday;
  defaultExpandedId?: string;
}

export function PaymentSchedule({ monthlyPayments, dueToday, defaultExpandedId }: PaymentScheduleProps) {
  return (
    <>
      <BrandAccordionGroup
        title="Monthly Rent Payments"
        type="multiple"
        defaultValue={defaultExpandedId ? [defaultExpandedId] : []}
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
      </BrandAccordionGroup>

      {dueToday.details.length > 0 && (
        <BrandAccordionGroup
          type="multiple"
          defaultValue={['due-today']}
          className="mt-4 bg-[#F9F9F9] border-[#eee]"
        >
          <BrandAccordionItem value="due-today">
            <BrandAccordionTrigger rightContent={dueToday.total} className="font-bold">
              <span className="font-bold text-[15px]">Due today</span>
            </BrandAccordionTrigger>
            <BrandAccordionContent className="bg-[#F9F9F9]">
              {dueToday.details.map((d, i) => (
                <BrandAccordionDetailRow key={i} label={d.label} value={d.amount} />
              ))}
            </BrandAccordionContent>
          </BrandAccordionItem>
        </BrandAccordionGroup>
      )}
    </>
  );
}
