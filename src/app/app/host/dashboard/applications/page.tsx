import React from "react";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import HostDashboardApplicationsTab from "../../host-dashboard-applications-tab";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";

export default async function HostDashboardApplicationsPage() {
  console.log('HostDashboardApplicationsPage: Starting data fetch...');

  // Fetch housing requests for applications
  const housingRequests = await getHostHousingRequests();

  console.log('HostDashboardApplicationsPage: Data fetched successfully');
  console.log('- housingRequests count:', housingRequests.length);

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle title="All Applications" subtitle="Applications for all of your properties" />
      <HostDashboardApplicationsTab housingRequests={housingRequests} />
    </div>
  );
}
