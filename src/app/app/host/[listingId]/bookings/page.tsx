import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';
import BookingsTab from '../(tabs)/bookings-tab';

interface BookingsPageProps {
  params: { listingId: string };
}

export default async function BookingsPage({ params }: BookingsPageProps) {
  const { listingId } = params;
  
  console.log('BookingsPage: Starting data fetch...');
  
  // Fetch data in parallel
  const [listing, bookings] = await Promise.all([
    getListingById(listingId),
    getBookingsByListingId(listingId)
  ]);

  if (!listing) return notFound();

  console.log('BookingsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- bookings count:', bookings.length);

  // Combine actual bookings with matches that don't have bookings yet (awaiting signature)
  const existingBookings = bookings || [];
  const existingBookingMatchIds = new Set(existingBookings.map(b => b.matchId));
  
  // Find matches that have BoldSignLease (lease documents) but no booking yet
  // Only include matches that are NOT fully completed (still awaiting signature or payment)
  const matchesAwaitingSignature = (listing.matches || [])
    .filter(match => {
      // Must have lease document
      if (!match.BoldSignLease) return false;
      
      // Must not already have a booking
      if (existingBookingMatchIds.has(match.id)) return false;
      
      // Must have valid trip and user data
      if (!match.trip || !match.trip.user) return false;
      
      // Must be incomplete - either not fully signed OR payment not authorized
      const isFullySigned = match.BoldSignLease.landlordSigned && match.BoldSignLease.tenantSigned;
      const isPaymentAuthorized = !!match.paymentAuthorizedAt;
      
      // Only include if it's NOT fully completed
      return !(isFullySigned && isPaymentAuthorized);
    })
    .map(match => ({
      // Convert match to booking-like structure
      id: `match-${match.id}`, // Prefix to distinguish from real bookings
      userId: match.trip.user.id,
      listingId: match.listingId,
      tripId: match.tripId,
      matchId: match.id,
      startDate: match.trip.startDate,
      endDate: match.trip.endDate,
      totalPrice: null,
      monthlyRent: match.monthlyRent,
      createdAt: new Date(match.trip.createdAt),
      status: "awaiting_signature", // Special status
      listing: listing,
      user: match.trip.user,
      trip: {
        numAdults: match.trip.numAdults,
        numPets: match.trip.numPets,
        numChildren: match.trip.numChildren,
      },
      match: {
        id: match.id,
        tenantSignedAt: match.tenantSignedAt,
        landlordSignedAt: match.landlordSignedAt,
        paymentAuthorizedAt: match.paymentAuthorizedAt,
        BoldSignLease: match.BoldSignLease,
        Lease: match.Lease,
      }
    }));
  
  const allBookingsData = [...existingBookings, ...matchesAwaitingSignature];
  
  return (
    <BookingsTab bookings={allBookingsData} listingId={listing.id} />
  );
}