import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import SearchInputsDesktop from "./SearchInputsDesktop";
import SearchInputsMobile from "./SearchInputsMobile";

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
    <>
      <div className={`mx-auto hidden sm:block p-2 ${className || ""}`}>
        <div className="relative">
          <SearchInputsDesktop hasAccess={hasAccess} />
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className="relative">
          <SearchInputsMobile hasAccess={hasAccess} />
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
