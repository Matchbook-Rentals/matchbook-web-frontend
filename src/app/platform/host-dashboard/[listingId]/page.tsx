'use client'
import React from 'react';
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
    <div>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      {/* Add more details as needed */}
    </div>
  );
};

export default PropertyDetails;
