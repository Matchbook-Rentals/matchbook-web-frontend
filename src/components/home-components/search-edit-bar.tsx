import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SearchEditBarDesktop from "./search-edit-bar-desktop"; // Import the new desktop component
import SearchEditBarMobile from "./search-edit-bar-mobile"; // Import the new mobile component

interface SearchEditBarProps {
  className?: string;
  tripId?: string;
}

// Simple hook to check screen size (adjust breakpoint as needed)
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);

    // Set initial state
    listener();

    // Add listener for changes
    media.addEventListener('change', listener);

    // Cleanup listener on component unmount
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

const SearchEditBar: React.FC<SearchEditBarProps> = ({ className, tripId }) => {
  const params = useParams();
  // Use provided tripId or get it from the URL params
  const effectiveTripId = tripId || (params?.tripId as string);

  // Use md breakpoint (768px) to switch between mobile and desktop
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Render the appropriate component based on screen size
  return (
    <div className={className}>
      {isMobile ? (
        <SearchEditBarMobile tripId={effectiveTripId} />
      ) : (
        <SearchEditBarDesktop tripId={effectiveTripId} />
      )}
    </div>
  );
};

export default SearchEditBar;
