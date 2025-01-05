'use client';
import { Trip } from '@prisma/client';
import Image from 'next/image';
import React from 'react';

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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation();
    onDelete(trip.id);
  };

  return (
    <div className='flex max-w-[320px] active:bg-gray-300 pr-2 border-background hover:border-gray-300 border rounded-[15px] transition-colors duration-100'>
      <Image src={statePhotoPath} height={400} width={400} className='h-[134px] w-[143px] rounded-[15px] ' />
      <div className='flex flex-col justify-between max-w-[150px] ml-4 pt-1'>
        <h2 className='truncate font-medium  text-[16px]'>{trip.locationString}</h2>
        <h2 className='truncate'>{trip.searchRadius || '50 miles (m)'}</h2>
        <h2 className='truncate'>{trip.startDate?.toLocaleDateString()} - {trip.endDate?.toLocaleDateString()}</h2>
        <h2 className='truncate'>{trip.maxPrice || '$ any'}</h2>

      </div>
    </div >
  );
};

export default TripCard;
