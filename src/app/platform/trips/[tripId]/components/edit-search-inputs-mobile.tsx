import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTripContext } from "@/contexts/trip-context-provider";
import { useToast } from "@/components/ui/use-toast";
import { editTrip } from "@/app/actions/trips";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import { Check, X } from "lucide-react";
import GuestTypeCounter from "@/components/home-components/GuestTypeCounter";

interface Suggestion {
  place_id: string;
  description: string;
}

const PRESET_CITIES = [
  { description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
  { description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

const EditSearchInputsMobile: React.FC = () => {
  const { state } = useTripContext();
  const { toast } = useToast();

  // Active input state drives the sliding panels. (0 = location search,
  // 2 = move in, 3 = move out / date range slider, 4 = guest selector.)
  const [activeInput, setActiveInput] = useState<number | null>(null);

  // For location suggestions input when editing the location:
  const [inputValue, setInputValue] = useState("");

  // API suggestions for the location search text field.
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Preloaded data from state.trip for an existing trip.
  const [locationDisplayValue, setLocationDisplayValue] = useState(
    state.trip?.locationString || ""
  );
  const [selectedLocation, setSelectedLocation] = useState({
    description: state.trip?.locationString || "",
    lat: state.trip?.latitude || null,
    lng: state.trip?.longitude || null,
  });
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(
    {
      start: state.trip?.startDate ? new Date(state.trip.startDate) : null,
      end: state.trip?.endDate ? new Date(state.trip.endDate) : null,
    }
  );
  const [guests, setGuests] = useState({
    adults: state.trip?.numAdults || 0,
    children: state.trip?.numChildren || 0,
    pets: state.trip?.numPets || 0,
  });
  const [totalGuests, setTotalGuests] = useState<number>(
    (state.trip?.numAdults || 0) +
      (state.trip?.numChildren || 0) +
      (state.trip?.numPets || 0)
  );
  const [hasBeenSelected, setHasBeenSelected] = useState(false);

  const componentRef = useRef<HTMLDivElement>(null);

  // Close any sliding panel when clicking outside the component.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setActiveInput(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // When editing the location, fetch autocomplete suggestions.
  const handleLocationInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.length > 0) {
      try {
        const response = await fetch(
          `/api/places-autocomplete?input=${encodeURIComponent(newValue)}`
        );
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

  const prefetchGeocode = async (description: string) => {
    try {
      const trimmedDescription = description.slice(0, -5);
      await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
    } catch (error) {
      console.error("Error prefetching geocode:", error);
    }
  };

  // When a location is selected (from suggestions or preset cities), update the state.
  const handleLocationSelect = async (description: string, place_id: string) => {
    const trimmedDescription = description.slice(0, -5);
    const startTime = performance.now();

    setSelectedLocation({
      description: trimmedDescription,
      lat: null,
      lng: null,
    });
    setLocationDisplayValue(trimmedDescription);
    setInputValue("");
    setSuggestions([]);
    setActiveInput(3); // proceed to move in/out (date range selection)

    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(trimmedDescription)}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const endTime = performance.now();
        const elapsedMs = Math.round(endTime - startTime);
        // Optionally show a toast with elapsedMs if needed.
        setSelectedLocation((prev) => ({
          ...prev,
          lat,
          lng,
        }));
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  // Set active input panel.
  const handleInputClick = (index: number) => {
    if (index === 2) {
      setActiveInput(3);
    } else {
      setActiveInput(activeInput === index ? null : index);
    }
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
                  // Show preset cities when no input is entered.
                  PRESET_CITIES.map((city) => (
                    <div
                      key={city.description}
                      className="py-2 border-y font-light text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedLocation({
                          description: city.description,
                          lat: city.lat,
                          lng: city.lng,
                        });
                        setLocationDisplayValue(city.description);
                        setInputValue("");
                        setSuggestions([]);
                        setActiveInput(3);
                      }}
                    >
                      {city.description}
                    </div>
                  ))
                ) : (
                  // Show fetched suggestions.
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="py-2 border-y text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        handleLocationSelect(suggestion.description, suggestion.place_id)
                      }
                      onMouseEnter={() => prefetchGeocode(suggestion.description)}
                    >
                      {suggestion.description.slice(0, -5)}
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

  // Sliding panels for the date range and guest selection.
  const renderSlidingComponent = (index: number) => {
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
                  onProceed={() => setActiveInput(4)}
                />
              )}
              {index === 4 && (
                <div className="p-4">
                  <GuestTypeCounter guests={guests} setGuests={setGuests} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const handleReset = () => {
    setLocationDisplayValue(state.trip?.locationString || "");
    setSelectedLocation({
      description: state.trip?.locationString || "",
      lat: state.trip?.latitude || null,
      lng: state.trip?.longitude || null,
    });
    setDateRange({
      start: state.trip?.startDate ? new Date(state.trip.startDate) : null,
      end: state.trip?.endDate ? new Date(state.trip.endDate) : null,
    });
    setGuests({
      adults: state.trip?.numAdults || 0,
      children: state.trip?.numChildren || 0,
      pets: state.trip?.numPets || 0,
    });
    setActiveInput(null);
  };

  const handleSave = async () => {
    if (!state.trip?.id) {
      toast({
        variant: "destructive",
        description: "No trip ID found",
      });
      return;
    }

    const response = await editTrip(state.trip.id, {
      locationString: locationDisplayValue,
      latitude: selectedLocation.lat || undefined,
      longitude: selectedLocation.lng || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
    });

    if (response.success) {
      toast({
        description: "Trip updated successfully. Page will refresh...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast({
        variant: "destructive",
        description: response.error || "Failed to update trip",
      });
    }
  };

  const hasChanges = () => {
    const locationChanged = locationDisplayValue !== state.trip?.locationString;
    const startDateChanged =
      dateRange.start?.toISOString() !==
      (state.trip?.startDate ? new Date(state.trip.startDate).toISOString() : null);
    const endDateChanged =
      dateRange.end?.toISOString() !==
      (state.trip?.endDate ? new Date(state.trip.endDate).toISOString() : null);
    const guestsChanged =
      guests.adults !== state.trip?.numAdults ||
      guests.children !== state.trip?.numChildren ||
      guests.pets !== state.trip?.numPets;

    return locationChanged || startDateChanged || endDateChanged || guestsChanged;
  };

  return (
    <motion.div
      ref={componentRef}
      className="flex flex-col p-3 z-50 items-center bg-background rounded-3xl shadow-md overflow-hidden w-[60vw]"
      animate={{
        width: activeInput !== null ? "85vw" : "60vw",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      <input
        type="text"
        placeholder="Where to?"
        value={locationDisplayValue}
        className="w-full px-4 py-3 font-medium text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r border-gray-300 bg-transparent"
        readOnly
        onClick={() => handleInputClick(0)}
      />
      {renderLocationSuggestions()}

      <input
        type="text"
        placeholder="Move in"
        value={dateRange.start ? format(dateRange.start, "MMM d, yyyy") : ""}
        className="w-full px-4 py-3 font-medium text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r border-gray-300 bg-transparent"
        readOnly
        onClick={() => handleInputClick(2)}
      />
      <input
        type="text"
        placeholder="Move out"
        value={dateRange.end ? format(dateRange.end, "MMM d, yyyy") : ""}
        className="w-full px-4 py-3 font-medium text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r border-gray-300 bg-transparent"
        readOnly
        onClick={() => handleInputClick(3)}
      />
      {renderSlidingComponent(3)}

      <input
        type="text"
        placeholder="Who?"
        value={
          hasBeenSelected
            ? totalGuests
              ? `${totalGuests} Guest${totalGuests !== 1 ? "s" : ""}`
              : ""
            : ""
        }
        className="w-full px-4 py-3 font-medium text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r-0 bg-transparent"
        readOnly
        onClick={() => {
          setHasBeenSelected(true);
          handleInputClick(4);
        }}
      />
      {renderSlidingComponent(4)}

      <div className="w-full flex gap-2 p-2 justify-around">
        <button
          onClick={handleReset}
          disabled={!hasChanges()}
          className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed ${
            hasChanges() ? "text-red-500 hover:bg-red-50" : "text-gray-300"
          }`}
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges()}
          className={`p-2 rounded-full transition-colors disabled:cursor-not-allowed ${
            hasChanges() ? "text-green-500 hover:bg-green-50" : "text-gray-300"
          }`}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default EditSearchInputsMobile;
