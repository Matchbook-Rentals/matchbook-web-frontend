"use client";

import { MoreVerticalIcon, PlusIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

interface RentPaymentData {
  amount: string;
  type: string;
  method: string;
  bank: string;
  dueDate: string;
  status: string;
  paymentId: string;
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

interface TablelessPaymentsTableProps {
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

export const TablelessPaymentsTable = ({ 
  paymentsData, 
  hostName, 
  hostAvatar,
  bookingId,
  initialPaymentMethods
}: TablelessPaymentsTableProps): JSX.Element => {
  const router = useRouter();
  const [selectedModification, setSelectedModification] = useState<RentPaymentData['modificationData'] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);

  // Combine and sort all payments chronologically by due date
  const allPayments = useMemo(() => {
    const parseDate = (dateStr: string): Date => {
      const [month, day, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const combined = [...paymentsData.upcoming, ...paymentsData.past];
    return combined.sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime());
  }, [paymentsData]);

  // Column headers with responsive visibility classes
  const headers = [
    { name: "Host", width: "w-fit", className: "" },
    { name: "Amount", width: "w-fit", className: "" },
    { name: "Type", width: "w-fit", className: "hidden xl:table-cell" },
    { name: "Method", width: "w-fit", className: "hidden lg:table-cell" },
    { name: "Bank", width: "w-fit", className: "hidden md:table-cell" },
    { name: "Due Date", width: "w-fit", className: "hidden 2xl:table-cell" },
    { name: "Status", width: "w-fit", className: "hidden xl:table-cell" },
    { name: "Actions", width: "w-fit", className: "" },
  ];

  const renderTable = (data: RentPaymentData[]) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#e7f0f0] justify-evenly">
          {headers.map((header, index) => (
            <TableHead
              key={`header-${index}`}
              className={`${header.width} ${header.className} h-11 px-2 sm:px-6 py-3 font-medium text-xs text-[#475467] font-['Poppins',Helvetica]`}
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
              {/* Host - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 sm:px-6 py-4 flex items-center gap-2 sm:gap-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[0.75px] border-[#00000014]">
                  <AvatarImage src={hostAvatar || "/avatar-5.png"} alt={hostName} />
                  <AvatarFallback>{hostName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-text-sm-medium text-[#101828] text-sm font-medium leading-5 max-w-[120px] sm:max-w-none truncate">
                  {hostName}
                </span>
              </TableCell>
              {/* Amount - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 sm:px-6 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                ${row.amount}
              </TableCell>
              {/* Type - Hidden below xl */}
              <TableCell className="hidden xl:table-cell w-fit h-[72px] px-6 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.type}
              </TableCell>
              {/* Method - Hidden below lg */}
              <TableCell className="hidden lg:table-cell w-fit h-[72px] px-6 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.method}
              </TableCell>
              {/* Bank - Hidden below md */}
              <TableCell className="hidden md:table-cell w-fit h-[72px] px-6 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.bank}
              </TableCell>
              {/* Due Date - Hidden below 2xl */}
              <TableCell className="hidden 2xl:table-cell w-fit h-[72px] px-6 py-4 font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
                {row.dueDate}
              </TableCell>
              {/* Status - Hidden below xl */}
              <TableCell className="hidden xl:table-cell w-fit h-[72px] px-6 py-4">
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
              <TableCell className="w-fit h-[72px] px-2 sm:px-6 py-4 flex justify-center items-center">
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
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        router.push(`/app/rent/bookings/${bookingId}/payments/${row.paymentId}/change-method`);
                      }}
                    >
                      Change Payment Method
                    </Button>
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
    window.location.reload();
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
    </>
  );
};
