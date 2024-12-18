'use client'
import React from 'react';
import ListingHorizontalCard from '@/components/ui/listing-horizontal-card';
import TabSelector from '@/components/ui/tab-selector';
import CardWithHeader from '@/components/ui/card-with-header';
import { useHostProperties } from '../../../../contexts/host-properties-provider';
import { OverviewIcon, ListingIcon, ApplicationsIcon, PaymentsIcon, BookingsIcon, AnalyticsIcon } from '@/components/svgs/svg-components';
import OverviewTab from './(tabs)/overview-tab';
import BookingsTab from './(tabs)/bookings-tab';
import PaymentsTab from './(tabs)/payments-tab';
import ApplicationsTab from './(tabs)/host-applications-tab';
import ListingTab from './(tabs)/listing-tab';

const PropertyDetails: React.FC = ({ params }) => {
  const [housingRequests, setHousingRequests] = React.useState([]);
  const { listings, getListingHousingRequests, setCurrHousingRequest } = useHostProperties();
  const { listingId } = params;

  const listing = listings.find(listing => listing.id === listingId);

  React.useEffect(() => {
    const fetchHousingRequests = async () => {
      try {
        const requests = await getListingHousingRequests(listing.id);
        setHousingRequests(requests);
        setCurrHousingRequest(requests[0] || null);
      } catch (error) {
        console.error('Error fetching housing requests:', error);
      }
    };

    fetchHousingRequests();
  }, [getListingHousingRequests]);


  if (!listing) {
    return <div>Property not found</div>;
  }

  const tabs = [
    {
      value: "listing",
      label: "Listing",
      Icon: ListingIcon,
      content: (
      <ListingTab />
      ),
    },
    {
      value: "lease",
      label: "Lease",
      Icon: OverviewIcon,
      content: <OverviewTab />,
    },
    {
      value: "applications",
      label: "Applications",
      Icon: ApplicationsIcon,
      content: (
        <ApplicationsTab
          listing={listing}
          housingRequests={housingRequests}
          setHousingRequests={setHousingRequests}
        />
      ),
    },
    {
      value: "payments",
      label: "Payments",
      Icon: PaymentsIcon,
      content: <PaymentsTab />,
    },
    {
      value: "analytics",
      label: "Analytics",
      Icon: AnalyticsIcon,
      content: (
        <CardWithHeader
          title="Analytics"
          content={<div>Analytics content goes here.</div>}
        />
      ),
    },
    {
      value: "bookings",
      label: "Bookings",
      Icon: BookingsIcon,
      content: <BookingsTab />,
    },
  ];

  return (
    <div className='px-1 sm:px-2 md:px-4 lg:px-6 xl:px-8'>
      <h1 className="text-3xl my-3 font-semibold text-center">Property Dashboard</h1>
      <ListingHorizontalCard imgSrc={listing.listingImages[0].url} title={listing.title} status={listing.status} address={listing.locationString} />
      <TabSelector tabs={tabs} useUrlParams />
      {/* Add more details as needed */}
    </div>
  );
};

export default PropertyDetails;
