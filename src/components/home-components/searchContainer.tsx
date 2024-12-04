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

  return (
    <div className={`mx-auto p-2 ${className || ""}`}>
      <div className="relative">
        <div className="flex flex-col sm:flex-row p-3 items-center bg-gray-100 rounded-3xl sm:rounded-full shadow-md overflow-hidden">
          <input
            type="text"
            placeholder="Where to?"
            className={`w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent
              ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
            readOnly={!hasAccess}
          />
          <input
            type="text"
            placeholder="Move in:"
            className={`w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent
              ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
            readOnly={!hasAccess}
          />
          <input
            type="text"
            placeholder="Move out:"
            className={`w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none sm:border-r border-gray-300 bg-transparent
              ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
            readOnly={!hasAccess}
          />
          <input
            type="text"
            placeholder="Who?"
            className={`w-full sm:w-1/4 px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent
              ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
            readOnly={!hasAccess}
          />
          <button
            disabled={!hasAccess}
            className={`w-full sm:w-auto mt-3 sm:mt-0 p-3 bg-primaryBrand rounded-full
              ${!hasAccess ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <FaSearch className="text-white mx-auto" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchContainer;
