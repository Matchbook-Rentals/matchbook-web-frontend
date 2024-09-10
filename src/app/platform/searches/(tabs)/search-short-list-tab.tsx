import React, { useState } from 'react';
import { useSearchContext } from '@/contexts/search-context-provider';
import TripListingCard from '../../trips/(trips-components)/trip-listing-card';
import { ListingAndImages } from '@/types';
import CustomAccordion from '@/components/ui/custom-accordion';
import SearchMap from '../(components)/search-map';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { createDbHousingRequest, deleteDbHousingRequest } from '@/app/actions/housing-requests';
import SortableFavorites from '../(components)/sortable-favorites';

export default function ShortListTab() {
  const [isOpen, setIsOpen] = useState(true);
  const { state, actions } = useSearchContext();
  const { likedListings, requestedListings, lookup } = state;
  const { setLookup } = actions;
  const router = useRouter();
  const pathname = usePathname();

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
      let response = await createDbHousingRequest(state.currentSearch, listing)
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
    await deleteDbHousingRequest(state.currentSearch?.id, listing.id)
  }

  const generateLikedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Apply Now', action: () => handleApply(listing) }]
  }

  const generateRequestedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Unapply', action: () => handleUnapply(listing) }]
  }

  if (likedListings.length === 0 && requestedListings.length === 0) {
    return <div>No favorites found for this trip.</div>;
  }

  return (
    <>
      {requestedListings.length > 0 &&
        <CustomAccordion
          title="Submitted Applications"
          labelClassName="bg-primaryBrand/80 pl-5 rounded-none"
          contentClassName="bg-primaryBrand/80"
          isOpen={isOpen}
          toggleOpen={() => setIsOpen((prev) => !prev)}
        >
          <div className="flex justify-center mx-auto w-full px-2 py-8">
            <div className="flex flex-col space-y-4 pr-4">
              {requestedListings.map((listing, index) => (
                <TripListingCard
                  key={index}
                  listing={listing}
                  actions={generateRequestedCardActions(listing)}
                />
              ))}
            </div>
          </div>
        </CustomAccordion>
      }
      {likedListings.length > 0 &&
        <CustomAccordion
          title="Properties You &lt;3"
          labelClassName=" pl-5 rounded-none"
          contentClassName="bg-primaryBrand/80"
          isOpen={isOpen}
          toggleOpen={() => setIsOpen((prev) => !prev)}
        >
          <div className="flex justify-center mx-auto w-full px-2 py-8">
            <div className="flex flex-wrap w-full justify-evenly space-y-4 pr-4">
              {likedListings.map((listing, index) => (
                <TripListingCard
                  key={index}
                  listing={listing}
                  actions={generateLikedCardActions(listing)}
                />
              ))}
            </div>
          </div>
        </CustomAccordion>
      }
      {likedListings.length === 0 ? (
        <>
          <h3 className='text-center text-xl'>Applied for all liked listing, please return to new possibilites tab to find more listings!</h3>
          <Button
            className="bg-primaryBrand/80 hover:bg-primaryBrand text-xl font-semibold py-3 pb-10 flex items-center text-black block mt-5 mx-auto"
            onClick={() => router.push(`${pathname}?tab=properties-you-love`)}
          >
            Back to New Possibilites
          </Button>
        </>
      ) : (
        <div className="flex justify-center mx-auto w-full px-2 py-8 ">
          <div className="w-full md:w-2/3 pr-4 ">
            <h2 onClick={() => alert(lookup.requestedIds.size)} className='text-2xl font-semibold text-center'>Properties You &lt;3</h2>
            <SortableFavorites listings={likedListings.map((listing, idx) => ({ ...listing, rank: idx + 1 }))} />
          </div>
          <div className="w-full md:w-1/3">
            <SearchMap center={{ lat: state.currentSearch?.latitude || 0, lng: state.currentSearch?.longitude || 0 }} zoom={10} markers={likedListings.map(listing => ({ lat: listing.latitude, lng: listing.longitude }))} />
          </div>
        </div>
      )}
    </>
  );
}