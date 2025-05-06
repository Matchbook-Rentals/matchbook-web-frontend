import React, { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DisabledMobileInputs } from "./disabled-inputs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuggestedLocation } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { createTrip } from "@/app/actions/trips";
import { format } from "date-fns";
import { MobileDateRange } from "@/components/ui/custom-calendar/mobile-date-range";
import GuestTypeCounter from "./GuestTypeCounter";
import { cn } from "@/lib/utils";

interface Suggestion {
  place_id: string;
  description: string;
}

interface SearchInputsMobileProps {
  hasAccess: boolean;
  className?: string;
  inputClassName?: string;
  searchButtonClassNames?: string;
  searchIconColor?: string;
  headerText?: string;
  headerClassName?: string;
}

const PRESET_CITIES = [
  { description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
  { description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

const SearchInputsMobile: React.FC<SearchInputsMobileProps> = ({
  hasAccess,
  className,
  inputClassName,
  searchButtonClassNames,
  searchIconColor = 'text-white',
  headerText,
  headerClassName
}) => {
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
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const router = useRouter();
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  const [hasBeenSelected, setHasBeenSelected] = useState(false);
  const [guests, setGuests] = useState({ pets: 0, children: 0, adults: 1 });
  const [totalGuests, setTotalGuests] = useState(1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setActiveInput(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const total = Object.values(guests).reduce((sum, count) => sum + count, 0);
    setTotalGuests(total);
  }, [guests]);

  const inputClasses = `w-full px-4 py-3 font-normal text-gray-700 placeholder-gray-400 cursor-pointer focus:outline-none border border-gray-200 rounded-full bg-white mb-3 transition-all duration-300 hover:shadow-sm ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } ${inputClassName || ''}`;

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
    setActiveInput(3);

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
    if (index === 0) return null;

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
                  minimumDateRange={{ months: 1 }}
                  maximumDateRange={{ months: 12 }} // Add maximum date range
                />
              )}
              {index === 4 && (
                <div className="p-4">
                  <GuestTypeCounter
                    guests={guests}
                    setGuests={setGuests}
                  />
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
                  // Show preset cities when input is empty
                  PRESET_CITIES.map((city) => (
                    <div
                      key={city.description}
                      className="py-2  font-light text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedLocation({
                          description: city.description,
                          lat: city.lat,
                          lng: city.lng
                        });
                        setInputValue("");
                        setSuggestions([]);
                        setActiveInput(3);
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

    if (!dateRange.start || !dateRange.end) {
      setActiveInput(3);
      toast({
        variant: "destructive",
        description: `Please select both move-in and move-out dates`,
      });
      return;
    }

    if (guests.adults < 1) {
      setActiveInput(4);
      toast({
        variant: "destructive",
        description: `Please select at least one adult guest`,
      });
      return;
    }

    const response = await createTrip({
      locationString: selectedLocation.description,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      startDate: dateRange.start,
      endDate: dateRange.end,
      numAdults: guests.adults,
      numChildren: guests.children,
      numPets: guests.pets,
    });

    if (response.success && response.trip) {
      router.push(`/platform/searches/set-preferences/${response.trip.id}`);
    } else {
      toast({
        variant: "destructive",
        description: "Failed to create trip",
      });
    }
  };

  if (!hasAccess) return <DisabledMobileInputs headerText={headerText} />;

  return (
    <motion.div
      ref={componentRef}
      className={`flex flex-col p-4 z-50 items-center bg-background rounded-3xl shadow-md overflow-hidden w-[60vw] ${className || ''}`}
      animate={{
        width: activeInput !== null ? '85vw' : '60vw',
        height: activeInput !== null ? 'auto' : 'auto'
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {headerText && <h3 className={cn("text-xl font-semibold mb-3 text-green-800 block sm:hidden", headerClassName)}>{headerText}</h3>}
      <div
        className={`${inputClasses} flex items-center`}
        onClick={() => handleInputClick(0)}
      >
        <MapPin size={24} className="text-gray-500 mr-3" />
        {selectedLocation.description || "Where to"}
      </div>
      {renderLocationSuggestions()}

      <div
        className={`${inputClasses} flex items-center`}
        onClick={() => handleInputClick(3)}
      >
        <Calendar size={24} className="text-gray-500 mr-3" />
        {dateRange.start && dateRange.end 
          ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
          : dateRange.start
          ? `${format(dateRange.start, 'MMM d')} - Select`
          : 'Dates'}
      </div>
      {renderSlidingComponent(3)}

      <div
        className={`${inputClasses} sm:border-r-0 flex items-center`}
        onClick={() => {
          setHasBeenSelected(true);
          handleInputClick(4);
        }}
      >
        <Users size={24} className="text-gray-500 mr-3" />
        {hasBeenSelected ? `${totalGuests} Renter${totalGuests !== 1 ? 's' : ''}` : 'Renters'}
      </div>
      {renderSlidingComponent(4)}

      <button
        disabled={!hasAccess || !selectedLocation.lat || !selectedLocation.lng}
        onClick={handleSubmit}
        className={`w-full py-2 px-6 ${hasAccess && selectedLocation.lat && selectedLocation.lng
          ? 'cursor-pointer'
          : 'cursor-not-allowed opacity-30'
          } ${searchButtonClassNames || 'bg-green-800'} text-white rounded-2xl text-lg font-medium transition-all duration-300 shadow-sm`}
      >
        Search
      </button>
    </motion.div>
  );
};

export default SearchInputsMobile;
