import React from "react";
import { notFound } from 'next/navigation';
import { getListingById } from '@/app/actions/listings';
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { MoveIn } from "./move-in-client";

interface MoveInSetupPageProps {
  params: { listingId: string };
}

export default async function MoveInSetupPage({ params }: MoveInSetupPageProps) {
  const { listingId } = params;

  // Fetch the listing data at the page level
  const listing = await getListingById(listingId);

  if (!listing) {
    return notFound();
  }

  return (
    <div className={HOST_PAGE_STYLE}>
      <MoveIn listing={listing} />
    </div>
  );
}