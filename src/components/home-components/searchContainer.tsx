import React from "react";
import SearchInputsDesktop from "./search-inputs-desktop";
import SearchInputsMobile from "./search-inputs-mobile";
import { useAuth, useUser } from "@clerk/nextjs";

interface SearchContainerProps {
  className?: string;
  containerStyles?: string;
  inputStyles?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
  className,
  containerStyles,
  inputStyles,
  searchButtonClassNames,
  searchIconColor
}) => {
  const [hasAccess, setHasAccess] = React.useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  React.useEffect(() => {
    const checkAccess = async () => {
      if (isSignedIn && user) {
        const userRole = user.publicMetadata.role as string;
        setHasAccess(userRole === 'moderator' || userRole === 'admin' || userRole === 'beta_user');
      } else {
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, user]);

  return (
    <>
      <div className={`mx-auto hidden sm:block p-2 ${className || ""}`}>
        <div className={`relative`}>
          <SearchInputsDesktop 
            hasAccess={hasAccess} 
            inputClassName={inputStyles} 
            className={containerStyles} 
            searchButtonClassNames={searchButtonClassNames}
            searchIconColor={searchIconColor}
          />
        </div>
      </div>
      <div className={`mx-auto block sm:hidden p-2 ${className || ""}`}>
        <div className={`relative ${containerStyles || ""}`}>
          <SearchInputsMobile 
            hasAccess={hasAccess} 
            inputClassName={inputStyles} 
            className={containerStyles} 
            searchButtonClassNames={searchButtonClassNames}
            searchIconColor={searchIconColor}
          />
        </div>
      </div>
    </>
  );
};

export default SearchContainer;
