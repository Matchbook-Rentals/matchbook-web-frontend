import React from "react";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";

async function fetchReviews() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  return [];
}

export default async function ReviewsPage() {
  const reviews = await fetchReviews();

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle title="All Reviews" subtitle="View and manage reviews from your tenants" />
      <div className="flex-1 space-y-4">
        <p className="text-muted-foreground">
          {reviews.length === 0 ? "No reviews yet." : `${reviews.length} reviews found.`}
        </p>
      </div>
    </div>
  );
}