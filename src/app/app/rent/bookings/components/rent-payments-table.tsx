"use client";

import { MoreVerticalIcon } from "lucide-react";
import React, { useState } from "react";
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
import TabSelector from "@/components/ui/tab-selector";
import PaymentModificationReviewModal from "@/components/PaymentModificationReviewModal";

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

interface RentPaymentsTableProps {
  paymentsData: RentPaymentsData;
  hostName: string;
  hostAvatar?: string;
  bookingId: string;
}

export const RentPaymentsTable = ({ 
  paymentsData, 
  hostName, 
  hostAvatar,
  bookingId
}: RentPaymentsTableProps): JSX.Element => {
  const router = useRouter();
  const [selectedModification, setSelectedModification] = useState<RentPaymentData['modificationData'] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Column headers with responsive visibility classes
  const headers = [
    { name: "Host", width: "w-fit", className: "" }, // Always visible
    { name: "Amount", width: "w-fit", className: "" }, // Always visible
    { name: "Type", width: "w-fit", className: "hidden xl:table-cell" }, // Hidden below xl
    { name: "Method", width: "w-fit", className: "hidden lg:table-cell" }, // Hidden below lg
    { name: "Bank", width: "w-fit", className: "hidden md:table-cell" }, // Hidden below md
    { name: "Due Date", width: "w-fit", className: "hidden 2xl:table-cell" }, // Hidden below 2xl
    { name: "Status", width: "w-fit", className: "hidden xl:table-cell" }, // Hidden below xl
    { name: "Actions", width: "w-fit", className: "" }, // Always visible
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
                      : row.status === 'Failed' || row.status === 'Overdue'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : row.status === 'Pending' || row.status === 'Due'
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : 'bg-[#e7f0f0] text-[#0b6969] border border-[#3c8787]'
                  }`}
                >
                  {row.status}
                </Badge>
              </TableCell>
              {/* Actions - Always visible */}
              <TableCell className="w-fit h-[72px] px-2 sm:px-6 py-4 flex justify-center items-center">
                {row.hasPendingModification && row.modificationData ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="inline-flex flex-col items-start relative cursor-pointer">
                        <MoreVerticalIcon className="w-5 h-5 hover:text-gray-600" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
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
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="inline-flex flex-col items-start relative">
                    <MoreVerticalIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  // Define tabs for the TabSelector component with different data for each tab
  const tabs = [
    {
      value: "upcoming",
      label: "Upcoming Payments",
      content: renderTable(paymentsData.upcoming),
      textSize: "text-base px-6",
      className: ''
    },
    {
      value: "past", 
      label: "Past Payments",
      content: renderTable(paymentsData.past),
      textSize: "text-base px-6",
    },
  ];

  const handleModificationProcessed = () => {
    setIsModalOpen(false);
    setSelectedModification(null);
    setRefreshKey(prev => prev + 1);
    // Optionally trigger a page refresh or data refetch here
    window.location.reload();
  };

  return (
    <>
      <div className="flex flex-col w-full rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
        </div>
        <div className="p-0">
          <TabSelector
            tabs={tabs}
            defaultTab="upcoming"
            selectedTabColor="#0b6969"
            className="justify-start py-0"
            tabsListClassName="justify-between w-full md:justify-start pt-4 pb-4 px-6 "
            tabsClassName="pt-0 px-0"
          />
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