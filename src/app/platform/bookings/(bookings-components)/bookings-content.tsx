'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PAGE_MARGIN } from '@/constants/styles';
import { Booking } from '@prisma/client';
import BookingGrid from './booking-grid';
import CurrentBookingCard from './current-booking-card';

// Add test bookings
const testBookings: Booking[] = [
  // Current booking
  {
    id: 'current-booking-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user123',
    matchId: 'match123',
    status: 'active',
    amount: 120000, // $1,200.00
    currency: 'usd',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    paymentIntentId: 'pi_123',
    checkoutSessionId: 'cs_123',
    refundId: null,
    stripeAccountId: 'acct_123',
    metadata: {}
  },
  // Future booking
  {
    id: 'future-booking-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user123',
    matchId: 'match456',
    status: 'upcoming',
    amount: 150000, // $1,500.00
    currency: 'usd',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    paymentIntentId: 'pi_456',
    checkoutSessionId: 'cs_456',
    refundId: null,
    stripeAccountId: 'acct_456',
    metadata: {}
  },
  // Past booking
  {
    id: 'past-booking-789',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    updatedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    userId: 'user123',
    matchId: 'match789',
    status: 'completed',
    amount: 110000, // $1,100.00
    currency: 'usd',
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
    endDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    paymentIntentId: 'pi_789',
    checkoutSessionId: 'cs_789',
    refundId: null,
    stripeAccountId: 'acct_789',
    metadata: {}
  },
  // Cancelled booking
  {
    id: 'cancelled-booking-101',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    userId: 'user123',
    matchId: 'match101',
    status: 'cancelled',
    amount: 130000, // $1,300.00
    currency: 'usd',
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // would have been 10 days from now
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // would have been 40 days from now
    paymentIntentId: 'pi_101',
    checkoutSessionId: 'cs_101',
    refundId: 're_101',
    stripeAccountId: 'acct_101',
    metadata: {}
  }
];

interface BookingsContentProps {
  bookings: Booking[];
}

const BookingsContent: React.FC<BookingsContentProps> = ({ bookings }) => {
  // For testing purposes, use the test bookings instead of real ones
  const allBookings = [...testBookings];
  
  // Find current booking (first one in test bookings)
  const currentBooking = allBookings[0];
  
  // Other bookings (everything except current)
  const otherBookings = allBookings.slice(1);

  // Filter states
  const [filters, setFilters] = useState({
    upcoming: true,
    past: true,
    cancelled: true
  });

  // Handle filter changes
  const handleFilterChange = (filter: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  // Filter bookings based on selected filters
  const getFilteredBookings = () => {
    // If no filters are selected, return all bookings (same as all filters selected)
    const anyFilterSelected = filters.upcoming || filters.past || filters.cancelled;
    if (!anyFilterSelected) {
      return otherBookings;
    }
    
    return otherBookings.filter(booking => {
      // Determine the booking's status category
      let statusCategory;
      if (booking.status === 'completed') {
        statusCategory = 'past';
      } else if (booking.status === 'cancelled') {
        statusCategory = 'cancelled';
      } else {
        // Any other status (upcoming, active, pending, etc.) is considered 'upcoming'
        statusCategory = 'upcoming';
      }
      
      // Only show if the corresponding filter is checked
      return filters[statusCategory as keyof typeof filters];
    });
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className={`bg-background ${PAGE_MARGIN} mx-auto min-h-[105vh]`}>
      <div className='flex items-end pb-2'>
        <div className='flex flex-col w-1/2'>
          <h1 className='text-[32px] font-medium mb-4'>Your Bookings</h1>
        </div>
        <div className="hidden sm:block w-full md:w-1/2 mx-auto">
          <Image
            src="/milwaukee-downtown.png"
            alt="Village footer"
            width={1200}
            height={516}
            className="w-full max-w-[1000px] h-auto object-cover mx-auto p-0 my-0"
          />
        </div>
      </div>

      {allBookings.length > 0 ? (
        <div>
          {/* Current booking - full width */}
          <div className="w-full mb-8">
            <h2 className="text-xl font-medium mb-4">Current Booking</h2>
            <CurrentBookingCard booking={currentBooking} />
          </div>
          
          {/* Other bookings - 3/4 width with filter */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filter box - 1/4 width */}
            <div className="w-full md:w-1/4">
              <div className="border border-gray-200 rounded-md p-4 sticky top-4 bg-background">
                <h3 className="text-lg font-medium mb-4">Filter by Status</h3>
                <div className="space-y-2">
                  {/* Get counts for each category */}
                  {(() => {
                    const upcomingCount = otherBookings.filter(b => b.status === 'upcoming' || (!['completed', 'cancelled'].includes(b.status || ''))).length;
                    const pastCount = otherBookings.filter(b => b.status === 'completed').length;
                    const cancelledCount = otherBookings.filter(b => b.status === 'cancelled').length;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="upcoming" 
                              className="h-4 w-4 text-blueBrand focus:ring-blueBrand border-gray-300 rounded"
                              checked={filters.upcoming}
                              onChange={() => handleFilterChange('upcoming')}
                            />
                            <label htmlFor="upcoming" className="ml-2 block text-sm text-gray-700">Upcoming</label>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{upcomingCount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="past" 
                              className="h-4 w-4 text-blueBrand focus:ring-blueBrand border-gray-300 rounded"
                              checked={filters.past}
                              onChange={() => handleFilterChange('past')}
                            />
                            <label htmlFor="past" className="ml-2 block text-sm text-gray-700">Past</label>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{pastCount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="cancelled" 
                              className="h-4 w-4 text-blueBrand focus:ring-blueBrand border-gray-300 rounded"
                              checked={filters.cancelled}
                              onChange={() => handleFilterChange('cancelled')}
                            />
                            <label htmlFor="cancelled" className="ml-2 block text-sm text-gray-700">Cancelled</label>
                          </div>
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{cancelledCount}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                {/* Reset filters button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setFilters({ upcoming: true, past: true, cancelled: true })}
                    className="text-xs text-blueBrand hover:underline w-full text-center"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
            
            {/* Other bookings grid - 3/4 width */}
            <div className="w-full md:w-3/4">
              <h2 className="text-xl font-medium mb-4">All Bookings</h2>
              
              {filteredBookings.length > 0 ? (
                <BookingGrid initialBookings={filteredBookings} />
              ) : (
                <div className="text-center py-10 border mt-4 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-lg text-gray-600">No bookings match your current filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border mt-4 md:mt-32 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-lg text-gray-600">You currently don&apos;t have any bookings.</p>
        </div>
      )}
    </div>
  );
};

export default BookingsContent;