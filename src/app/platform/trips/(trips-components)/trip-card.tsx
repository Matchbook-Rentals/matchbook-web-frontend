'use client';
import { Trip } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const getState = (stateInput: string): string => {
  // Normalize input by removing spaces and converting to uppercase
  const normalized = stateInput.trim().toUpperCase();

  // Map of state abbreviations and variations to full names
  const stateMap: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };

  // Return the mapped state name or the original input if not found
  return stateMap[normalized] || stateInput;
};

interface TripCardProps {
  trip: Trip;
  onDelete: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const locationElements = trip.locationString.split(',');
  const stateName = getState(locationElements[locationElements.length - 1]);
  const statePhotoPath = `/State Photos/${stateName}.jpg`;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(trip.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className='group flex max-w-[320px] active:bg-gray-300 pr-2 border-background hover:bg-gray-100 border rounded-[15px] transition-colors duration-100'>

        <div className="relative group">
          <Image src={statePhotoPath} height={400} width={400} className='h-[134px]  min-w-[143px] w-[143px] rounded-[15px]' />
          <div
            onClick={handleDeleteClick}
            className="absolute xs:opacity-0 group-hover:opacity-100 flex top-2 left-2 p-1.5 bg-background/60 rounded-full cursor-pointer hover:bg-background transition-opacity duration-200 ease-in-out"
          >
            <Trash2 className="w-5 h-5 text-[#404040]" />
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className='absolute z-50'>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className='bg-background' onClick={(e) => e.stopPropagation()}>
              <DialogTitle className='w-full text-center'><p className='font-montserrat-medium text-[#404040] text-xl font-normal'>Delete Search</p></DialogTitle>
              <p className='font-montserrat-normal text-lg text-[#404040]'>
                Are you sure you want to delete this search and any matches you&apos;ve made? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button className='bg-background hover:bg-gray-100 text-[#404040] font-montserrat font-medium border rounded-md' onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button className='bg-red-700 hover:bg-red-600 font-montserrat font-semibold' onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className='flex flex-col justify-between max-w-[200px] sm:max-w-[150px] ml-4 pt-1'>
          <h2 className='truncate font-medium  text-[16px]'>{trip.locationString}</h2>
          <h2 className='truncate'>{trip.searchRadius || '50 miles (m)'}</h2>
          <h2 className='truncate'>{trip.startDate?.toLocaleDateString()} - {trip.endDate?.toLocaleDateString()}</h2>
          <h2 className='truncate'>
            {/* Price display logic: shows range or 'any' if no prices set */}
            {(() => {
              if (!trip.minPrice && !trip.maxPrice) return '$ any';
              if (trip.minPrice && trip.maxPrice) return `$${trip.minPrice} - $${trip.maxPrice}`;
              if (trip.minPrice) return `$${trip.minPrice} or more`;
              if (trip.maxPrice) return `$${trip.maxPrice} or less`;
            })()}
          </h2>

        </div>
      </div >

    </>
  )
}


export default TripCard;
