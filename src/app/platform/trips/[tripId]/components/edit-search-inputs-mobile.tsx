import React from "react";
import { FaSearch } from "react-icons/fa";
import { useTripContext } from "@/contexts/trip-context-provider";

const EditSearchInputsMobile: React.FC = () => {
  const { state } = useTripContext();
  const inputClasses = "w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTotalGuests = () => {
    const total = (state.trip?.numAdults || 0) +
                 (state.trip?.numChildren || 0) +
                 (state.trip?.numPets || 0);
    return total ? `${total} Guest${total !== 1 ? 's' : ''}` : '';
  };

  return (
    <div className="flex flex-col items-center bg-background rounded-3xl shadow-md overflow-hidden">
      <div className="w-full relative hover:bg-gray-100 transition-colors p-2 border-b border-gray-300">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-gray-500 px-4">Location</span>
          <input
            type="text"
            placeholder="Where to?"
            value={state.trip?.locationString || ''}
            className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            readOnly
          />
        </div>
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-2 border-b border-gray-300">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-gray-500 px-4">Move In</span>
          <input
            type="text"
            placeholder="Move in:"
            value={formatDate(state.trip?.startDate)}
            className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            readOnly
          />
        </div>
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-2 border-b border-gray-300">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-gray-500 px-4">Move Out</span>
          <input
            type="text"
            placeholder="Move out:"
            value={formatDate(state.trip?.endDate)}
            className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            readOnly
          />
        </div>
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-2">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-gray-500 px-4">Guests</span>
          <input
            type="text"
            placeholder="Who?"
            value={getTotalGuests()}
            className="w-full px-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            readOnly
          />
        </div>
      </div>
      <div className="w-full p-2">
        <button
          className="w-full p-2 bg-primaryBrand rounded-full hover:bg-primaryBrand/90 transition-colors"
        >
          <FaSearch className="text-white mx-auto" size={20} />
        </button>
      </div>
    </div>
  );
};

export default EditSearchInputsMobile;