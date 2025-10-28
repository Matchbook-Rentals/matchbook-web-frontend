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

// Force dynamic rendering to ensure fresh Stripe status on every page load
export const dynamic = 'force-dynamic';

interface ApplicationsPageProps {
  params: { listingId: string };
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { listingId } = params;

  console.log('ApplicationsPage: Starting data fetch...');

  // Check host onboarding requirements
  // See docs/host-onboarding-requirements.md for detailed requirements documentation
  const { sessionClaims } = await auth();
  const isAdminDev = sessionClaims?.metadata?.role === 'admin_dev';

  // Get host user data to pass to child components
  const hostUserData = await getHostUserData();

  // Fetch listing first to get the display name for the page
  const listing = await getListingById(listingId);
  if (!listing) return notFound();

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
      <ApplicationsTab
        listing={listing}
        housingRequests={housingRequests}
        hostUserData={hostUserData}
        isAdminDev={isAdminDev}
      />
    </div>
  );
}