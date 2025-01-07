import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { DisabledMobileInputs } from "./disabled-inputs";

interface SearchInputsMobileProps {
  hasAccess: boolean;
}

const SearchInputsMobile: React.FC<SearchInputsMobileProps> = ({ hasAccess }) => {
  const [activeInput, setActiveInput] = useState<number | null>(null);

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r border-gray-300 ${
    hasAccess ? '' : 'cursor-not-allowed opacity-50'
  } bg-transparent`;

  if (!hasAccess) return <DisabledMobileInputs />;

  const renderSlidingComponent = (index: number) => {
    return (
      <AnimatePresence>
        {activeInput === index && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-background border-t border-b border-gray-200 overflow-hidden"
          >
            <div className="p-4">
              Sliding content for input {index + 1}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="flex flex-col p-3 items-center bg-background rounded-3xl shadow-md overflow-hidden">
      <input
        type="text"
        placeholder="Where to?"
        className={inputClasses}
        readOnly={!hasAccess}
        onClick={() => setActiveInput(0)}
      />
      {renderSlidingComponent(0)}

      <input
        type="text"
        placeholder="Move in:"
        className={inputClasses}
        readOnly={!hasAccess}
        onClick={() => setActiveInput(1)}
      />
      {renderSlidingComponent(1)}

      <input
        type="text"
        placeholder="Move out:"
        className={inputClasses}
        readOnly={!hasAccess}
        onClick={() => setActiveInput(2)}
      />
      {renderSlidingComponent(2)}

      <input
        type="text"
        placeholder="Who?"
        className={`${inputClasses} sm:border-r-0`}
        readOnly={!hasAccess}
        onClick={() => setActiveInput(3)}
      />
      {renderSlidingComponent(3)}

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
