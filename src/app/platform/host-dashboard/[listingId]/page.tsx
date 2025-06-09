import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getHousingRequestsByListingId } from '@/app/actions/housing-requests';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PAGE_MARGIN } from "@/constants/styles";
import TabSelector from "@/components/ui/tab-selector";
import { ListingAndImages, RequestWithUser } from '@/types';
import ApplicationsTab from './(tabs)/host-applications-tab';
import BookingsTab from './(tabs)/bookings-tab';



const ReviewsContent = (): JSX.Element => {
  return <div className="mt-8">Reviews Content</div>;
};

const ListingContent = (): JSX.Element => {
  return <div className="mt-8">Listing Content</div>;
};

interface BoxProps {
  listing: ListingAndImages;
  housingRequests: RequestWithUser[];
  bookings: any[];
}

const Box = ({ listing, housingRequests, bookings }: BoxProps): JSX.Element => {
  const tabs = [
    {
      value: "applications",
      label: "Applications",
      content: <ApplicationsTab listing={listing} housingRequests={housingRequests} />,
    },
    {
      value: "bookings",
      label: "Bookings",
      content: <BookingsTab bookings={bookings} listingId={listing.id} />,
    },
    {
      value: "reviews",
      label: "Reviews",
      content: <ReviewsContent />,
    },
    {
      value: "listing",
      label: "Listing",
      content: <ListingContent />,
    },
  ];

  return (
    <div className={`${PAGE_MARGIN} min-h-screen pt-6`}>
      <div className="w-full">
        <TabSelector
          tabs={tabs}
          defaultTab="applications"
          tabsListClassName="mb-0"
        />
      </div>
    </div>
  );
};

interface PropertyDashboardPageProps {
  params: { listingId: string }
}

const PropertyDashboardPage = async ({ params }: PropertyDashboardPageProps) => {
  const { listingId } = params;
  const listing = await getListingById(listingId);
  if (!listing) return notFound();
  
  const housingRequests = await getHousingRequestsByListingId(listingId);
  const bookings = await getBookingsByListingId(listingId);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Box listing={listing} housingRequests={housingRequests} bookings={bookings} />
    </Suspense>
  );
};

export default PropertyDashboardPage;