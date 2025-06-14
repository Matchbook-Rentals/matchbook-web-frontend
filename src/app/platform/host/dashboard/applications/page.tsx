import React from "react";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import HostDashboardApplicationsTab from "../../host-dashboard-applications-tab";

export default async function HostDashboardApplicationsPage() {
  console.log('HostDashboardApplicationsPage: Starting data fetch...');
  
  // Fetch housing requests for applications
  const housingRequests = await getHostHousingRequests();

  console.log('HostDashboardApplicationsPage: Data fetched successfully');
  console.log('- housingRequests count:', housingRequests.length);

  return (
    <HostDashboardApplicationsTab housingRequests={housingRequests} />
  );
}