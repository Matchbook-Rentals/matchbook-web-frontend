import { MatchbookVerified } from '@/components/icons';
import * as AmenitiesIcons from '@/components/icons/amenities';
import { ListingAndImages } from '@/types';
import AmenityListItem from '../../searches/(components)/amenity-list-item';
import { iconAmenities } from '@/lib/amenities-list';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { TallDialogContent, TallDialogTitle, TallDialogTrigger, TallDialogTriggerText } from '@/constants/styles';
import { Star } from 'lucide-react';
import ShareButton from '@/components/ui/share-button';

const sectionStyles = 'border-b pb-5 mt-5';
const sectionHeaderStyles = 'text-[#404040] text-[24px] mb-3 font-medium';
const amenityTextStyle = 'text-[16px] md:text-[18px] lg:text-[20px] font-medium';
const bodyTextStyle = 'text-[14px] md:text-[16px] lg:text-[20px] font-normal';

interface ListingDescriptionProps {
  listing: ListingAndImages
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({ listing }) => {
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
    <div className='w-full  '>
      <div className='flex justify-between items-center border-b mt-6 mb-3'>
        <h1 className="text-[#404040]  text-[24px] sm:text-[32px] font-normal">
          {listing.title}
        </h1>
        <ShareButton />
      </div>
      <div className={`flex justify-between ${sectionStyles} text-[#404040] text-[16px]  sm:text-[24px] font-normal`}>
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
          <p>{listing.depositSize} sqft</p>
        </div>
      </div>


      {/* Highlights Section   */}
      <div className={sectionStyles}>

        <h3 className={sectionHeaderStyles}> Highlights </h3>

        <AmenityListItem
          icon={MatchbookVerified}
          label="Matchbook Verified Guests Preferred"
          labelClassNames={amenityTextStyle}
          iconClassNames='h-[32px] w-[32px]'
          className=' '
        />
        <div className="flex flex-col space-y-2">
          {/* Property Type */}
          {listing.category === "singleFamily" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
              label="Single Family"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {listing.category === "townhouse" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedTownhouseIcon}
              label="Townhouse"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {listing.category === "privateRoom" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleRoomIcon}
              label="Private Room"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedApartmentIcon}
              label="Apartment"
              labelClassNames={amenityTextStyle}
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}

          {/* Furnished Status */}
          <AmenityListItem
            icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />

          {/* Utilities */}
          <AmenityListItem
            icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
            label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />

          {/* Pets */}
          <AmenityListItem
            icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
            label={listing.petsAllowed ? "Pets Allowed" : "No Pets"}
            labelClassNames={amenityTextStyle}
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />
        </div>
      </div>



      {/* Description section */}
      <div className={sectionStyles}>
        <h3 className={sectionHeaderStyles}> Description </h3>
        <p className={bodyTextStyle}> {listing.description + listing.description + listing.description + listing.description} </p>
      </div>

      {/* Amenity section */}
      <div className={`${sectionStyles}`}>
        <h3 className={sectionHeaderStyles}>Amenities</h3>
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
            <DialogTrigger className=" mt-2 w-full sm:w-auto">
              <Button variant="outline" className='text-[16px] mx-auto border-[#404040] rounded-[5px] w-full sm:w-auto sm:mx-0' >
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
                  ).map(([category, amenities]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-[17px] font-medium text-[#404040] mb-2">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
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
      </div>



    </div >
  );
}

export default ListingDescription;
