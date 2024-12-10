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
      <div className="w-full relative hover:bg-gray-100 transition-colors p-3">
        <div className="absolute top-1 left-4 text-xs text-gray-500">Location</div>
        <input
          type="text"
          placeholder="Where to?"
          value={state.trip?.locationString || ''}
          className={inputClasses}
          readOnly
        />
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-3">
        <div className="absolute top-1 left-4 text-xs text-gray-500">Move In</div>
        <input
          type="text"
          placeholder="Move in:"
          value={formatDate(state.trip?.startDate)}
          className={inputClasses}
          readOnly
        />
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-3">
        <div className="absolute top-1 left-4 text-xs text-gray-500">Move Out</div>
        <input
          type="text"
          placeholder="Move out:"
          value={formatDate(state.trip?.endDate)}
          className={inputClasses}
          readOnly
        />
      </div>
      <div className="w-full relative hover:bg-gray-100 transition-colors p-3">
        <div className="absolute top-1 left-4 text-xs text-gray-500">Guests</div>
        <input
          type="text"
          placeholder="Who?"
          value={getTotalGuests()}
          className={`${inputClasses} sm:border-r-0`}
          readOnly
        />
      </div>
      <div className="w-full p-3">
        <button
          className="w-full p-3 bg-primaryBrand rounded-full hover:bg-primaryBrand/90 transition-colors"
        >
          <FaSearch className="text-white mx-auto" size={20} />
        </button>
      </div>
    </div>
  );
};

export default EditSearchInputsMobile;