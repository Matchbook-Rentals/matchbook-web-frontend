'use client';
import { Trip } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
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

  // Format date range for display
  const dateRangeText = trip.startDate && trip.endDate ?
    `${trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
     ${trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })},
     ${Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))} days` :
    'No dates selected';

  // Format price range for display
  const getPriceDisplay = () => {
    if (!trip.minPrice && !trip.maxPrice) return 'No price range';
    if (trip.minPrice && trip.maxPrice) return `$${trip.minPrice.toLocaleString()}-$${trip.maxPrice.toLocaleString()}/ Month`;
    if (trip.minPrice) return `$${trip.minPrice.toLocaleString()} or more/ Month`;
    if (trip.maxPrice) return `$${trip.maxPrice.toLocaleString()} or less/ Month`;
  };

  return (
    <>
      <div className="border border-blue-500 rounded-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="font-medium text-gray-900">{trip.locationString}</h2>
          <p className="text-sm text-gray-600">{dateRangeText}</p>
          <p className="text-sm text-gray-600">Within {trip.searchRadius} miles</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <div className="text-right font-medium">{getPriceDisplay()}</div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md px-4 py-2 text-sm font-medium w-full md:w-auto"
              variant="ghost"
            >
              Continue Search
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-md h-9 w-9 border border-gray-200"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Delete search</span>
            </Button>
          </div>
        </div>
      </div>

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
    </>
  )
}

export default TripCard;
