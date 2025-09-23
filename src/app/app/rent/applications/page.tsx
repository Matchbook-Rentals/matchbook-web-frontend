import React from 'react';
import { getUserHousingRequests } from '@/app/actions/housing-requests';
import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage() {
  const housingRequests = await getHousingRequestsData();
  
  return <ApplicationsClient housingRequests={housingRequests} />;
}

const getHousingRequestsData = async () => {
  try {
    const requests = await getUserHousingRequests();
    return transformForClient(requests);
  } catch (error) {
    console.error('Failed to fetch housing requests:', error);
    return [];
  }
};

const transformForClient = (requests: any[]) => {
  return requests.map(request => ({
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    listing: {
      id: request.listing.id,
      title: request.listing.title,
      city: request.listing.city,
      state: request.listing.state,
      imageSrc: request.listing.imageSrc,
      listingImages: request.listing.listingImages || [],
      user: request.listing.user ? {
        id: request.listing.user.id,
        firstName: request.listing.user.firstName,
        lastName: request.listing.user.lastName,
        email: request.listing.user.email
      } : null
    },
    trip: {
      id: request.trip.id,
      numAdults: request.trip.numAdults,
      numChildren: request.trip.numChildren,
      numPets: request.trip.numPets
    },
    hasMatch: request.hasMatch,
    hasBooking: request.hasBooking,
    bookingId: request.bookingId,
    matchId: request.match?.id || null
  }));
};