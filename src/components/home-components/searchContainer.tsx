import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchContainerProps {
  className?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ className }) => {
  return (
    <div className={`mx-auto p-2 ${className || ''}`}>
      <div className="flex p-3 items-center bg-white rounded-full shadow-md overflow-hidden">
        <input
          type="text"
          placeholder="Where to?"
          disabled
          className="w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed border-r border-gray-300"
        />
        <input
          type="text"
          placeholder="Move in:"
          disabled
          className="w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed border-r border-gray-300"
        />
        <input
          type="text"
          placeholder="Move out:"
          disabled
          className="w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed border-r border-gray-300"
        />
        <input
          type="text"
          placeholder="Who?"
          disabled
          className="w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none disabled:bg-transparent cursor-not-allowed"
        />
        <button className="p-3 cursor-not-allowed bg-primaryBrand rounded-full">
          <FaSearch className="text-white" size={20} />
        </button>
      </div>
    </div>
  );
};

export default SearchContainer;
