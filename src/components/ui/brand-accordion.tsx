'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
 * BrandAccordionGroup
 * Wraps multiple BrandAccordionItems.
 * ───────────────────────────────────────────── */
const BrandAccordionGroup = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
    title?: string;
    footer?: React.ReactNode;
  }
>(({ className, title, footer, children, ...props }, ref) => (
  <div className={cn('rounded-xl border border-[#eee] overflow-hidden bg-[hsl(var(--background))]', className)}>
    {title && (
      <>
        <h3 className="text-base font-semibold m-0 px-5 pt-[18px] text-[#1a1a1a]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </h3>
        <div className="h-px bg-[#eee] mt-3.5" />
      </>
    )}
    <AccordionPrimitive.Root ref={ref} {...props}>
      {children}
    </AccordionPrimitive.Root>
    {footer}
  </div>
));
BrandAccordionGroup.displayName = 'BrandAccordionGroup';

/* ─────────────────────────────────────────────
 * BrandAccordionItem
 * A single expandable row.
 * ───────────────────────────────────────────── */
const BrandAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[#f0f0f0] last:border-b-0', className)}
    {...props}
  />
));
BrandAccordionItem.displayName = 'BrandAccordionItem';

/* ─────────────────────────────────────────────
 * BrandAccordionTrigger
 * The clickable header row. Pass children for
 * the left side; use `rightContent` for the
 * amount/value on the right.
 * ───────────────────────────────────────────── */
const BrandAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    rightContent?: React.ReactNode;
  }
>(({ className, children, rightContent, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex items-center justify-between w-full px-5 py-4 text-sm bg-transparent cursor-pointer group',
        'border-0 outline-none',
        className
      )}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      {...props}
    >
      <span className="font-medium text-[#1a1a1a]">{children}</span>
      <div className="flex items-center gap-2 text-[#555]">
        {rightContent && (
          <span className="font-semibold text-[#1a1a1a] text-[15px]">{rightContent}</span>
        )}
        <ChevronDown className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
BrandAccordionTrigger.displayName = 'BrandAccordionTrigger';

/* ─────────────────────────────────────────────
 * BrandAccordionContent
 * The expandable detail area.
 * ───────────────────────────────────────────── */
const BrandAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('px-5 pl-9 py-1 pb-3 bg-[#fafafa] border-b border-[#f0f0f0]', className)}>
      {children}
    </div>
  </AccordionPrimitive.Content>
));
BrandAccordionContent.displayName = 'BrandAccordionContent';

/* ─────────────────────────────────────────────
 * BrandAccordionDetailRow
 * A label/amount line inside the content area.
 * ───────────────────────────────────────────── */
function BrandAccordionDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <span className="text-[#666]">{label}</span>
      <span className="font-medium text-[#1a1a1a]">{value}</span>
    </div>
  );
}

export {
  BrandAccordionGroup,
  BrandAccordionItem,
  BrandAccordionTrigger,
  BrandAccordionContent,
  BrandAccordionDetailRow,
};
