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
          <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
            {/* First row: Property details and pricing */}
            <div className="col-span-2 bg-gray-200 rounded-lg" />
            <div className="col-span-2 bg-gray-200 rounded-lg" />
            <div className="col-span-2 bg-gray-200 rounded-lg" />
            <div className="col-span-2 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative min-h-[75vh] flex flex-col space-y-4 w-full animate-pulse">
        <div className="w-full flex justify-end"> <div className="animate-pulse bg-gray-200 w-[80px] h-[30px]" /></div>
        {/* Main image skeleton */}
        <div className="w-full h-[30vh] relative">
          <div className="w-full h-full bg-gray-200 rounded-[5px]" />
          {/* Show More button skeleton */}
          <div className="absolute bottom-4 right-4 h-10 w-24 bg-gray-300 rounded-md" />
        </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-4 absolute bottom-[5%] left-[50%] translate-x-[-50%] z-10">
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
          </div>
      </div>
    </>
  );
}
