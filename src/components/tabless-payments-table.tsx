"use client";

import { MoreVerticalIcon, PlusIcon, Loader2, CreditCard, Building2 } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { retryPaymentNow } from "@/app/actions/payments";
import { calculateCreditCardFee } from "@/lib/fee-constants";
import { BrandCheckbox } from "@/app/brandCheckbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PaymentModificationReviewModal from "@/components/PaymentModificationReviewModal";
import { PaymentMethodsSection } from "@/components/payment-review/sections/PaymentMethodsSection";
import { AddPaymentMethodInline } from "@/components/stripe/add-payment-method-inline";
import BrandModal from "@/components/BrandModal";
import { BrandButton } from "@/components/ui/brandButton";

interface RentPaymentData {
  amount: string;
  type: string;
  method: string;
  bank: string;
  lastFour?: string;
  dueDate: string;
  status: string;
  paymentId: string;
  baseAmountCents?: number;
  hasCardFee?: boolean;
  cardFeeAmountCents?: number;
  hasPendingModification?: boolean;
  pendingModificationCount?: number;
  modificationData?: {
    id: string;
    requestorName: string;
    requestorImage: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImage: string;
    originalAmount: string;
    originalDueDate: string;
    newAmount: string;
    newDueDate: string;
    reason: string | null;
    requestedAt: string;
    bookingId: string;
  };
}

interface RentPaymentsData {
  upcoming: RentPaymentData[];
  past: RentPaymentData[];
}

interface TablessPaymentsTableProps {
  paymentsData: RentPaymentsData;
  hostName: string;
  hostAvatar?: string;
  bookingId: string;
  initialPaymentMethods?: Array<{
    id: string;
    type: 'card' | 'bank';
    brand?: string;
    lastFour: string;
    expiry?: string;
    bankName?: string;
  }>;
}

