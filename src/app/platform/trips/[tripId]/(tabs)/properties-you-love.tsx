import React, { useContext, useState } from 'react';
import { TripContext } from '@/contexts/trip-context-provider';
import TripListingCard from '../../(trips-components)/trip-listing-card';
import { ListingAndImages } from '@/types';
import CustomAccordion from '@/components/ui/custom-accordion';
import { Button } from '@/components/ui/button';

export default function PropertiesYouLoveTab() {
  const tripContext = useContext(TripContext);
  const [isOpen, setIsOpen] = useState(true);

  if (tripContext === undefined) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  const { likedListings, requestedListings, setLookup, actions, trip } = tripContext!;


  const handleApply = async (listing: ListingAndImages) => {
    setLookup(prev => {
      const newReqs = new Set(prev.requestedIds)
      newReqs.add(listing.id)
      return { ...prev, requestedIds: newReqs }
    })
    await actions.createDbHousingRequest(trip.userId, listing.id, trip.id, trip.startDate, trip.endDate)
  }

  const handleUnapply = async (listing: ListingAndImages) => {
    setLookup(prev => {
      const newReqs = new Set(prev.requestedIds)
      newReqs.delete(listing.id)
      return { ...prev, requestedIds: newReqs }
    })
    await actions.deleteDbHousingRequest(trip.id, listing.id);
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
          {/* Comment this button out in jsx */}
          {/*
      <Button
          className="bg-primaryBrand/80 hover:bg-primaryBrand text-xl font-semibold py-3 pb-10 flex items-center text-black block mt-5 mx-auto"
              onClick={() => console.log(likedListings.length)}
                  >
           Back to New Possibilites
                </Button>
                */}
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
