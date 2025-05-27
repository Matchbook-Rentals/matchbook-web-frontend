import React, { useState, useEffect, useRef } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import { ListingAndImages } from '@/types';
import SearchMap from '../(components)/search-map';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createDbHousingRequest, deleteDbHousingRequest } from '@/app/actions/housing-requests';
import SearchFavoriteGrid from '../(components)/search-favorite-grid';
import { FilterOptions, DEFAULT_FILTER_OPTIONS } from '@/lib/consts/options';
import { Button } from '@/components/ui/button';

export default function SearchFavoritesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { state, actions } = useTripContext();
  const { likedListings, requestedListings, lookup } = state;
  const { setLookup } = actions;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null); // Keep this ref
  const [startY, setStartY] = useState(0); // Keep state
  const [viewportHeight, setViewportHeight] = useState(0); // Keep state
  const [calculatedHeight, setCalculatedHeight] = useState(0); // Keep state
  const [currentComponentHeight, setCurrentComponentHeight] = useState(0); // Keep state

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
    params.set('tab', 'recommended');
    const url = `${pathname}?${params.toString()}`;
    router[action](url);
  };

  const handleApply = async (listing: ListingAndImages) => {
    if (!state.hasApplication) {
      toast({
        title: "No Application Found",
        description: "You need to complete your application before applying to properties. (Coming soon!)",
        variant: "destructive",
        //action: (
        //  <ToastAction altText="Go to Application" >
        //    Go to Application
        //  </ToastAction>
        //),
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
    return [{ label: 'Retract Application', action: () => handleUnapply(listing), variant: 'destructive' }]
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
        setCurrentComponentHeight(containerRef.current.offsetHeight);
        containerRef.current.style.minHeight = `${newCalculatedHeight}px`;
      }
    };

    setHeight();
    window.addEventListener('resize', setHeight);

    return () => {
      window.removeEventListener('resize', setHeight);
    };
  }, []); // Keep this useEffect

  if (likedListings.length === 0 && requestedListings.length === 0) {
    // Apply height calculation even for the "no listings" view
    return (
      <div className='flex flex-col items-center justify-center h-[50vh]'>
        {(() => {
          handleTabChange('prefetch');
          return null;
        })()}
        <p className='font-montserrat-regular text-2xl mb-5'>You haven&apos;t liked any listings!</p>
        <p className='mt-3'> Let&apos;s get you a match! </p>
        <div className='flex justify-center gap-x-2 mt-2'>
          <Button
            onClick={() => handleTabChange()}
          >
            Show Recommended
            </Button>
        </div>
      </div>
    )
  }

  return (
    // Apply ref and minHeight style
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row justify-center mx-auto w-full"
      style={{ minHeight: calculatedHeight ? `${calculatedHeight}px` : 'auto' }} // Apply calculated minHeight
    >
      <div className="w-full ">
        <SearchFavoriteGrid
          listings={[...likedListings].sort((a, b) => {
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
    </div>
  );
}
