import { HomeIcon } from "lucide-react";
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
    <section className="flex flex-col w-full items-start gap-4">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-4">
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center">
              <HomeIcon className="w-6 h-6" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="font-text-md-regular font-[number:var(--text-md-regular-font-weight)] text-gray-500 text-[length:var(--text-md-regular-font-size)] tracking-[var(--text-md-regular-letter-spacing)] leading-[var(--text-md-regular-line-height)] [font-style:var(--text-md-regular-font-style)]">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/app/rent/verification"
              className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]"
            >
              MatchBook Renter Verification
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="font-text-md-regular font-[number:var(--text-md-regular-font-weight)] text-gray-500 text-[length:var(--text-md-regular-font-size)] tracking-[var(--text-md-regular-letter-spacing)] leading-[var(--text-md-regular-line-height)] [font-style:var(--text-md-regular-font-style)]">
            /
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-text-label-medium-regular font-[number:var(--text-label-medium-regular-font-weight)] text-gray-900 text-[length:var(--text-label-medium-regular-font-size)] tracking-[var(--text-label-medium-regular-letter-spacing)] leading-[var(--text-label-medium-regular-line-height)] [font-style:var(--text-label-medium-regular-font-style)]">
              Details
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col items-start gap-1 w-full">
        <h1 className="w-full font-text-heading-medium-medium font-[number:var(--text-heading-medium-medium-font-weight)] text-[#373940] text-[length:var(--text-heading-medium-medium-font-size)] tracking-[var(--text-heading-medium-medium-letter-spacing)] leading-[var(--text-heading-medium-medium-line-height)] [font-style:var(--text-heading-medium-medium-font-style)]">
          Renter Verification Report
        </h1>
        <p className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#5d606d] text-sm tracking-[-0.28px] leading-[normal]">
          Detailed verification results for rental screening purposes.
        </p>
      </header>
    </section>
  );
};
