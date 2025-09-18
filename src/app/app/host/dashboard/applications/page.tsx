import React from "react";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import { getHostUserData } from "@/app/actions/user";
import { auth } from "@clerk/nextjs/server";
import HostDashboardApplicationsTab from "../../host-dashboard-applications-tab";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";
import { OnboardingChecklistCard } from "../../components/onboarding-checklist-card";

export default async function HostDashboardApplicationsPage() {
  console.log('HostDashboardApplicationsPage: Starting data fetch...');

  // Check host onboarding requirements 
  // See host-onboarding-requirements.md for detailed requirements documentation
  const { sessionClaims } = await auth();
  const isAdminDev = sessionClaims?.metadata?.role === 'admin_dev';
  
  // Get host user data to check onboarding completion
  const hostUserData = await getHostUserData();
  
  // Check if host onboarding is complete
  const isOnboardingComplete = (userData: typeof hostUserData): boolean => {
    if (!userData) return false;
    
    const hasStripeAccount = !!userData.stripeAccountId;
    const stripeComplete = userData.stripeChargesEnabled && userData.stripeDetailsSubmitted;
    const hostTermsAgreed = !!userData.agreedToHostTerms;
    
    return hasStripeAccount && stripeComplete && hostTermsAgreed;
  };
  
  const onboardingComplete = isOnboardingComplete(hostUserData);

  // If onboarding is not complete, show the checklist instead of applications
  if (!onboardingComplete) {
    return (
      <div className={`${HOST_PAGE_STYLE}`}>
        <HostPageTitle title="All Applications" subtitle="Applications for all of your properties" />
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-medium">
              You must complete your onboarding before viewing applicant details.
            </p>
          </div>
          <OnboardingChecklistCard 
            hostUserData={hostUserData} 
            isAdminDev={isAdminDev}
            title="Complete Your Onboarding"
            description="Finish setting up your host account to access application details and manage your property applications."
          />
        </div>
      </div>
    );
  }

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
