'use client';

import { PAGE_MARGIN, ApplicationItemHeaderStyles } from '@/constants/styles';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

export default function ApplicationLoading() {
  return (
    <div className={PAGE_MARGIN}>
      <div className="flex gap-2 mb-4 items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-3 rounded-full" />
        <Skeleton className="h-6 w-28" />
      </div>

      <div className="flex gap-6 max-w-full overflow-x-hidden">
        {/* Sidebar Navigation Skeleton */}
        <div className="hidden lg:block pt-1 w-64 shrink-0">
          <nav className="space-y-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="w-full h-10 rounded-lg mb-2" />
            ))}
          </nav>
        </div>

        {/* Main Content Skeleton */}
        <div className="relative flex-1 min-w-0">
          <div className="p-6 overflow-y-auto min-h-[400px] border rounded-lg">
            <Skeleton className="h-8 w-48 mb-6" />
            
            {/* Form fields skeletons */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between px-6 mt-4 mb-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}