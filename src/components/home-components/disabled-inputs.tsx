import React from 'react';
import { FaSearch } from 'react-icons/fa';

const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 cursor-not-allowed opacity-50 bg-transparent`


export const DisabledDesktopInputs: React.FC = () => {
  return (
    <div className="relative test">
      <div
        className="flex flex-row no-wrap p-3 test items-center bg-gray-100 rounded-full shadow-md overflow-hidden"
      >
        <input
          type="text"
          placeholder="Where to?"
          value={""}
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Move on in:"
          value={""}
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Move out:"
          value={""}
          className={inputClasses}
          readOnly
        />
        <input
          type="text"
          placeholder="Who?"
          value={""}
          className={`${inputClasses} sm:border-r-0`}
          readOnly
        />
        <div className="flex-shrink-0">
          <button
            disabled
            className="w-auto p-3 cursor-not-allowed opacity-50 bg-primaryBrand rounded-full"
          >
            <FaSearch className="text-white mx-auto" size={20} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-xl shadow-lg z-50
            before:content-[''] before:absolute before:-top-2 before:left-5 before:w-4 before:h-4
            before:bg-white before:rotate-45 before:border-l before:border-t before:border-gray-200">
          {renderActiveContent()}
        </div>
      )}
    </div>

  );
};

export const DisabledMobileInputs: React.FC = () => {
  return (
    <div className="flex flex-col p-3 items-center bg-gray-100 rounded-3xl shadow-md overflow-hidden">
      <input
        type="text"
        placeholder="Where to?"
        className={inputClasses}
        readOnly
      />
      <input
        type="text"
        placeholder="Move in:"
        className={inputClasses}
        readOnly
      />
      <input
        type="text"
        placeholder="Move out:"
        className={inputClasses}
        readOnly
      />
      <input
        type="text"
        placeholder="Who?"
        className={inputClasses}
        readOnly
      />
      <button
        disabled
        className={`w-full mt-3 p-3 cursor-pointer cursor-not-allowed opacity-50 bg-primaryBrand rounded-full`}
      >
        <FaSearch className="text-white mx-auto" size={20} />
      </button>
    </div>

  );
};
