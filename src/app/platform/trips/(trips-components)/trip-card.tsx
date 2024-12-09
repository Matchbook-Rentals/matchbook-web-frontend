'use client';
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
  imageSrc?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  tripId: string;
  onDelete: (tripId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({
  imageSrc = "/api/placeholder/400/320",
  city = "Seattle",
  state = "WA",
  startDate = "06/08/24",
  endDate = "06/12/24",
  tripId,
  onDelete
}) => {
  const stateName = getState(state);
  const statePhotoPath = `/State Photos/${stateName}.jpg`;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation();
    onDelete(tripId);
  };

  return (
    <div className="relative max-w-[300px] rounded-lg overflow-hidden duration-300 group" data-trip-id={tripId}>
      <div className="relative">
        <img
          src={statePhotoPath || imageSrc}
          alt={`${city}, ${state}`}
          className="aspect-[297/276] object-cover"
        />
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div onClick={handleDeleteClick} className="bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
            <div className="text-red-500 hover:text-red-800 text-3xl font-bold cursor-pointer leading-none flex items-center justify-center" style={{ marginTop: '-2px' }}>✕</div>
          </div>
        </div>
      </div>
      <div className="p-2 bg-white">
        <div className="text-[30px] font-medium text-[#404040] font-montserrat">
          {city}, {state}
        </div>
        <div className="text-[26px] text-[#404040] font-montserrat">
          {startDate} - {endDate}
        </div>
      </div>
    </div>
  );
};

export default TripCard;
