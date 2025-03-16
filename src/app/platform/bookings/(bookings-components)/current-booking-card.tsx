'use client';
import { Booking } from '@prisma/client';
import React from 'react';
import { CalendarDays, Bookmark, MapPin, Clock, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

interface CurrentBookingCardProps {
  booking: Booking;
}

const CurrentBookingCard: React.FC<CurrentBookingCardProps> = ({ booking }) => {
  const router = useRouter();

  // Format date range for display
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  const dateRangeText = booking.startDate && booking.endDate ?
    `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
     ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` :
    'No dates selected';
    
  const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="border border-blueBrand bg-background rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left content */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-medium text-gray-900 mb-1">Current Stay</h3>
                <p className="text-lg text-gray-700 mb-4">Booking #{booking.id.substring(0, 8)}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blueBrand" />
                <div>
                  <p className="text-sm text-gray-500">Dates</p>
                  <p className="text-sm font-medium">{dateRangeText}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blueBrand" />
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className="text-sm font-medium">{daysLeft} days left</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blueBrand" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm font-medium">123 Main Street, Apartment 4B</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blueBrand" />
                <div>
                  <p className="text-sm text-gray-500">Payment</p>
                  <p className="text-sm font-medium">${(booking.amount / 100).toFixed(2)}/month</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content (call to action) */}
          <div className="flex flex-col justify-center space-y-4 min-w-[200px]">
            <Button 
              className="bg-blueBrand hover:bg-blueBrand/90 text-white w-full"
              onClick={() => router.push(`/platform/bookings/${booking.id}`)}
            >
              View Details
            </Button>
            <Button 
              variant="outline" 
              className="border-blueBrand text-blueBrand hover:bg-blueBrand/10 w-full"
            >
              Contact Host
            </Button>
            <Button 
              variant="outline" 
              className="border-blueBrand text-blueBrand hover:bg-blueBrand/10 w-full"
            >
              Report Issue
            </Button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="bg-gray-100 h-4 w-full">
        <div 
          className="bg-blueBrand h-full transition-all duration-500 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, 100 - (daysLeft / 30) * 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CurrentBookingCard;