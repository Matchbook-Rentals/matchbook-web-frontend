'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getLocationDisplay, formatDateRange, formatOccupants } from '../lib/dashboard-helpers';
import type { DashboardTrip } from '@/app/actions/renter-dashboard';

interface SearchCardProps {
  trip: DashboardTrip;
  compact?: boolean;
}

export const SearchCard = ({ trip, compact = false }: SearchCardProps) => (
  <Link
    href={`/guest/rent/searches/${trip.id}`}
    className="flex w-full h-[52px] items-center gap-3 px-3 hover:bg-transparent bg-inherit rounded-[10px]"
  >
    <div className="flex w-8 h-8 items-center justify-center shrink-0 rounded-[10px] border border-[#EAECF0] bg-background shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]">
      <Home size={20} className="text-gray-600" />
    </div>

    <div className="flex items-center font-poppins font-medium text-[#373940] text-[11px] truncate">
      {getLocationDisplay(trip)}
    </div>

    <div className="flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate">
      {formatDateRange(trip.startDate, trip.endDate)}
    </div>

    <div className="flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </div>

    <ChevronRight className="w-5 h-5 text-primaryBrand shrink-0" strokeWidth={3} />
  </Link>
);
