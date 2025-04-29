import React, { useState } from 'react'; // Import useState
import { MatchbookVerified } from '@/components/icons';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ListingAndImages } from '@/types';
import AmenityListItem from '../../searches/(components)/amenity-list-item';
import { iconAmenities } from '@/lib/amenities-list';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,   // Import DialogHeader
  DialogTitle,    // Import DialogTitle
  DialogFooter,   // Import DialogFooter
  DialogClose,    // Import DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label';       // Import Label
import {
  TallDialogContent, // Keep this if used for the amenities dialog
  TallDialogTitle,
  TallDialogTrigger,
  TallDialogTriggerText,
} from '@/constants/styles';
import { Star as StarIcon } from 'lucide-react'; // Renamed Star to StarIcon for clarity
import ShareButton from '@/components/ui/share-button';
import { usePathname, useParams } from 'next/navigation';
import { VerifiedBadge, TrailBlazerBadge, HallmarkHostBadge } from '@/components/icons'; // Assuming these icons exist

// Define the desired order for amenity categories
const categoryOrder = ['basics', 'accessibility', 'location', 'parking', 'kitchen', 'luxury', 'laundry', 'other'];

// Define your base URL; for example, using an environment variable.
const baseUrl = process.env.NEXT_PUBLIC_URL || "";

const sectionStyles = 'border-b pb-5 mt-5';
const sectionHeaderStyles = 'text-[#404040] text-[24px] mb-3 font-medium';
const amenityTextStyle = 'text-[16px] md:text-[18px] lg:text-[20px] font-medium';
const bodyTextStyle = 'text-[14px] md:text-[16px] lg:text-[20px] font-normal';

