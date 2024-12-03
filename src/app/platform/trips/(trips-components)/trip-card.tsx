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

const TripCard = ({
  imageSrc = "/api/placeholder/400/320",
  city = "Seattle",
  state = "WA",
  startDate = "06/08/24",
  endDate = "06/12/24"
}) => {
  const stateName = getState(state);
  const statePhotoPath = `/State Photos/${stateName}.jpg`;

  return (
    <div className="relative  max-w-[300px] rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <img
          src={statePhotoPath || imageSrc}
          alt={`${city}, ${state}`}
          className="aspect-[297/276] object-cover"
        />
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