export const TablessPaymentsTable = ({ 
  paymentsData, 
  hostName, 
  hostAvatar,
  bookingId,
  initialPaymentMethods
}: TablessPaymentsTableProps): JSX.Element => {
  const router = useRouter();
  const [selectedModification, setSelectedModification] = useState<RentPaymentData['modificationData'] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [payingNowId, setPayingNowId] = useState<string | null>(null);
  const [confirmPayment, setConfirmPayment] = useState<RentPaymentData | null>(null);
  const [assignMethodPayment, setAssignMethodPayment] = useState<RentPaymentData | null>(null);
  const [assigningMethodId, setAssigningMethodId] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState(true);

  // Build display label for a payment method from props
  const buildMethodLabel = (pm: { type: string; brand?: string; lastFour?: string; bankName?: string }) => {
    if (pm.type === 'card') {
      const brand = pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Card';
      return `${brand} ••••${pm.lastFour || '????'}`;
    }
    const bankName = pm.bankName || 'Bank';
    return `${bankName} ••••${pm.lastFour || '????'}`;
  };
  // Local overrides for payment method display after assignment (avoids full refresh)
  const [methodOverrides, setMethodOverrides] = useState<Record<string, { method: string; bank: string; amount?: string; hasCardFee?: boolean; cardFeeAmountCents?: number }>>({});

  // Combine and sort all payments chronologically by due date
  const allPayments = useMemo(() => {
    const combined = [...paymentsData.upcoming, ...paymentsData.past];
    return combined
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map((p) => methodOverrides[p.paymentId] ? { ...p, ...methodOverrides[p.paymentId] } : p);
  }, [paymentsData, methodOverrides]);

  // Column headers with responsive visibility classes
  const headers = [
    { name: "Host", width: "w-fit", className: "hidden sm:table-cell" },
    { name: "Amount", width: "w-fit", className: "" },
    { name: "Type", width: "w-fit", className: "hidden lg:table-cell" },
    { name: "Payment Method", width: "w-fit", className: "hidden md:table-cell" },
    { name: "Due Date", width: "w-fit", className: "" },
    { name: "Status", width: "w-fit", className: "" },
    { name: "Actions", width: "w-fit", className: "" },
  ];

  const renderTable = (data: RentPaymentData[]) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#e7f0f0] justify-evenly">
          {headers.map((header, index) => (
            <TableHead
              key={`header-${index}`}
              className={`${header.width} ${header.className} h-11 px-2 py-3 font-medium text-xs text-[#475467] font-['Poppins',Helvetica]`}
            >
              {header.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={headers.length} className="text-center py-8 text-gray-500">
              No payments found
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`} className="justify-evenly border-b border-[#eaecf0]">
              {/* Host - Hidden below sm */}
              <TableCell className="hidden sm:table-cell w-fit h-[72px] px-2 py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[0.75px] border-[#00000014]">
                    <AvatarImage src={hostAvatar || "/avatar-5.png"} alt={hostName} />
                    <AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-text-sm-medium text-[#101828] text-sm font-medium leading-5 max-w-[120px] sm:max-w-none truncate">
                    {hostName}
                  </span>
                </div>
              </TableCell>
              {/* Amount - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                ${row.amount}
              </TableCell>
              {/* Type - Hidden below lg */}
              <TableCell className="hidden lg:table-cell w-fit h-[72px] px-2 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.type}
              </TableCell>
              {/* Payment Method - Hidden below md */}
              <TableCell className="hidden md:table-cell w-fit h-[72px] px-2 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.bank}
              </TableCell>
              {/* Due Date - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.dueDate}
              </TableCell>
              {/* Status - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 py-4">
                <Badge
                  className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                    row.status === 'Completed' || row.status === 'Paid'
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : row.status === 'Failed' || row.status === 'Overdue' || row.status === 'Move-In Failed'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : row.status === 'Scheduled' || row.status === 'Pending Move-In'
                      ? 'bg-[#e7f0f0] text-[#0b6969] border border-[#3c8787]'
                      : row.status === 'Due' || row.status === 'Processing'
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {row.status}
                </Badge>
              </TableCell>
              {/* Actions - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 py-4 flex justify-center items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-8 w-8"
                      aria-label="Payment actions"
                    >
                      <MoreVerticalIcon className="w-5 h-5" />
                      {row.hasPendingModification && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" aria-hidden="true"></div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    {row.hasPendingModification && row.modificationData && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setSelectedModification(row.modificationData!);
                          setIsModalOpen(true);
                        }}
                      >
                        View Modification
                      </Button>
                    )}
                    {row.method === 'Not Set' ? (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setAssignMethodPayment(row);
                        }}
                      >
                        Add Payment Method
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={() => {
                            setAssignMethodPayment(row);
                          }}
                        >
                          Change Payment Method
                        </Button>
                        {(row.status === 'Failed' || row.status === 'Overdue' || row.status === 'Due') && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-sm"
                            onClick={() => setConfirmPayment(row)}
                          >
                            Pay Now
                          </Button>
                        )}
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const handleModificationProcessed = () => {
    setIsModalOpen(false);
    setSelectedModification(null);
    setRefreshKey(prev => prev + 1);
    router.refresh();
  };

  const handleSelectPaymentMethod = (methodId: string, methodType: 'card' | 'bank') => {
    setSelectedPaymentMethod(methodId);
  };

  const handleProceedToPayment = (includeCardFee: boolean) => {
    console.log('Payment method selected:', selectedPaymentMethod);
  };

  return (
    <>
      <div className="flex flex-col w-full rounded-lg overflow-hidden">
        <div className="flex flex-col w-full">
          {/* Payment Methods Accordion - closed by default */}
          <Accordion type="single" collapsible className="border-b border-gray-100">
            <AccordionItem value="payment-methods" className="border-0">
              <div className="flex items-center justify-between px-0 py-3">
                <AccordionTrigger className="hover:no-underline font-['Poppins'] font-medium text-[14px] leading-5 w-auto p-0 gap-1.5" style={{ color: '#0D1B2A' }}>
                  Payment Methods
                </AccordionTrigger>
              </div>
              <AccordionContent className="px-0 pb-4">
                <PaymentMethodsSection
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={handleSelectPaymentMethod}
                  onProceedToPayment={handleProceedToPayment}
                  isProcessing={false}
                  hidePaymentMethods={false}
                  initialPaymentMethods={initialPaymentMethods}
                  hideHeader={true}
                  onPaymentMethodsRefresh={() => {
                    // This callback enables the window.refreshPaymentMethods function
                  }}
                />

                {!showAddPaymentForm && (
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 h-auto p-0 font-normal mt-4"
                    onClick={() => {
                      setShowAddPaymentForm(true);
                      setTimeout(() => {
                        window.scrollTo({ 
                          top: document.body.scrollHeight, 
                          behavior: 'smooth' 
                        });
                      }, 100);
                    }}
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-teal-600 flex items-center justify-center">
                      <PlusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    Add New Payment Method
                  </Button>
                )}

                {showAddPaymentForm && (
                  <div className="mt-4 min-h-[600px]">
                    <AddPaymentMethodInline
                      onSuccess={() => {
                        setShowAddPaymentForm(false);
                        if (window.refreshPaymentMethods) {
                          window.refreshPaymentMethods();
                        }
                      }}
                      onCancel={() => setShowAddPaymentForm(false)}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Payment Schedule Accordion - open by default */}
          <Accordion type="single" collapsible defaultValue="payment-schedule" className="border-b border-gray-100">
            <AccordionItem value="payment-schedule" className="border-0">
              <div className="flex items-center justify-between px-0 py-3">
                <AccordionTrigger className="hover:no-underline font-['Poppins'] font-medium text-[14px] leading-5 w-auto p-0 gap-1.5" style={{ color: '#0D1B2A' }}>
                  Payment Schedule
                </AccordionTrigger>
              </div>
              <AccordionContent className="px-0 pb-4">
                {renderTable(allPayments)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {selectedModification && (
        <PaymentModificationReviewModal
          data={selectedModification}
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onModificationProcessed={handleModificationProcessed}
        />
      )}

      <BrandModal
        isOpen={!!confirmPayment}
        onOpenChange={(open) => { if (!open) setConfirmPayment(null); }}
        className="max-w-md"
      >
        {confirmPayment && (
          <div className="p-6 flex flex-col gap-4">
            <h2 className="font-['Poppins'] font-semibold text-lg text-[#0D1B2A]">Confirm Payment</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-medium text-[#0D1B2A]">${confirmPayment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-medium text-[#0D1B2A]">{confirmPayment.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date</span>
                <span className="font-medium text-[#0D1B2A]">{confirmPayment.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-medium text-[#0D1B2A]">{confirmPayment.bank}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!!payingNowId}
                onClick={() => setConfirmPayment(null)}
              >
                Cancel
              </Button>
              <BrandButton
                className="flex-1"
                disabled={!!payingNowId}
                onClick={async () => {
                  setPayingNowId(confirmPayment.paymentId);
                  const result = await retryPaymentNow(confirmPayment.paymentId);
                  setPayingNowId(null);
                  if (result.success) {
                    setConfirmPayment(null);
                    router.refresh();
                  } else {
                    alert(result.error || 'Payment failed');
                  }
                }}
              >
                {payingNowId ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  'Pay Now'
                )}
              </BrandButton>
            </div>
          </div>
        )}
      </BrandModal>

      <BrandModal
        isOpen={!!assignMethodPayment}
        onOpenChange={(open) => { if (!open) setAssignMethodPayment(null); }}
        className="max-w-md"
      >
        {assignMethodPayment && (
          <div className="p-6 flex flex-col gap-4">
            <h2 className="font-['Poppins'] font-semibold text-lg text-[#0D1B2A]">Select Payment Method</h2>
            <p className="text-sm text-gray-500">
              Choose a payment method for your ${assignMethodPayment.amount} {assignMethodPayment.type.toLowerCase()} payment due {assignMethodPayment.dueDate}.
            </p>

            {initialPaymentMethods && initialPaymentMethods.length > 0 && (
              <div className="flex flex-col gap-2">
                {initialPaymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    disabled={!!assigningMethodId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#0b6969] hover:bg-[#e7f0f0]/30 transition-colors text-left"
                    onClick={async () => {
                      setAssigningMethodId(pm.id);
                      try {
                        const res = await fetch(`/api/rent-payments/${assignMethodPayment.paymentId}/update-payment-method`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ paymentMethodId: pm.id, applyToAll, bookingId }),
                        });
                        if (!res.ok) throw new Error('Failed to update');
                        const data = await res.json();
                        const newAmount = data.payment?.totalAmount
                          ? (data.payment.totalAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : undefined;
                        setMethodOverrides((prev) => ({
                          ...prev,
                          [assignMethodPayment.paymentId]: {
                            method: pm.type === 'card' ? 'Card' : 'ACH Transfer',
                            bank: buildMethodLabel(pm),
                            amount: newAmount,
                            hasCardFee: data.payment?.hasCardFee,
                            cardFeeAmountCents: data.payment?.cardFeeAmount,
                          },
                        }));
                        setAssignMethodPayment(null);
                        if (applyToAll) router.refresh();
                      } catch {
                        alert('Failed to assign payment method. Please try again.');
                      } finally {
                        setAssigningMethodId(null);
                      }
                    }}
                  >
                    {assigningMethodId === pm.id ? (
                      <Loader2 className="w-5 h-5 text-[#0b6969] shrink-0 animate-spin" />
                    ) : pm.type === 'card' ? (
                      <CreditCard className="w-5 h-5 text-gray-600 shrink-0" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-600 shrink-0" />
                    )}
                    <div className="flex flex-col flex-1">
                      <span className="font-medium text-sm text-gray-800">
                        {buildMethodLabel(pm)}
                      </span>
                      {pm.expiry && <span className="text-xs text-gray-500">Expires {pm.expiry}</span>}
                      {pm.type === 'card' && !assignMethodPayment.hasCardFee && assignMethodPayment.baseAmountCents && (
                        <span className="text-xs text-amber-600 mt-0.5">
                          +${(calculateCreditCardFee(assignMethodPayment.baseAmountCents / 100)).toFixed(2)} card fee
                        </span>
                      )}
                      {pm.type !== 'card' && assignMethodPayment.hasCardFee && assignMethodPayment.cardFeeAmountCents && (
                        <span className="text-xs text-green-600 mt-0.5">
                          -${(assignMethodPayment.cardFeeAmountCents / 100).toFixed(2)} card fee removed
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-1">
              <BrandCheckbox
                name="apply-to-all"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                label="Apply to all future payments"
              />
            </div>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setAssignMethodPayment(null)}
            >
              Cancel
            </Button>
          </div>
        )}
      </BrandModal>
    </>
  );
};
