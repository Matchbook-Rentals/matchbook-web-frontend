import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { getHostUserData } from '@/app/actions/user';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ApplicationsTab from '../(tabs)/host-applications-tab';
import { HostPageTitle } from '../(components)/host-page-title';
import { HOST_PAGE_STYLE } from '@/constants/styles';
import { getListingDisplayName } from '@/utils/listing-helpers';
import { OnboardingChecklistCard } from '../../components/onboarding-checklist-card';

interface ApplicationsPageProps {
  params: { listingId: string };
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { listingId } = params;
  
  console.log('ApplicationsPage: Starting data fetch...');
  
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
  
  // Fetch listing first to get the display name for the page
  const listing = await getListingById(listingId);
  if (!listing) return notFound();

  // If onboarding is not complete, show the checklist instead of applications
  if (!onboardingComplete) {
    return (
      <div className={HOST_PAGE_STYLE}>
        <HostPageTitle 
          title="Applications" 
          subtitle={`Applications for ${getListingDisplayName(listing)}`} 
        />
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
  const housingRequests = await getHousingRequestsByListingId(listingId);

  console.log('ApplicationsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- housingRequests count:', housingRequests.length);
  
  return (
    <div className={HOST_PAGE_STYLE}>
      <HostPageTitle 
        title="Applications" 
        subtitle={`Applications for ${getListingDisplayName(listing)}`} 
      />
      <ApplicationsTab listing={listing} housingRequests={housingRequests} />
    </div>
  );
}