'use client';

import {
  BrandAccordionGroup,
  BrandAccordionItem,
  BrandAccordionTrigger,
  BrandAccordionContent,
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
  /** Label for the bottom totals row (e.g. "Due today" vs "Paid today" for receipts) */
  dueTodayLabel?: string;
  /** Override the section header for the monthly payments list */
  monthlyPaymentsLabel?: string;
}

/* ── Text Styles ── */
// "Monthly Rent Payments" header, "Due today" header — 20px, 500
const sectionHeaderTextStyle = "font-['Poppins'] text-xl font-medium leading-[150%] text-[#1a1a1a]";
// Line item labels — 18px, 400, lighter color
const paymentLineItemTextStyle = "font-['Poppins'] text-lg font-normal leading-[120%] text-[#545454]";
// Dollar amounts on accordion controls & subtotals — 18px, 600
const payAmountSubTotalTextStyle = "font-['Poppins'] text-lg font-semibold leading-[120%] text-[#333]";

const contentStyle = "bg-white border-b-0 !pl-5 !gap-y-6 flex flex-col";

function DetailRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex px-8 justify-between items-end self-stretch">
      <span className={paymentLineItemTextStyle}>{label}</span>
      <span className={bold ? payAmountSubTotalTextStyle : paymentLineItemTextStyle}>{value}</span>
    </div>
  );
}

export function PaymentSchedule({
  monthlyPayments,
  dueToday,
  defaultExpandedId,
  dueTodayLabel = 'Due today',
  monthlyPaymentsLabel = 'Monthly Rent Payments',
}: PaymentScheduleProps) {
  return (
    <div className="rounded-lg bg-white">
      <BrandAccordionGroup
          type="multiple"
          defaultValue={['due-today']}
          className="border-0 rounded-none bg-transparent"
        >
          <BrandAccordionItem value="due-today" className="border-b-0">
            <BrandAccordionTrigger
              rightContent={<span className={sectionHeaderTextStyle}>{dueToday.total}</span>}
              className={`${sectionHeaderTextStyle} h-[50px] rounded-lg bg-[#F9F9F9]`}
            >
              {dueTodayLabel}
            </BrandAccordionTrigger>
            <BrandAccordionContent className={`${contentStyle} pt-4`}>
              {dueToday.details.map((d, i) => (
                <DetailRow key={i} label={d.label} value={d.amount} bold />
              ))}
            </BrandAccordionContent>
          </BrandAccordionItem>
        </BrandAccordionGroup>

      <div className="flex h-[50px] px-5 justify-between items-center self-stretch rounded-lg bg-[#F9F9F9]">
        <h3 className={`${sectionHeaderTextStyle} m-0`}>
          {monthlyPaymentsLabel}
        </h3>
      </div>

      <BrandAccordionGroup
        type="multiple"
        defaultValue={monthlyPayments.map((p) => p.id)}
        className="border-0 rounded-none bg-transparent"
      >
        {monthlyPayments.map((payment) => (
          <BrandAccordionItem key={payment.id} value={payment.id} className="border-b-0">
            <BrandAccordionTrigger
              rightContent={<span className={payAmountSubTotalTextStyle}>{payment.total}</span>}
              className={paymentLineItemTextStyle}
            >
              {payment.date}
            </BrandAccordionTrigger>
            <BrandAccordionContent className={contentStyle}>
              {payment.details.map((d, i) => (
                <DetailRow key={i} label={d.label} value={d.amount} />
              ))}
            </BrandAccordionContent>
          </BrandAccordionItem>
        ))}
      </BrandAccordionGroup>
    </div>
  );
}
