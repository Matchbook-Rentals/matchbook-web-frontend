import React from "react";
import { FaSearch } from "react-icons/fa";

interface SearchContainerProps {
  className?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ className }) => {
  return (
    <>
      <div className={`mx-auto hidden sm:block p-2 ${className || ""}`}>
        <div className="relative">
          <div className="flex flex-col sm:flex-row p-3 items-center bg-gray-100 rounded-3xl sm:rounded-full shadow-md overflow-hidden disabled">
            <input
              type="text"
              placeholder="Where to?"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Move in:"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Move out:"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Who?"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <button
              disabled
              className="w-full sm:w-auto mt-3 sm:mt-0 p-3 cursor-not-allowed bg-primaryBrand rounded-full opacity-50"
            >
              <FaSearch className="text-white mx-auto" size={20} />
            </button>
          </div>
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className="relative">
          <div className="flex flex-col sm:flex-row p-3 items-center bg-gray-100 rounded-3xl sm:rounded-full shadow-md overflow-hidden disabled">
            <input
              type="text"
              placeholder="Where to?"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Move in:"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Move out:"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <input
              type="text"
              placeholder="Who?"
              className="w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none cursor-not-allowed opacity-50 bg-transparent"
              readOnly
            />
            <button
              disabled
              className="w-full sm:w-auto mt-3 sm:mt-0 p-3 cursor-not-allowed bg-primaryBrand rounded-full opacity-50"
            >
              <FaSearch className="text-white mx-auto" size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
