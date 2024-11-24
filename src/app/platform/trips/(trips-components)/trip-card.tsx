import React from 'react';

const TripCard = ({
  imageSrc = "/api/placeholder/400/320",
  city = "Seattle",
  state = "WA",
  startDate = "06/08/24",
  endDate = "06/12/24"
}) => {
  return (
    <div className="relative w-48 rounded-lg overflow-hidden  hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-w-4 aspect-h-3">
        <img
          src={imageSrc}
          alt={`${city}, ${state}`}
          className="w-full h-32 object-cover"
        />
      </div>
      <div className="p-2 bg-white">
        <div className="text-sm font-medium text-gray-900">
          {city}, {state}
        </div>
        <div className="text-xs text-gray-500">
          {startDate} - {endDate}
        </div>
      </div>
    </div>
  );
};

export default TripCard;