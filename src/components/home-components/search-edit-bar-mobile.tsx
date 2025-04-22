import React, { useState, useEffect, useRef } from "react";
// import { useParams } from "next/navigation"; // Removed
import { Trip } from "@prisma/client";
import { editTrip } from "@/app/actions/trips";
import { useToast } from "@/components/ui/use-toast"; // Keep for potential errors during save
import { MapPin, Calendar, Users, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import GuestTypeCounter from "./GuestTypeCounter";
// import { Skeleton } from "@/components/ui/skeleton"; // Removed

interface Suggestion {
  place_id: string;
  description: string;
}

interface SearchEditBarMobileProps {
  className?: string;
  trip: Trip; // Receive the full trip object
}

const PRESET_CITIES = [
  { description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
  { description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

const SearchEditBarMobile: React.FC<SearchEditBarMobileProps> = ({
  className,
  trip, // Use the passed trip prop
}) => {
  // const params = useParams(); // Removed
  const { toast } = useToast();
  // const effectiveTripId = tripId || (params?.tripId as string); // Removed

  // const [trip, setTrip] = useState<Trip | null>(null); // Removed - use prop directly
  // const [loading, setLoading] = useState(true); // Removed

  const [activeInput, setActiveInput] = useState<number | null>(null); // 0: Location, 3: Date, 4: Guests
  const [inputValue, setInputValue] = useState(""); // For location search input
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Initialize state directly from the trip prop
  const [selectedLocation, setSelectedLocation] = useState<{
    description: string;
    lat: number | null;
    lng: number | null;
  }>({
    description: trip.locationString || '',
    lat: trip.latitude || null,
    lng: trip.longitude || null
  });
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: trip.startDate ? new Date(trip.startDate) : null,
    end: trip.endDate ? new Date(trip.endDate) : null,
  });
  const [guests, setGuests] = useState({
    adults: trip.numAdults || 0,
    children: trip.numChildren || 0,
    pets: trip.numPets || 0
  });
  const [totalGuests, setTotalGuests] = useState(
    (trip.numAdults || 0) + (trip.numChildren || 0) + (trip.numPets || 0)
  );
  const [flexibility, setFlexibility] = useState<{ start: "exact" | number | null; end: "exact" | number | null }>({
    start: trip.flexibleStart === 0 ? "exact" : trip.flexibleStart,
    end: trip.flexibleEnd === 0 ? "exact" : trip.flexibleEnd,
  });

  const componentRef = useRef<HTMLDivElement>(null);

  // Removed fetchTripData useEffect

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setActiveInput(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update total guests
  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const inputClasses = `w-full px-4 py-3 font-normal text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none border border-gray-200 rounded-full bg-white mb-3 transition-all duration-300 hover:shadow-sm`;

  const prefetchGeocode = async (description: string) => {
    try {
      const trimmedDescription = description.slice(0, -5); // Assuming format "City, ST, USA"
      await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
    } catch (error) {
      console.error("Error prefetching geocode:", error);
    }
  };

  const handleLocationInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.length > 0) {
      try {
        const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(newValue)}`);
        const data = await response.json();
        setSuggestions(data.predictions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleLocationSelect = async (description: string, place_id?: string, lat?: number, lng?: number) => {
    const trimmedDescription = description.endsWith(", USA") ? description.slice(0, -5) : description;

    // Immediately update display
    setSelectedLocation({ description: trimmedDescription, lat: lat || null, lng: lng || null });
    setInputValue("");
    setSuggestions([]);
    setActiveInput(3); // Move to date selection

    // If lat/lng not provided (e.g., from autocomplete), fetch them
    if ((!lat || !lng) && place_id) {
      try {
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`); // Use address for geocode
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const { lat: fetchedLat, lng: fetchedLng } = data.results[0].geometry.location;
          setSelectedLocation((prev) => ({ ...prev, lat: fetchedLat, lng: fetchedLng }));
        } else {
          toast({ variant: "destructive", description: "Could not find coordinates for location." });
          setSelectedLocation((prev) => ({ ...prev, lat: null, lng: null })); // Clear coords if fetch fails
        }
      } catch (error) {
        console.error("Error fetching geocode:", error);
        toast({ variant: "destructive", description: "Error fetching location details." });
        setSelectedLocation((prev) => ({ ...prev, lat: null, lng: null })); // Clear coords on error
      }
    } else if (lat && lng) {
      // If lat/lng were provided (e.g., preset city), update state directly
      setSelectedLocation({ description: trimmedDescription, lat: lat, lng: lng });
    }
  };


  const handleInputClick = (index: number) => {
    setActiveInput(activeInput === index ? null : index);
  };

  // Check if form has changes compared to the original trip data (passed as prop)
  const hasChanges = () => {
    // Trip prop is guaranteed to exist here based on parent component logic
    const locationChanged = selectedLocation.description !== trip.locationString ||
      selectedLocation.lat !== trip.latitude ||
      selectedLocation.lng !== trip.longitude;

    // Compare dates by converting to ISO strings or null
    const currentStartDateStr = dateRange.start ? dateRange.start.toISOString().split('T')[0] : null;
    const tripStartDateStr = trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : null;
    const currentEndDateStr = dateRange.end ? dateRange.end.toISOString().split('T')[0] : null;
    const tripEndDateStr = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : null;

    const startDateChanged = currentStartDateStr !== tripStartDateStr;
    const endDateChanged = currentEndDateStr !== tripEndDateStr;

    const guestsChanged = guests.adults !== trip.numAdults ||
      guests.children !== trip.numChildren ||
      guests.pets !== trip.numPets;

    // Compare flexibility
    const normalizedFlexibleStart = flexibility.start === 0 ? 'exact' : flexibility.start;
    const normalizedTripFlexibleStart = trip.flexibleStart === 0 ? 'exact' : trip.flexibleStart;
    const normalizedFlexibleEnd = flexibility.end === 0 ? 'exact' : flexibility.end;
    const normalizedTripFlexibleEnd = trip.flexibleEnd === 0 ? 'exact' : trip.flexibleEnd;

    const flexibleStartChanged = normalizedFlexibleStart !== normalizedTripFlexibleStart;
    const flexibleEndChanged = normalizedFlexibleEnd !== normalizedTripFlexibleEnd;


    return locationChanged || startDateChanged || endDateChanged || guestsChanged || flexibleStartChanged || flexibleEndChanged;
  };

  // Reset form to original trip data (passed as prop)
  const handleReset = () => {
    // Trip prop is guaranteed to exist
    setSelectedLocation({
      description: trip.locationString || '',
      lat: trip.latitude || null,
      lng: trip.longitude || null
    });
    setDateRange({
      start: trip.startDate ? new Date(trip.startDate) : null,
      end: trip.endDate ? new Date(trip.endDate) : null,
    });
    setGuests({
      adults: trip.numAdults || 0,
      children: trip.numChildren || 0,
      pets: trip.numPets || 0
    });
    setFlexibility({ // Reset flexibility
      start: trip.flexibleStart === 0 ? "exact" : trip.flexibleStart,
      end: trip.flexibleEnd === 0 ? "exact" : trip.flexibleEnd,
    });
    setActiveInput(null); // Close any open sections
  };

  // Save changes
  const handleSave = async () => {
    // Use trip.id directly
    if (!trip.id) {
      toast({ variant: "destructive", description: "Trip ID is missing" });
      return;
    }
    if (!selectedLocation.lat || !selectedLocation.lng) {
      toast({ variant: "destructive", description: "Please select a valid location with coordinates." });
      setActiveInput(0); // Open location input
      return;
    }

    const response = await editTrip(trip.id, { // Use trip.id
      locationString: selectedLocation.description,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
      flexibleStart: flexibility.start === "exact" ? 0 : flexibility.start, // Save flexibility
      flexibleEnd: flexibility.end === "exact" ? 0 : flexibility.end,
    });

    if (response.success) {
      toast({ description: "Trip updated successfully. Page will refresh..." });
      setActiveInput(null); // Close any open sections
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast({ variant: "destructive", description: response.error || "Failed to update trip" });
    }
  };

  // Removed loading state rendering

  const renderSlidingComponent = (index: number) => {
    if (index !== 3 && index !== 4) return null; // Only for Date (3) and Guests (4)

    return (
      <AnimatePresence>
        {activeInput === index && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: "1500px", opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full bg-background border-t border-b border-gray-200 overflow-hidden"
          >
            <div className="p-0">
              {index === 3 && (
                <MobileDateRange
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  onClose={() => setActiveInput(null)}
                  onProceed={() => setActiveInput(4)} // Proceed to guests
                  minimumDateRange={{ months: 1 }}
                  maximumDateRange={{ months: 12 }}
                // Pass flexibility props if MobileDateRange supports them
                // onFlexibilityChange={setFlexibility}
                // initialFlexibility={flexibility}
                />
              )}
              {index === 4 && (
                <div className="p-4">
                  <GuestTypeCounter guests={guests} setGuests={setGuests} />
                  {/* Add button or logic to close guest section if needed */}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const renderLocationSuggestions = () => {
    return (
      <AnimatePresence>
        {activeInput === 0 && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: "1500px", opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="bg-background border-t border-b border-gray-200 overflow-hidden w-full"
          >
            <div className="px-4 py-2 w-full">
              <input
                value={inputValue}
                onChange={handleLocationInput}
                placeholder="Enter an address or city"
                type="text"
                className="w-full text-lg focus:outline-none mb-3"
                autoFocus
              />
              <ScrollArea className="h-[200px]">
                {inputValue.length === 0 ? (
                  PRESET_CITIES.map((city) => (
                    <div
                      key={city.description}
                      className="py-2 border-y font-light text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleLocationSelect(city.description, undefined, city.lat, city.lng)}
                    >
                      {city.description}
                    </div>
                  ))
                ) : (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="py-2 border-y text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleLocationSelect(suggestion.description, suggestion.place_id)}
                      onMouseEnter={() => prefetchGeocode(suggestion.description)}
                    >
                      {suggestion.description.slice(0, -5)} {/* Assuming ", USA" suffix */}
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Removed loading state rendering

  return (
    <motion.div // Keep motion.div for other potential animations (like sliding components)
      ref={componentRef}
      // Control width directly with className based on activeInput state
      className={`flex flex-col mx-auto p-4 z-50 items-center bg-background rounded-3xl border border-black overflow-hidden ${activeInput !== null ? 'w-[85vw]' : 'w-[80vw]'} ${className || ''}`}
    // Removed animate and transition props for width
    >
      {/* Added Mobile Header */}
      <div className="w-full text-center mb-4">
        <h2 className="text-xl font-semibold">Edit Trip Details</h2>
      </div>

      {/* Location Input */}
      <div
        className={`${inputClasses} flex items-center justify-between`}
        onClick={() => handleInputClick(0)}
      >
        <div className="flex items-center">
          <MapPin size={20} className="text-gray-500 mr-3" />
          <span className="truncate">{selectedLocation.description || "Where to"}</span>
        </div>
        <span className="text-xs text-gray-400 ml-2">Edit</span>
      </div>
      {renderLocationSuggestions()}

      {/* Date Input */}
      <div
        className={`${inputClasses} flex items-center justify-between`}
        onClick={() => handleInputClick(3)}
      >
        <div className="flex items-center">
          <Calendar size={20} className="text-gray-500 mr-3" />
          {dateRange.start && dateRange.end
            ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
            : dateRange.start
              ? `${format(dateRange.start, 'MMM d')} - Select`
              : 'Dates'}
        </div>
        <span className="text-xs text-gray-400 ml-2">Edit</span>
      </div>
      {renderSlidingComponent(3)}

      {/* Guests Input */}
      <div
        className={`${inputClasses} sm:border-r-0 flex items-center justify-between`}
        onClick={() => handleInputClick(4)}
      >
        <div className="flex items-center">
          <Users size={20} className="text-gray-500 mr-3" />
          {`${totalGuests} Renter${totalGuests !== 1 ? 's' : ''}`}
        </div>
        <span className="text-xs text-gray-400 ml-2">Edit</span>
      </div>
      {renderSlidingComponent(4)}

      {/* Action Buttons */}
      <div className="flex gap-4 w-full mt-2">
        <button
          onClick={handleReset}
          disabled={!hasChanges()}
          className={`flex-1 py-2 px-4 rounded-full transition-colors border
              ${hasChanges()
              ? 'border-red-500 text-red-500 hover:bg-red-50'
              : 'border-gray-300 text-gray-300 cursor-not-allowed'
            }`}
          aria-label="Reset changes"
        >
          <X className="h-5 w-5 mx-auto" />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges()}
          className={`flex-1 py-2 px-4 rounded-full transition-colors border
              ${hasChanges()
              ? 'border-green-500 text-green-500 hover:bg-green-50'
              : 'border-gray-300 text-gray-300 cursor-not-allowed'
            }`}
          aria-label="Save changes"
        >
          <Check className="h-5 w-5 mx-auto" />
        </button>
      </div>
    </motion.div>
  );
};

export default SearchEditBarMobile;
