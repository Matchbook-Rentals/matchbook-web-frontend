import React, { useState } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import TripListingCard from '../../(trips-components)/trip-listing-card';
import { ListingAndImages } from '@/types';
import CustomAccordion from '@/components/ui/custom-accordion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function PropertiesYouLoveTab() {
  const [isOpen, setIsOpen] = useState(true);
  const { state, actions } = useTripContext();
  const { likedListings, requestedListings } = state;
  const router = useRouter();
  const pathname = usePathname();


  const handleUnapply = async (listing: ListingAndImages) => {
    await actions.optimisticRemoveApply(listing.id);
  }

  const generateLikedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Apply Now', action: () => actions.optimisticApply(listing) }];
  }

  const generateRequestedCardActions = (listing: ListingAndImages) => {

    return [{ label: 'Retract Application', action: () => handleUnapply(listing) }]
  }

  if (likedListings.length === 0 && requestedListings.length === 0) {
    return <div>No favorites found for this trip.</div>;
  }

  return (
    <>
      {/* Debug: Application Complete Status: {application?.isComplete?.toString()} */}
      {requestedListings.length > 0 &&
        <CustomAccordion
          title="Submitted Applications"
          labelClassName="bg-primaryBrand/80 pl-5 rounded-none"
          contentClassName="bg-primaryBrand/80"
          isOpen={isOpen}
          toggleOpen={() => setIsOpen((prev) => !prev)}
        >
          <div className="flex justify-center mx-auto w-full  px-2 py-8 ">
            <div className="grid lg:grid-cols-3 md:grid-cols-2 2xl:grid-cols-4 w-full sm:grid-cols-1 gap-2 lg:gap-5 ">
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
      {likedListings.length === 0 ? (
        <>
          <h3 className='text-center text-xl'>Applied for all liked listing, please return to new possibilites tab to find more listings!</h3>
          <Button
            className="bg-primaryBrand/80 hover:bg-primaryBrand text-xl font-semibold py-3 pb-10 flex items-center  block mt-5 mx-auto"
            onClick={() => router.push(`${pathname}?tab=properties-you-love`)}
          >
            Back to New Possibilites
          </Button>
        </>
      ) : (
        <div className="flex justify-center mx-auto w-full  px-2 py-8 border">
          <div className="grid lg:grid-cols-3 md:grid-cols-2 2xl:grid-cols-4 w-full sm:grid-cols-1 gap-2 lg:gap-5 border">
            {likedListings.map((listing, index) => (
              <TripListingCard
                key={index}
                listing={listing}
                actions={generateLikedCardActions(listing)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
