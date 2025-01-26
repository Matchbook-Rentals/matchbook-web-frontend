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

interface ListingDescriptionProps {
  listing: ListingAndImages
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({ listing }) => {
  const calculateDisplayAmenities = () => {
    const displayAmenities = [];
    for (let amenity of iconAmenities) {
      if (listing[amenity.code]) {
        displayAmenities.push(amenity);
      }
    }
    return displayAmenities;
  };

  const displayAmenities = calculateDisplayAmenities();
  const initialDisplayCount = 6;
  return (
    <div className='w-full  '>
      <h1 className="text-[#404040] border-b mt-6 mb-3 text-[32px] font-normal">
        Ogden Mountain Home
      </h1>
      <div className="flex justify-between border-b pb-3 text-[#404040] text-[24px] font-normal">
        <p> 8 beds | 2 Baths </p>
        <p> 1,000 sqft </p>
      </div>


      {/* Highlights   */}
      <div className='border-b'>

        <h3 className="text-[#404040] text-[24px] my-3  font-medium"> Highlights </h3>

        <AmenityListItem
          icon={MatchbookVerified}
          label="Matchbook Verified Guests Preferred"
          labelClassNames='text-[20px] font-medium'
          iconClassNames='h-[32px] w-[32px]'
          className=' '
        />
        <div className="flex flex-col space-y-2">
          {/* Property Type */}
          {listing.category === "singleFamily" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleFamilyIcon}
              label="Single Family"
              labelClassNames='text-[20px] font-medium'
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {listing.category === "townhouse" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedTownhouseIcon}
              label="Townhouse"
              labelClassNames='text-[20px] font-medium'
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {listing.category === "privateRoom" && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedSingleRoomIcon}
              label="Private Room"
              labelClassNames='text-[20px] font-medium'
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}
          {(listing.category === "apartment" || listing.category === "condo") && (
            <AmenityListItem
              icon={AmenitiesIcons.UpdatedApartmentIcon}
              label="Apartment"
              labelClassNames='text-[20px] font-medium'
              iconClassNames='h-[32px] w-[32px]'
              className=' '
            />
          )}

          {/* Furnished Status */}
          <AmenityListItem
            icon={listing.furnished ? AmenitiesIcons.UpdatedFurnishedIcon : AmenitiesIcons.UpdatedUnfurnishedIcon}
            label={listing.furnished ? "Furnished" : "Unfurnished"}
            labelClassNames='text-[20px] font-medium'
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />

          {/* Utilities */}
          <AmenityListItem
            icon={listing.utilitiesIncluded ? AmenitiesIcons.UpdatedUtilitiesIncludedIcon : AmenitiesIcons.UpdatedUtilitiesNotIncludedIcon}
            label={listing.utilitiesIncluded ? "Utilities Included" : "No Utilities"}
            labelClassNames='text-[20px] font-medium'
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />

          {/* Pets */}
          <AmenityListItem
            icon={listing.petsAllowed ? AmenitiesIcons.UpdatedPetFriendlyIcon : AmenitiesIcons.UpdatedPetUnfriendlyIcon}
            label={listing.petsAllowed ? "Pets Allowed" : "No Pets"}
            labelClassNames='text-[20px] font-medium'
            iconClassNames='h-[32px] w-[32px]'
            className=' '
          />
        </div>
      </div>



      {/* Description section */}
      <div className='pb-3 border-b'>
        <h3 className="text-[#404040] text-[24px] mt-3 mb-6 font-medium"> Description </h3>
        <p className='text-[20px] font-normal'> {listing.description + listing.description + listing.description + listing.description} </p>
      </div>

      {/* Description section */}
      <div className="pb-3 border-b mt-3">
        <h3 className="text-[24px] text-[#404040] font-medium mb-4">Amenities</h3>
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8 space-y-2 md:space-y-0">
          {displayAmenities.slice(0, initialDisplayCount).map((amenity) => (
            <AmenityListItem
              key={amenity.code}
              icon={amenity.icon || Star}
              label={amenity.label}
              labelClassNames='text-[20px] font-medium'
              iconClassNames='h-[32px] w-[32px]'
            />
          ))}
        </div>
        {displayAmenities.length > initialDisplayCount && (
          <Dialog>
            <DialogTrigger className=" mt-2">
              <Button variant="outline" className='text-[16px]' >
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
                          labelClassNames='md:text-[16px]'
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
