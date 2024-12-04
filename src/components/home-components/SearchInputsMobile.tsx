import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchInputsMobileProps {
  hasAccess: boolean;
}

const SearchInputsMobile: React.FC<SearchInputsMobileProps> = ({ hasAccess }) => {
  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 ${
    hasAccess ? '' : 'cursor-not-allowed opacity-50'
  } bg-transparent`;

  return (
    <div className="flex flex-col p-3 items-center bg-gray-100 rounded-3xl shadow-md overflow-hidden">
      <input
        type="text"
        placeholder="Where to?"
        className={inputClasses}
        readOnly={!hasAccess}
      />
      <input
        type="text"
        placeholder="Move in:"
        className={inputClasses}
        readOnly={!hasAccess}
      />
      <input
        type="text"
        placeholder="Move out:"
        className={inputClasses}
        readOnly={!hasAccess}
      />
      <input
        type="text"
        placeholder="Who?"
        className={`${inputClasses} sm:border-r-0`}
        readOnly={!hasAccess}
      />
      <button
        disabled={!hasAccess}
        className={`w-full mt-3 p-3 ${
          hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        } bg-primaryBrand rounded-full`}
      >
        <FaSearch className="text-white mx-auto" size={20} />
      </button>
    </div>
  );
};

export default SearchInputsMobile;