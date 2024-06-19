'use client'
import React from 'react';
import ListingHorizontalCard from '@/components/ui/listing-horizontal-card';
import TabSelector from '@/components/ui/tab-selector';
import { useHostProperties } from '../../../../contexts/host-properties-provider';
import { useRouter } from 'next/navigation';

const PropertyDetails: React.FC = ({ params }) => {
  const { listings } = useHostProperties();
  const { listingId } = params;

  const listing = listings.find(listing => listing.id === listingId);

  if (!listing) {
    return <div>Property not found</div>;
  }

  return (
    <div className='px-4'>
      <ListingHorizontalCard imgSrc={listing.listingImages[0].url} title={listing.title} status={listing.status} address={listing.locationString} />
      <TabSelector tabs={['Description', 'Amenities', 'Photos', 'Availability', 'Price', 'Calendar']} />
      {/* Add more details as needed */}
    </div>
  );
};

export default PropertyDetails;
