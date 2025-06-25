"use client";

import React, { useMemo } from "react";
import BookingsTab from '../(tabs)/bookings-tab';
import { useListingDashboard } from '../listing-dashboard-context';

export default function BookingsPage() {
  const { data } = useListingDashboard();
  
  // Combine actual bookings with matches that don't have bookings yet (awaiting signature)
  const allBookingsData = useMemo(() => {
    const existingBookings = data.bookings || [];
    const existingBookingMatchIds = new Set(existingBookings.map(b => b.matchId));
    
    // Find matches that have BoldSignLease (lease documents) but no booking yet
    // Only include matches that are NOT fully completed (still awaiting signature or payment)
    const matchesAwaitingSignature = (data.listing.matches || [])
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
        listing: data.listing,
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
    
    return [...existingBookings, ...matchesAwaitingSignature];
  }, [data.bookings, data.listing]);
  
  return (
    <BookingsTab bookings={allBookingsData} listingId={data.listing.id} />
  );
}