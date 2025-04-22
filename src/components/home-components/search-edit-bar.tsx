import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SearchEditBarDesktop from "./search-edit-bar-desktop"; // Import the new desktop component
import SearchEditBarMobile from "./search-edit-bar-mobile"; // Import the new mobile component
import { Trip } from "@prisma/client"; // Add Trip type import

interface SearchEditBarProps {
  className?: string;
  trip: Trip; // Receive the full trip object
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

const SearchEditBar: React.FC<SearchEditBarProps> = ({ className, trip }) => {
  // Use md breakpoint (768px) to switch between mobile and desktop
  const isMobile = useMediaQuery("(max-width: 768px)");

  // If trip is not provided (e.g., used outside TripCard context), handle appropriately
  // For now, we assume trip is always provided when this component is rendered via TripCard
  if (!trip) {
    // Optional: Render a loading state or null, or throw an error
    console.error("SearchEditBar requires a 'trip' prop.");
    return null;
  }

  // Render the appropriate component based on screen size
  return (
    <div className={className}>
      {isMobile ? (
        <SearchEditBarMobile trip={trip} />
      ) : (
        <SearchEditBarDesktop trip={trip} />
      )}
    </div>
  );
};

export default SearchEditBar;
