'use client';
import { Trip } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
              onClick={() => router.push(`trips/${trip.id}`)}
            >
              Continue Search
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-md h-9 w-9 border border-gray-200"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <Button
                  variant="ghost"
                  className="w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(trip.id);
                  }}
                >
                  Delete search
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </>
  )
}

export default TripCard;
