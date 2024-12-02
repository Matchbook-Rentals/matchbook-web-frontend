import React, { useState } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import SearchMap from '../(components)/search-map';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createDbHousingRequest, deleteDbHousingRequest } from '@/app/actions/housing-requests';
import SortableFavorites from '../(components)/sortable-favorites';
import { Separator } from "@/components/ui/separator";
import { LayoutGrid, List } from "lucide-react";
import SearchListingsGrid from '../(components)/search-listings-grid';
import FilterOptionsDialog from '../(tabs)/filter-options-dialog';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';

export default function ShortListTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { state, actions } = useTripContext();
  const { likedListings, requestedListings, maybedListings, lookup } = state;
  const { setLookup } = actions;
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTER_OPTIONS,
    moveInDate: state.trip?.startDate || new Date(),
    moveOutDate: state.trip?.endDate || new Date(),
    flexibleMoveInStart: state.trip?.startDate || new Date(),
    flexibleMoveInEnd: state.trip?.startDate || new Date(),
    flexibleMoveOutStart: state.trip?.endDate || new Date(),
    flexibleMoveOutEnd: state.trip?.endDate || new Date(),
  });

  const handleFilterChange = (
    key: keyof FilterOptions,
    value: string | number | boolean | string[] | Date
  ) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const handleApply = async (listing: ListingAndImages) => {
    if (!state.hasApplication) {
      toast({
        title: "No Application Found",
        description: "You need to complete your application before applying to properties.",
        variant: "destructive",
        action: (
          <ToastAction altText="Go to Application" onClick={() => router.push(`${pathname}?tab=applications`, { scroll: true })}>
            Go to Application
          </ToastAction>
        ),
      });
      return;
    }

    setLookup(prev => {
      const newReqs = new Set(prev.requestedIds)
      newReqs.add(listing.id)
      return { ...prev, requestedIds: newReqs }
    })
    try {
      let response = await createDbHousingRequest(state.trip, listing)
      toast({
        title: "Application Sent",
        description: "Your application has been sent to the host.",
      });
    } catch (error) {
      console.error("Error sending application:", error);
      toast({
        title: "Error",
        description: "There was an error sending your application. Please try again.",
        variant: "destructive",
      });
    }
  }


  const logState = () => {
    const stateObject = {
      likedListings: state.likedListings,
      lookupFavIds: lookup.favIds,
      requestedListings: state.requestedListings,
      lookupRequestedIds: lookup.requestedIds,
    };
    console.log('stateObject', stateObject);
  }

  const handleUnapply = async (listing: ListingAndImages) => {
    setLookup(prev => {
      const newReqs = new Set(prev.requestedIds)
      newReqs.delete(listing.id)
      return { ...prev, requestedIds: newReqs }
    })
    await deleteDbHousingRequest(state.trip?.id, listing.id)
  }

  const generateLikedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Apply Now', action: () => handleApply(listing) }]
  }

  const generateRequestedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Unapply', action: () => handleUnapply(listing) }]
  }

  if (likedListings.length === 0 && requestedListings.length === 0 && maybedListings.length === 0) {
    return <div>No favorites found for this trip.</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-center mx-auto w-full px-2 py-8">
        <div className="w-full md:w-2/3 md:pr-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex border shadow-lg rounded-full">
              <button
                className={`p-2 px-4 rounded-l-full w-auto h-12 flex items-center justify-center ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className='w-[20px] h-[20px]' />
              </button>
              <Separator orientation="vertical" className='h-10 my-auto' />
              <button
                className={`p-2 px-4 rounded-r-full w-auto h-12 flex items-center justify-center ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className='w-[20px] h-[20px]' />
              </button>
            </div>
            <h2 className='text-2xl font-semibold hidden md:inline'>These ones caught your eye</h2>
            <FilterOptionsDialog
              isOpen={isOpen}
              onOpenChange={setIsOpen}
              filters={filters}
              onFilterChange={handleFilterChange}
              className=""
            />
          </div>

          {viewMode === 'grid' ? (
            <SearchListingsGrid
              listings={[...requestedListings, ...likedListings, ...maybedListings]}
              withCallToAction={true}
              cardActions={listing => lookup.requestedIds.has(listing.id) ?
                generateRequestedCardActions(listing) :
                generateLikedCardActions(listing)
              }
            />
          ) : (
            <SortableFavorites listings={likedListings.map((listing, idx) => ({ ...listing, rank: idx + 1 }))} />
          )}
        </div>
        <div className="w-full md:w-1/3 mt-4 md:mt-0">
          <SearchMap
            center={{ lat: state.trip?.latitude || 0, lng: state.trip?.longitude || 0 }}
            zoom={10}
            markers={likedListings.map(listing => ({ lat: listing.latitude, lng: listing.longitude }))}
          />
        </div>
      </div>
    </>
  );
}
