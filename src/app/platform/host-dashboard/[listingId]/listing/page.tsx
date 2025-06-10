"use client";

import React from "react";
import SummaryTab from '../(tabs)/summary-tab';
import { useListingDashboard } from '../listing-dashboard-context';

export default function ListingPage() {
  const { data } = useListingDashboard();
  
  return (
    <SummaryTab listing={data.listing} />
  );
}