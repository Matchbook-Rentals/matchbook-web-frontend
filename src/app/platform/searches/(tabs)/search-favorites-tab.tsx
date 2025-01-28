import React, { useState, useEffect, useRef } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import SearchMap from '../(components)/search-map';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createDbHousingRequest, deleteDbHousingRequest } from '@/app/actions/housing-requests';
import SearchListingsGrid from '../(components)/search-listings-grid';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { Button } from '@/components/ui/button';

export default function SearchFavoritesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { state, actions } = useTripContext();
  const { likedListings, requestedListings, maybedListings, lookup } = state;
  const { setLookup } = actions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(0);
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0);

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

  const handleTabChange = (action: 'push' | 'prefetch' = 'push') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'matchmaker');
    const url = `${pathname}?${params.toString()}`;
    router[action](url);
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

  useEffect(() => {
    const setHeight = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newStartY = containerRect.top;
        const newViewportHeight = window.innerHeight;
        const newCalculatedHeight = newViewportHeight - newStartY;
        setStartY(newStartY);
        setViewportHeight(newViewportHeight);
        setCalculatedHeight(newCalculatedHeight);
        setCurrentComponentHeight(containerRef.current.offsetHeight) ;
        containerRef.current.style.minHeight = `${newCalculatedHeight}px`;
      }
    };

    setHeight();
    window.addEventListener('resize', setHeight);

    return () => {
      window.removeEventListener('resize', setHeight);
    };
  }, []);

  if (likedListings.length === 0 && requestedListings.length === 0 && maybedListings.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        {(() => {
          handleTabChange('prefetch');
          return null;
        })()}
        <p className='font-montserrat-regular text-2xl mb-5'>You haven&apos;t liked any listings!</p>
        <p className='mt-3'> Let&apos;s get you a match! </p>
        <div className='flex justify-center gap-x-2 mt-2'>
          <button
            onClick={() => handleTabChange()}
            className="px-4 py-2 bg-[#4F4F4F] text-background rounded-md hover:bg-[#404040]"
          >
            Try Matchmaker
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row justify-center mx-auto w-full px-2 ">
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
          height={calculatedHeight}
        />
      </div>
      <div className="w-full md:w-2/5 mt-4 md:mt-0">
        <SearchMap
          center={{ lat: state.trip?.latitude || 0, lng: state.trip?.longitude || 0 }}
          zoom={10}
          markers={[...likedListings, ...maybedListings].map(listing => ({ lat: listing.latitude, lng: listing.longitude }))}
          height={`${calculatedHeight}px`}
        />
      </div>
    </div>
  );
}
