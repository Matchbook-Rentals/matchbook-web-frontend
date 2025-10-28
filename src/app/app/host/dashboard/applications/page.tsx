import React from "react";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import { getHostUserData } from "@/app/actions/user";
import { auth } from "@clerk/nextjs/server";
import HostDashboardApplicationsTab from "../../host-dashboard-applications-tab";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { OnboardingChecklistCard } from "../../components/onboarding-checklist-card";

// Force dynamic rendering to ensure fresh Stripe status on every page load
export const dynamic = 'force-dynamic';

export default async function HostDashboardApplicationsPage() {
  console.log('HostDashboardApplicationsPage: Starting data fetch...');

  // Check host onboarding requirements
  // See docs/host-onboarding-requirements.md for detailed requirements documentation
  const { sessionClaims } = await auth();
  const isAdminDev = sessionClaims?.metadata?.role === 'admin_dev';

  // Get host user data to pass to child components
  const hostUserData = await getHostUserData();

  // Fetch housing requests for applications
  const housingRequests = await getHostHousingRequests();

  console.log('HostDashboardApplicationsPage: Data fetched successfully');
  console.log('- housingRequests count:', housingRequests.length);

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle title="All Applications" subtitle="Applications for all of your properties" />
      <HostDashboardApplicationsTab
        housingRequests={housingRequests}
        hostUserData={hostUserData}
        isAdminDev={isAdminDev}
      />
    </div>
  );
}
