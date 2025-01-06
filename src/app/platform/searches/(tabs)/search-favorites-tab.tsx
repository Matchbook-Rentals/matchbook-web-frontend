import React, { useState, useEffect } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import SearchMap from '../(components)/search-map';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createDbHousingRequest, deleteDbHousingRequest } from '@/app/actions/housing-requests';
import SearchListingsGrid from '../(components)/search-listings-grid';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';

export default function SearchFavoritesTab() {
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && viewMode === 'list') {
        setViewMode('grid');
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  if (likedListings.length === 0 && requestedListings.length === 0 && maybedListings.length === 0) {
    return <div>No favorites found for this trip.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row justify-center mx-auto w-full px-2 ">
      <div className="w-full md:w-3/5 md:pr-4">

        <SearchListingsGrid
          listings={[...likedListings, ...maybedListings].sort((a, b) => {
            const aRequested = lookup.requestedIds.has(a.id);
            const bRequested = lookup.requestedIds.has(b.id);
            return bRequested ? 1 : aRequested ? -1 : 0;
          })}
          withCallToAction={true}
          cardActions={listing => lookup.requestedIds.has(listing.id) ?
            generateRequestedCardActions(listing) :
            generateLikedCardActions(listing)
          }
        />
      </div>
      <div className="w-full md:w-2/5 mt-4 md:mt-0">
        <SearchMap
          center={{ lat: state.trip?.latitude || 0, lng: state.trip?.longitude || 0 }}
          zoom={10}
          markers={likedListings.map(listing => ({ lat: listing.latitude, lng: listing.longitude }))}
        />
      </div>
    </div>
  );
}
