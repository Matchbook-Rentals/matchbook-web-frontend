export default function ListingsSkeletonLoader() {
  return (
    <div className="py-8 w-[calc(100%-30px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-60px)] lg:w-[79.17%] max-w-[1520px] mx-auto">
      <div className="animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-10">
            {/* Header with title and navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-gray-200 rounded w-56" />
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
              </div>
              {/* Scroll buttons - hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-9 h-9 bg-gray-100 rounded-full" />
                <div className="w-9 h-9 bg-gray-100 rounded-full" />
              </div>
            </div>
            {/* Responsive card grid - matches Embla carousel structure */}
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div
                  key={j}
                  className="flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  {/* Image skeleton */}
                  <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
                  {/* Card content skeleton */}
                  <div className="pt-3 flex flex-col gap-0.5">
                    {/* Title */}
                    <div className="h-4 bg-gray-200 rounded w-[85%]" />
                    {/* Details line */}
                    <div className="h-3 bg-gray-200 rounded w-[70%]" />
                    {/* Price and rating row */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="h-3 bg-gray-200 rounded w-[40%]" />
                      <div className="h-3 bg-gray-200 rounded w-[25%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
