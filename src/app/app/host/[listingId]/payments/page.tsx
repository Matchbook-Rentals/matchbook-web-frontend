import React from "react";
import { getListingById } from '@/app/actions/listings';
import { getBookingsByListingId } from '@/app/actions/bookings';
import { notFound } from 'next/navigation';

interface PaymentsPageProps {
  params: { listingId: string };
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { listingId } = params;
  
  console.log('PaymentsPage: Starting data fetch...');
  
  // Fetch data in parallel
  const [listing, bookings] = await Promise.all([
    getListingById(listingId),
    getBookingsByListingId(listingId)
  ]);

  if (!listing) return notFound();

  console.log('PaymentsPage: Data fetched successfully');
  console.log('- listing:', listing.streetAddress1);
  console.log('- bookings count:', bookings.length);
  
  // TODO: Implement actual payments component when ready
  // For now, show placeholder content
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Manage payments for {listing.streetAddress1}</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Overview</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Total Bookings</p>
              <p className="text-sm text-gray-600">Active payment sources</p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {bookings.length}
            </div>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <p>Payment management interface coming soon</p>
            <p className="text-sm mt-2">This will include payment history, upcoming payments, and payout management</p>
          </div>
        </div>
      </div>
    </div>
  );
}