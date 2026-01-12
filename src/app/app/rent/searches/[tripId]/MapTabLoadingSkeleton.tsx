'use client';

export default function MapTabLoadingSkeleton() {
  return (
    <div className="flex flex-col mx-auto w-full sm:px-2 flex-1 min-h-0 animate-pulse">
      {/* Filter display skeleton - desktop only */}
      <div className="w-full space-y-3 mb-4 hidden md:block">
        <div className="flex w-full items-center justify-start">
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex w-full items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Desktop Layout: Grid + Map */}
      <div className="hidden md:flex flex-1 flex-row justify-center overflow-hidden">
        {/* Listings grid skeleton - 1/2 width */}
        <div className="w-1/2 pr-4 h-full">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,280px))] gap-4 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2 max-w-[280px]">
                <div className="w-full h-40 bg-gray-200 rounded-lg" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-4 w-1/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Map skeleton - 1/2 width */}
        <div className="w-1/2 min-h-[70dvh]">
          <div className="w-full h-full bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Mobile Layout: Grid only with floating button */}
      <div className="md:hidden flex-1 relative">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="w-full h-48 bg-gray-200 rounded-lg" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Floating map button skeleton */}
        <div
          className="fixed w-16 h-16 rounded-full bg-gray-300 z-50"
          style={{ bottom: '4dvh', right: '1rem' }}
        />
      </div>
    </div>
  );
}
