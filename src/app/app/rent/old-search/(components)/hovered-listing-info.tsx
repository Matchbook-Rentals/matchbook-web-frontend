import { useListingHoverStore } from '@/store/listing-hover-store'

export default function HoveredListingInfo() {
  const hoveredListing = useListingHoverStore((state) => state.hoveredListing)

  if (!hoveredListing) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg transition-all duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 relative rounded-lg overflow-hidden">
            {hoveredListing.listingImages[0] && (
              <img
                src={hoveredListing.listingImages[0].url}
                alt={hoveredListing.title}
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <div>
            <h3 className="font-medium text-lg">{hoveredListing.title}</h3>
            <p className="text-gray-600">
              ${hoveredListing.price?.toLocaleString() || 2350}/month · {hoveredListing.roomCount || 4} beds · {hoveredListing.bathroomCount || 2} baths
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-600">{hoveredListing.locationString}</p>
          {hoveredListing.category && (
            <p className="text-gray-500">
              {hoveredListing.category.charAt(0).toUpperCase() + hoveredListing.category.slice(1).toLowerCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}