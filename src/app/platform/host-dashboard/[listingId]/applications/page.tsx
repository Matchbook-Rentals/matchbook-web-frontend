"use client";

import React from "react";
import ApplicationsTab from '../(tabs)/host-applications-tab';
import { useListingDashboard } from '../listing-dashboard-context';

export default function ApplicationsPage() {
  const { data } = useListingDashboard();
  
  return (
    <ApplicationsTab listing={data.listing} housingRequests={data.housingRequests} />
  );
}