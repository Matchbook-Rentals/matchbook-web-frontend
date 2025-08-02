import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TallDialogContent,
  TallDialogTitle,
} from '@/constants/styles';
import { Star as StarIcon } from 'lucide-react';
import { ListingAndImages } from '@/types';
import { iconAmenities } from '@/lib/amenities-list';

interface AmenitiesSectionProps {
  listing: ListingAndImages;
  showFullAmenities?: boolean;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ 
  listing, 
  showFullAmenities = false 
}) => {
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
    <Card className="bg-[#FAFAFA] border-none rounded-xl mt-5">
      <CardContent className="flex flex-col items-start gap-[18px] p-5">
        <h3 className="font-['Poppins'] text-[20px] font-semibold text-[#373940]">
          Amenities
        </h3>
        
        {showFullAmenities ? (
          /* Full amenities list */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {displayAmenities.map((amenity) => (
              <div key={amenity.code} className="flex items-start gap-1.5">
                <div className="relative w-5 h-5">
                  {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                </div>
                <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                  {amenity.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Abbreviated list with modal */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {displayAmenities.slice(0, initialDisplayCount).map((amenity) => (
                <div key={amenity.code} className="flex items-start gap-1.5">
                  <div className="relative w-5 h-5">
                    {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                  </div>
                  <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                    {amenity.label}
                  </span>
                </div>
              ))}
            </div>
            {displayAmenities.length > initialDisplayCount && (
              <Dialog>
                <DialogTrigger className="mt-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className='font-["Poppins"] text-[14px] font-medium text-[#484A54] bg-neutral-50 mx-auto border-[#404040] rounded-[5px] w-full sm:w-auto sm:mx-0 px-3 py-2'
                  >
                    Show all {displayAmenities.length} amenities
                  </Button>
                </DialogTrigger>
                <DialogContent className={TallDialogContent}>
                  <h2 className={TallDialogTitle}>All Amenities</h2>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {displayAmenities.map((amenity) => (
                        <div key={amenity.code} className="flex items-start gap-1.5 py-2">
                          <div className="relative w-5 h-5">
                            {React.createElement(amenity.icon || StarIcon, { className: "absolute w-4 h-4 top-0.5 left-0.5" })}
                          </div>
                          <span className="font-['Poppins'] text-[16px] font-normal text-[#484A54]">
                            {amenity.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AmenitiesSection;