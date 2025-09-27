import React, { useState } from 'react';
import { useTripContext } from '@/contexts/trip-context-provider';
import TripListingCard from '../../(trips-components)/trip-listing-card';
import { ListingAndImages } from '@/types';
import CustomAccordion from '@/components/ui/custom-accordion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/ui/brandButton";

export default function PropertiesYouLoveTab() {
  const [isOpen, setIsOpen] = useState(true);
  const { likedListings, requestedListings, setLookup, actions, trip, application } = useTripContext();
  const router = useRouter();
  const pathname = usePathname();

  const handleApply = async (listing: ListingAndImages) => {
    // Check if user is trying to apply to their own listing
    if (trip?.userId && listing.userId === trip.userId) {
      toast({
        title: "Cannot Apply to Own Listing",
        description: "You cannot apply to your own property listing.",
        variant: "destructive",
      });
      return;
    }

    if (!application?.isComplete) {
      toast({
        title: "Application Incomplete",
        description: "You need to complete your application before applying to properties.",
        action: (
          <BrandButton size="sm" onClick={() => router.push(`${pathname}?tab=applications`, { scroll: true })}>
            Complete Application
          </BrandButton>
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
      let response = await actions.createDbHousingRequest(trip, listing)
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

  const handleUnapply = async (listing: ListingAndImages) => {
    setLookup(prev => {
      const newReqs = new Set(prev.requestedIds)
      newReqs.delete(listing.id)
      return { ...prev, requestedIds: newReqs }
    })
    await actions.deleteDbHousingRequest(trip.id, listing.id);
  }

  const generateLikedCardActions = (listing: ListingAndImages) => {
    return [{ label: 'Apply Now', action: () => handleApply(listing) }];
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
