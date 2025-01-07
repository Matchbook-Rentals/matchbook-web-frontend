import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { DisabledMobileInputs } from "./disabled-inputs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuggestedLocation } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createTrip } from "@/app/actions/trips";

interface Suggestion {
  place_id: string;
  description: string;
}

interface SearchInputsMobileProps {
  hasAccess: boolean;
}

const PRESET_CITIES = [
  { description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
  { description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

const SearchInputsMobile: React.FC<SearchInputsMobileProps> = ({ hasAccess }) => {
  const [activeInput, setActiveInput] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    description: string;
    lat: number | null;
    lng: number | null;
  }>({
    description: '',
    lat: null,
    lng: null
  });
  const router = useRouter();
  const { toast } = useToast();

  const inputClasses = `w-full px-4 py-3 font-medium text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none sm:border-r border-gray-300 ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-transparent`;

  const prefetchGeocode = async (description: string) => {
    try {
      const trimmedDescription = description.slice(0, -5);
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

  const handleLocationSelect = async (description: string, place_id: string) => {
    const trimmedDescription = description.slice(0, -5);
    const startTime = performance.now();

    setSelectedLocation({
      description: trimmedDescription,
      lat: null,
      lng: null
    });
    setInputValue("");
    setSuggestions([]);
    setActiveInput(null);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const endTime = performance.now();
        const elapsedMs = Math.round(endTime - startTime);

        //toast({
        //  title: "Location selected",
        //  description: `${trimmedDescription} (processed in ${elapsedMs}ms)`,
        //  style: { backgroundColor: '#f5f5f5', border: 'black solid 1px' }
        //});

        setSelectedLocation((prev) => ({
          ...prev,
          lat: lat,
          lng: lng
        }));
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  const handleInputClick = (index: number) => {
    setActiveInput(activeInput === index ? null : index);
  };

  const renderSlidingComponent = (index: number) => {
    if (index === 0) return null; // Skip for location input as it has its own renderer

    return (
      <AnimatePresence>
        {activeInput === index && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: "500px", opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
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

  const renderLocationSuggestions = () => {
    return (
      <AnimatePresence>
        {activeInput === 0 && (
          <motion.div
            initial={{ maxHeight: 0, opacity: 0 }}
            animate={{ maxHeight: "500px", opacity: 1 }}
            exit={{ maxHeight: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="bg-background border-t border-b border-gray-200 overflow-hidden"
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
                  // Show preset cities when input is empty
                  PRESET_CITIES.map((city) => (
                    <div
                      key={city.description}
                      className="py-2 border-y font-light text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedLocation({
                          description: city.description,
                          lat: city.lat,
                          lng: city.lng
                        });
                        setInputValue("");
                        setSuggestions([]);
                        setActiveInput(null);
                      }}
                    >
                      {city.description}
                    </div>
                  ))
                ) : (
                  // Show API suggestions when input has value
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      className="py-2 border-y text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleLocationSelect(suggestion.description, suggestion.place_id)}
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

  const handleSubmit = async () => {
    if (!selectedLocation.lat || !selectedLocation.lng || !selectedLocation.description) {
      setActiveInput(0);
      toast({
        variant: "destructive",
        description: `Please select a location`,
      });
      return;
    }

    const response = await createTrip({
      locationString: selectedLocation.description,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
    });

    if (response.success && response.trip) {
      router.push(`/platform/trips/${response.trip.id}`);
    } else {
      toast({
        variant: "destructive",
        description: response?.message || "Failed to create trip",
      });
    }
  };

  if (!hasAccess) return <DisabledMobileInputs />;

  return (
    <motion.div
      className="flex flex-col p-3 items-center bg-background rounded-3xl shadow-md overflow-hidden w-[60vw]"
      animate={{
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      <input
        type="text"
        placeholder="Where to?"
        value={selectedLocation.description}
        className={inputClasses}
        readOnly
        onClick={() => handleInputClick(0)}
      />
      {renderLocationSuggestions()}

      <input
        type="text"
        placeholder="Move in:"
        className={inputClasses}
        readOnly={!hasAccess}
        onClick={() => handleInputClick(1)}
      />
      {renderSlidingComponent(1)}

      <input
        type="text"
        placeholder="Move out:"
        className={inputClasses}
        readOnly={!hasAccess}
        onClick={() => handleInputClick(2)}
      />
      {renderSlidingComponent(2)}

      <input
        type="text"
        placeholder="Who?"
        className={`${inputClasses} sm:border-r-0`}
        readOnly={!hasAccess}
        onClick={() => handleInputClick(3)}
      />
      {renderSlidingComponent(3)}

      <button
        disabled={!hasAccess || !selectedLocation.lat || !selectedLocation.lng}
        onClick={handleSubmit}
        className={`w-full mt-3 p-3 ${hasAccess && selectedLocation.lat && selectedLocation.lng
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-50'
          } bg-primaryBrand rounded-full`}
      >
        <FaSearch className="text-white mx-auto" size={20} />
      </button>
    </motion.div>
  );
};

export default SearchInputsMobile;