interface ListingDescriptionProps {
  listing: ListingAndImages;
  showFullAmenities?: boolean;
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({ listing, showFullAmenities = false }) => {
  const [message, setMessage] = useState(''); // State for the message textarea
  const pathname = usePathname();
  const { tripId } = useParams();

  const calculateDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if ((listing as any)[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  const displayAmenities = calculateDisplayAmenities();
  const initialDisplayCount = 6;

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center border-b mt-6 mb-3'>
        <h1 className="text-[#404040] text-[24px] sm:text-[32px] font-normal">
          {listing.title}
        </h1>
        <ShareButton
          title={`${listing.title} on Matchbook`}
          text={`Check out this listing on Matchbook: ${pathname}`}
          url={`${baseUrl}/guest/trips/${tripId}/listing/${listing.id}`}
        />
      </div>
      <div className={`flex justify-between ${sectionStyles} text-[#404040] text-[16px] sm:text-[24px] font-normal`}>
        <div className="lg:hidden w-full flex flex-col space-y-6">
          <div className="w-full flex justify-between">
            <p>{listing.roomCount} beds | {listing.bathroomCount} Baths</p>
            <p>${listing.price?.toLocaleString()}/month</p>
          </div>
          <div className="w-full flex justify-between">
            <p>{listing.squareFootage.toLocaleString()} sqft</p>
            <p>${listing.depositSize ? listing.depositSize.toLocaleString() : 'N/A'} deposit</p>
          </div>
        </div>
        <div className="hidden lg:flex w-full justify-between">
          <p>{listing.roomCount} beds | {listing.bathroomCount} Baths</p>
          <p>{listing.squareFootage.toLocaleString()} sqft</p>
        </div>
      </div>

      {/* Highlights Section */}
      <div className={sectionStyles}>
        <h3 className={sectionHeaderStyles}> Highlights </h3>
        <AmenityListItem
          icon={MatchbookVerified}
          label="Matchbook Verified Guests Preferred"
          labelClassNames={amenityTextStyle}
          iconClassNames='h-[32px] w-[32px]'
        />
        <div className="flex flex-col space-y-2">
          {/* Category-dependent icons */}
          {listing.category === "singleFamily" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
              label="Single Family"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
            />
          )}
          {listing.category === "townhouse" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedTownhouseIcon}
              label="Townhouse"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
            />
          )}
          {listing.category === "privateRoom" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleRoomIcon}
              label="Private Room"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
            />
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedApartmentIcon}
              label="Apartment"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
            />
          )}

          {/* Furnished Status */}
          <AmenityListItem
            icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
          />

          {/* Utilities */}
          <AmenityListItem
            icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
            label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
          />

          {/* Pets */}
          <AmenityListItem
            icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
            label={listing.petsAllowed ? "Pets Allowed" : "No Pets"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
          />
        </div>
      </div>

      {/* Host Information Section - Updated Rating Display */}
      <div className={`${sectionStyles} lg:hidden`}>
        {/* Host Information Section */}
        <div className='mb-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <p className="md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-medium">Hosted by {listing.user?.firstName || 'Unknown'}</p>
            <p className={`md:text-[16px] lg:text-[18px] xl:text-[22px] 2xl:text-[24px] font-normal flex gap-x-2 items-center`}>
              <StarIcon className="w-4 h-4" /> {listing?.averageRating || listing.uScore ? (listing?.averageRating || listing.uScore?.toFixed(1)) : 'N/A'}
              <span className='text-sm pt-0 pl-0 -translate-x-1'>({listing?.numberOfStays || 23})</span>
            </p>
          </div>
        </div>

        {/* Host Badges Section */}
        <div className='flex justify-between gap-2'>
          <span className="flex items-center gap-1 text-sm"><VerifiedBadge />Verified</span>
          <span className="flex items-center gap-1 text-sm"><TrailBlazerBadge />Trail Blazer</span>
          <span className="flex items-center gap-1 text-sm"><HallmarkHostBadge />Hallmark Host</span>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline' className='w-full border-black mt-4'>
              Message Host
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Message Host</DialogTitle>
              {/* Optional: Add DialogDescription if needed */}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right sr-only">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="col-span-4"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col items-end space-y-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-1/4">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={() => console.log('Send clicked', message)} className="w-1/4"> {/* Placeholder for send action */}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Description section */}
      <div className={sectionStyles}>
        <h3 className={sectionHeaderStyles}> Description </h3>
        <p className={bodyTextStyle}>
          {listing.description + listing.description + listing.description + listing.description}
        </p>
      </div>

      {/* Amenity section */}
      <div className={`${sectionStyles}`}>
        <h3 className={sectionHeaderStyles}>Amenities</h3>
        
        {showFullAmenities ? (
          /* Full amenities list */
          <div className="flex flex-col">
            {Object.entries(
              displayAmenities.reduce((acc, amenity) => {
                const category = amenity.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(amenity);
                return acc;
              }, {} as Record<string, typeof displayAmenities>)
            )
            .sort(([catA], [catB]) => {
              const indexA = categoryOrder.indexOf(catA);
              const indexB = categoryOrder.indexOf(catB);
              // Handle categories not in the predefined order (put them at the end)
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            })
            .map(([category, amenities]) => (
              <div key={category} className="mb-4">
                <h3 className="text-[17px] font-medium text-[#404040] mb-2 capitalize">
                  {category}
                </h3>
                <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8 space-y-2 md:space-y-0">
                  {amenities.map((amenity) => (
                    <AmenityListItem
                      key={amenity.code}
                      icon={amenity.icon || Star}
                      label={amenity.label}
                      iconClassNames='h-[24px] w-[24px]'
                      labelClassNames={amenityTextStyle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Abbreviated list with modal */
          <>
            <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8 space-y-2 md:space-y-0">
              {displayAmenities.slice(0, initialDisplayCount).map((amenity) => (
                <AmenityListItem
                  key={amenity.code}
                  icon={amenity.icon || Star}
                  label={amenity.label}
                  labelClassNames={amenityTextStyle}
                  iconClassNames='h-[32px] w-[32px]'
                />
              ))}
            </div>
            {displayAmenities.length > initialDisplayCount && (
              <Dialog>
                <DialogTrigger className="mt-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className='text-[16px] mx-auto border-[#404040] rounded-[5px] w-full sm:w-auto sm:mx-0'
                  >
                    Show all {displayAmenities.length} amenities
                  </Button>
                </DialogTrigger>
                <DialogContent className={TallDialogContent}>
                  <h2 className={TallDialogTitle}>All Amenities</h2>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col">
                      {Object.entries(
                        displayAmenities.reduce((acc, amenity) => {
                          const category = amenity.category || 'Other';
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(amenity);
                          return acc;
                        }, {} as Record<string, typeof displayAmenities>)
                      )
                      .sort(([catA], [catB]) => {
                        const indexA = categoryOrder.indexOf(catA);
                        const indexB = categoryOrder.indexOf(catB);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      })
                      .map(([category, amenities]) => (
                        <div key={category} className="mb-6">
                          <h3 className="text-[17px] font-medium text-[#404040] mb-2 capitalize">
                            {category}
                          </h3>
                          {amenities.map((amenity) => (
                            <AmenityListItem
                              key={amenity.code}
                              icon={amenity.icon || Star}
                              label={amenity.label}
                              iconClassNames='h-[24px] w-[24px]'
                              labelClassNames={amenityTextStyle}
                              className='py-2 border-b border-[#40404080] space-y-2'
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ListingDescription;
