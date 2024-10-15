import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchContainerProps {
  className?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ className }) => {
  return (
    <div className={`mx-auto p-2 ${className || ''}`}>
      <div className="relative">
        <div className="flex flex-col sm:flex-row p-3 items-center bg-white rounded-3xl sm:rounded-full shadow-md overflow-hidden">
          <input
            type="text"
            placeholder="Where to?"
            disabled
            className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed sm:border-r border-gray-300"
          />
          <input
            type="text"
            placeholder="Move in:"
            disabled
            className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed sm:border-r border-gray-300"
          />
          <input
            type="text"
            placeholder="Move out:"
            disabled
            className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed sm:border-r border-gray-300"
          />
          <input
            type="text"
            placeholder="Who?"
            disabled
            className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed"
          />
          <button className="w-full sm:w-auto mt-3 sm:mt-0 p-3 cursor-not-allowed bg-primaryBrand rounded-full">
            <FaSearch className="text-white mx-auto" size={20} />
          </button>
        </div>
        <div className="absolute inset-0 bg-gray-400 opacity-50 rounded-3xl sm:rounded-full cursor-not-allowed"></div>
      </div>
    </div>
  );
};

export default SearchContainer;
