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
    href={`/search?tripId=${trip.id}`}
    className="flex w-full h-[52px] items-center gap-3 pl-0 pr-3 hover:bg-gray-50 bg-inherit rounded-[10px] transition-colors group min-w-0"
  >
    <div className="flex w-8 h-8 items-center justify-center shrink-0 rounded-[10px] border border-[#EAECF0] bg-background shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]">
      <Home size={20} className="text-gray-600" />
    </div>

    <div className="flex items-center font-poppins font-medium text-[#373940] text-[11px] truncate min-w-0">
      {getLocationDisplay(trip)}
    </div>

    <div className="flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate min-w-0 shrink-0">
      {formatDateRange(trip.startDate, trip.endDate)}
    </div>

    <div className="flex items-center font-poppins font-normal text-[#777b8b] text-[11px] truncate min-w-0 shrink-0">
      {formatOccupants(trip.numAdults, trip.numChildren, trip.numPets)}
    </div>

    <ChevronRight className="w-5 h-5 text-primaryBrand shrink-0 transition-transform group-hover:scale-110" strokeWidth={3} />
  </Link>
);
