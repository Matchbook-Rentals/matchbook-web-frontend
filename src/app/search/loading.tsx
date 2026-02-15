'use client';

import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import UserMenu from '@/components/userMenu';

function ListingCardSkeleton() {
  return (
    <div className="flex flex-col w-full">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4 mt-3 rounded" />
      <Skeleton className="h-4 w-1/2 mt-1.5 rounded" />
      <Skeleton className="h-4 w-2/5 mt-2 rounded" />
    </div>
  );
}

export default function SearchLoading() {
  return (
    <div className="flex flex-col h-screen">
      {/* Real navbar */}
      <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10">
        <header className="relative z-30 flex items-center gap-4 px-4 sm:px-6 h-[76px]">
          <Link href="/" className="flex-shrink-0">
            <img className="w-[160px] md:w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
            <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
          </Link>

          {/* Desktop search bar */}
          <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
            <div
              className="flex items-center w-full h-[50px] bg-background rounded-full pl-5 pr-2"
              style={{ maxWidth: 700, boxShadow: '0px 4px 10px rgba(0,0,0,0.12)' }}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col flex-1 min-w-0 border-r border-gray-300 pr-3 lg:pr-5">
                  <span className="text-[11px] lg:text-xs font-medium leading-tight text-gray-600">Where</span>
                  <span className="text-[11px] lg:text-xs text-gray-400 leading-tight">Choose Location</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0 border-r border-gray-300 px-3 lg:px-5">
                  <span className="text-[11px] lg:text-xs font-medium leading-tight text-gray-600">When</span>
                  <span className="text-[11px] lg:text-xs text-gray-400 leading-tight">Add Dates</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0 pl-3 lg:pl-5">
                  <span className="text-[11px] lg:text-xs font-medium leading-tight text-gray-600">Who</span>
                  <span className="text-[11px] lg:text-xs text-gray-400 leading-tight">Add Renters</span>
                </div>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-primaryBrand rounded-full flex-shrink-0 ml-2 lg:ml-3 flex items-center justify-center">
                <SearchIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <UserMenu color="white" mode="header" />
          </div>
        </header>

        {/* Mobile search bar */}
        <div className="md:hidden flex items-center justify-center w-full px-4 sm:px-6 pb-4 pt-1">
          <div
            className="flex items-center w-full max-w-full h-[50px] pl-4 sm:pl-6 pr-3 py-2 bg-background rounded-full"
            style={{ boxShadow: '0px 4px 10px rgba(0,0,0,0.12)' }}
          >
            <span className="text-xs font-medium text-gray-500 truncate flex items-center justify-center w-full">
              Begin Your Search
            </span>
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex w-full min-h-[51px] items-center justify-between px-3 py-2 flex-shrink-0 mx-auto sm:px-2">
        <div className="hidden md:flex flex-1" />
        <Skeleton className="h-8 w-[85px] rounded-lg ml-auto md:ml-3" />
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row justify-start md:justify-center flex-1 mx-auto w-full sm:px-2">
        {/* Listings grid */}
        <div className="w-full md:w-2/3 lg:w-1/2 pr-0 md:pr-4 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-0 pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Map skeleton (desktop only) */}
        <div className="hidden md:block w-full md:w-1/3 lg:w-1/2">
          <Skeleton className="w-full h-full min-h-[500px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
