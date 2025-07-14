'use client';
import React from "react";
import { BrandButton } from "@/components/ui/brandButton";

interface ListingCreationSuccessProps {
  isSaveAndExit?: boolean;
}

export default function ListingCreationSuccess({ isSaveAndExit = false }: ListingCreationSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-6">
        {isSaveAndExit ? "Listing Saved Successfully!" : "Listing Created Successfully!"}
      </h2>
      <p className="text-lg mb-8 max-w-lg">
        {isSaveAndExit 
          ? "Your listing has been saved as a draft. You can come back later to finish and submit it for approval."
          : "Our team will review your listing for approval in the next 24 hours. You'll receive a notification once your listing is approved."
        }
      </p>
      <BrandButton 
        href="/app/host/dashboard/listings"
        size="xl"
        className="w-[200px]"
      >
        Go to Host Dashboard
      </BrandButton>
    </div>
  );
}