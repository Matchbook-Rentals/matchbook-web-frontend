"use client";

import React from "react";
import { useListingDashboard } from '../listing-dashboard-context';

export default function ReviewsPage() {
  const { data } = useListingDashboard();
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>
      <p className="text-gray-600">Reviews for {data.listing.title} coming soon...</p>
    </div>
  );
}