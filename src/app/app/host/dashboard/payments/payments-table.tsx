"use client";

import { MoreVerticalIcon } from "lucide-react";
import React from "react";
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
import TabSelector from "@/components/ui/tab-selector";

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

interface PaymentsTableProps {
  paymentsData: PaymentsData;
}

export const PaymentsTable = ({ paymentsData }: PaymentsTableProps): JSX.Element => {

  // Column headers
  const headers = [
    { name: "Tenant", width: "w-fit" },
    { name: "Amount", width: "w-fit" },
    { name: "Type", width: "w-fit" },
    { name: "Method", width: "w-fit" },
    { name: "Bank", width: "w-fit" },
    { name: "Due Date", width: "w-fit" },
    { name: "Status", width: "w-fit" },
    { name: "Actions", width: "w-fit" },
  ];

  const renderTable = (data: PaymentTableData[]) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-[#e7f0f0] justify-evenly">
          {headers.map((header, index) => (
            <TableHead
              key={`header-${index}`}
              className={`${header.width} h-11 px-6 py-3 border-b border-[#eaecf0] font-medium text-xs text-[#475467] font-['Poppins',Helvetica]`}
            >
              {header.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={`row-${rowIndex}`} className="justify-evenly">
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full border-[0.75px] border-[#00000014]">
                <AvatarImage src="/avatar-5.png" alt={row.tenant} />
                <AvatarFallback>{row.tenant.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-text-sm-medium text-[#101828] text-sm font-medium leading-5 whitespace-nowrap">
                {row.tenant}
              </span>
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
              ${row.amount}
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
              {row.type}
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
              {row.method}
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
              {row.bank}
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] font-['Inter',Helvetica] font-normal text-[#373940] text-sm leading-5">
              {row.dueDate}
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0]">
              <Badge 
                className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                  row.status === 'Completed' 
                    ? 'bg-green-50 text-green-600 border border-green-200' 
                    : row.status === 'Failed'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : row.status === 'Pending'
                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                    : 'bg-[#e7f0f0] text-[#0b6969] border border-[#3c8787]'
                }`}
              >
                {row.status}
              </Badge>
            </TableCell>
            <TableCell className="w-fit h-[72px] px-6 py-4 border-b border-[#eaecf0] flex justify-center items-center">
              <div className="inline-flex flex-col items-start">
                <MoreVerticalIcon className="w-5 h-5 cursor-pointer hover:text-gray-600" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  // Define tabs for the TabSelector component with different data for each tab
  const tabs = [
    {
      value: "upcoming",
      label: "Upcoming",
      content: renderTable(paymentsData.upcoming),
      textSize: "text-base px-6",
      className: ''
    },
    {
      value: "history", 
      label: "History",
      content: renderTable(paymentsData.history),
      textSize: "text-base px-6",
    },
  ];

  return (
    <div className="flex flex-col w-full  rounded-[20px] overflow-hidden">
      <div className="">
        <TabSelector
          tabs={tabs}
          defaultTab="upcoming"
          selectedTabColor="#0b6969"
          className="justify-start py-0"
          tabsListClassName="justify-start  pt-4 pb-4 px-0 -mx-2"
          tabsClassName="pt-0 px-0"
        />
      </div>
    </div>
  );
};
