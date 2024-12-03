'use client';

export default function LoadingSkeleton() {
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row space-x-4 w-full h-[50vh] animate-pulse">
        {/* Main image skeleton */}
        <div className="w-1/2 h-full">
          <div className="w-full h-full bg-gray-200 rounded-lg" />
        </div>

        {/* Grid skeleton */}
        <div className="w-1/2 h-full">
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[50vh]">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-gray-200 rounded-lg h-[24vh]" />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col space-y-4 w-full animate-pulse">
        {/* Main image skeleton */}
        <div className="w-full h-[30vh] relative">
          <div className="w-full h-full bg-gray-200 rounded-[30px]" />
          {/* Show More button skeleton */}
          <div className="absolute bottom-4 right-4 h-10 w-24 bg-gray-300 rounded-md" />
        </div>

        {/* Thumbnail carousel skeleton */}
        <div className="w-full overflow-hidden">
          <div className="flex space-x-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="flex-none w-1/4">
                <div className="h-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}