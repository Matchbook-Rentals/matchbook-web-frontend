'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import UserMenu from '@/components/userMenu';
import { PAGE_MARGIN } from '@/constants/styles';

export default function ListingDetailLoading() {
  return (
    <>
      {/* Navbar */}
      <div className="relative w-full bg-gradient-to-b from-white to-primaryBrand/10 mb-4 md:mb-6 lg:mb-8">
        <header className="relative z-30 flex items-center justify-between px-6 h-[76px]">
          <Link href="/" className="flex-shrink-0">
            <img className="w-[200px] hidden md:block" alt="MatchBook Logo" src="/new-green-logo.png" />
            <img className="w-[35px] block md:hidden" alt="MatchBook Logo" src="/logo-small.svg" />
          </Link>
          <div className="flex items-center gap-6 flex-shrink-0">
            <UserMenu color="white" mode="header" />
          </div>
        </header>
      </div>

      <div className={`${PAGE_MARGIN} font-montserrat min-h-screen`}>
        <div className="w-full mx-auto pb-[100px] md:pb-[160px] lg:pb-6">
          {/* Title */}
          <div className="mb-4">
            <div className="hidden lg:flex items-center justify-between">
              <Skeleton className="h-10 w-2/3 rounded" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="flex lg:hidden items-center justify-between">
              <Skeleton className="h-7 w-3/4 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* Image carousel skeleton - Desktop: main image + 2x2 grid */}
          <div className="hidden lg:flex flex-row space-x-4 xl:space-x-5 w-full h-[50vh] max-h-[420px]">
            <Skeleton className="w-1/2 h-full rounded-lg" />
            <div className="w-1/2 h-full grid grid-cols-2 grid-rows-2 gap-3 lg:gap-4">
              <Skeleton className="w-full h-full rounded-lg" />
              <Skeleton className="w-full h-full rounded-lg" />
              <Skeleton className="w-full h-full rounded-lg" />
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          </div>

          {/* Image carousel skeleton - Mobile: single image */}
          <Skeleton className="lg:hidden w-full h-[30vh] rounded-[5px]" />

          {/* Content area */}
          <div className="flex justify-between gap-x-8 lg:gap-x-16 relative mt-6">
            {/* Left column - listing description */}
            <div className="w-full lg:w-full">
              {/* Host info row */}
              <div className="flex items-center gap-3 py-4 border-b border-gray-200">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-5 w-40 rounded" />
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
              </div>

              {/* Property details */}
              <div className="py-5 border-b border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>

              {/* Description */}
              <div className="py-5 border-b border-gray-200">
                <Skeleton className="h-6 w-32 rounded mb-3" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>

              {/* Amenities */}
              <div className="py-5 border-b border-gray-200">
                <Skeleton className="h-6 w-40 rounded mb-3" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-32 rounded" />
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="py-5">
                <Skeleton className="h-6 w-24 rounded mb-3" />
                <Skeleton className="h-4 w-48 rounded" />
              </div>
            </div>

            {/* Right column - details box (desktop only) */}
            <div className="w-1/2 mt-6 h-fit lg:w-full rounded-[12px] shadow-md min-w-[375px] max-w-[400px] sticky top-[10%] hidden lg:block p-6">
              <Skeleton className="h-8 w-32 rounded mb-4" />
              <Skeleton className="h-5 w-24 rounded mb-6" />
              <div className="flex flex-col gap-3 mb-6">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>

          {/* Map skeleton */}
          <Skeleton className="w-full h-[526px] mt-4 rounded-[12px]" />
        </div>
      </div>
    </>
  );
}
