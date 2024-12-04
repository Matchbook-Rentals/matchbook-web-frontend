import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useAuth, useUser } from "@clerk/nextjs";

interface SearchContainerProps {
  className?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({ className }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      }
    };

    checkAccess();
  }, [isSignedIn, user]);

  // Common input classes based on access
  const inputClasses = `w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 ${
    hasAccess ? '' : 'cursor-not-allowed opacity-50'
  } bg-transparent`;

  // Common search container content
  const searchContent = (
    <div className="flex flex-col sm:flex-row p-3 items-center bg-gray-100 rounded-3xl sm:rounded-full shadow-md overflow-hidden">
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
        className={`w-full sm:w-auto mt-3 sm:mt-0 p-3 ${
          hasAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
        } bg-primaryBrand rounded-full`}
      >
        <FaSearch className="text-white mx-auto" size={20} />
      </button>
    </div>
  );

  return (
    <>
      <div className={`mx-auto hidden sm:block p-2 ${className || ""}`}>
        <div className="relative">
          {searchContent}
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className="relative">
          {searchContent}
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
