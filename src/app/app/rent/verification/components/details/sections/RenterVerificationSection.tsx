import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const RenterVerificationSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-start gap-3 md:gap-4">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-2 md:gap-4 flex-wrap">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <img src="/logo-small.svg" alt="Home" className="w-[18px] h-[18px] -translate-y-[1px]" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-gray-500 text-sm">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/app/rent/verification"
              className="text-gray-900 text-xs md:text-sm"
            >
              <span className="hidden md:inline">MatchBook Renter Verification</span>
              <span className="md:hidden">Verification</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-gray-500 text-sm">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray-900 text-xs md:text-sm">
              Details
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col items-start gap-1 w-full">
        <h1 className="w-full text-[#373940] text-xl md:text-2xl font-medium">
          Renter Verification Report
        </h1>
        <p className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-xs md:text-sm tracking-[-0.28px] leading-[normal]">
          Detailed verification results for rental screening purposes.
        </p>
      </header>
    </section>
  );
};
