'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_MARGIN } from '@/constants/styles';

export default function MobileApplicationSkeleton() {
  return (
    <div className={PAGE_MARGIN}>
      <div className="w-full max-w-3xl mx-auto">
        {/* Accordion skeletons */}
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="border rounded-lg mb-4 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            
            {index === 1 && (
              <div className="p-4 space-y-4 border-t">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            )}
          </div>
        ))}

        <Skeleton className="w-full h-12 mt-6" />
      </div>
    </div>
  );
}