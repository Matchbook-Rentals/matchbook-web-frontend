"use client";

import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import { SuggestedLocation } from "@/types";

interface Suggestion {
  place_id: string;
  description: string;
}

interface HeroLocationSuggestProps {
  hasAccess: boolean;
  setDisplayValue: (value: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  onLocationSelect?: (location: SuggestedLocation) => void;
  onInputChange?: (value: string) => void;
  onGeocodingStateChange?: (isGeocoding: boolean) => void;
  showLocationIcon?: boolean;
  placeholder?: string;
}

export default function HeroLocationSuggest({
  hasAccess,
  triggerClassName = "",
  contentClassName = "",
  onLocationSelect,
  onInputChange,
  onGeocodingStateChange,
  showLocationIcon = false,
  setDisplayValue,
  placeholder = "Enter an address or city",
}: HeroLocationSuggestProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const prefetchGeocode = async (description: string) => {
    try {
      const trimmedDescription = description.slice(0, -5);
      await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
    } catch (error) {
      console.error("Error prefetching geocode:", error);
    }
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
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

  const handleSelect = async (description: string, place_id: string) => {
    const trimmedDescription = description.slice(0, -5); // Remove country code
    onLocationSelect(null);
    setDisplayValue(trimmedDescription);
    setInputValue("");
    setSuggestions([]);
    setOpen(false);

    setIsGeocoding(true);
    onGeocodingStateChange?.(true);

    const geocodeLocation = async (): Promise<{ lat: number; lng: number } | null> => {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json();
      if (data.results?.length > 0) {
        return data.results[0].geometry.location;
      }
      return null;
    };

    try {
      let result = await geocodeLocation();
      if (!result) result = await geocodeLocation(); // retry once
      if (result) {
        onLocationSelect?.({ description: trimmedDescription, lat: result.lat, lng: result.lng });
      } else {
        console.error("Geocoding returned no results for:", trimmedDescription);
      }
    } catch (error) {
      console.error("Geocoding failed for:", trimmedDescription, error);
      try {
        const result = await geocodeLocation(); // retry once on network error
        if (result) {
          onLocationSelect?.({ description: trimmedDescription, lat: result.lat, lng: result.lng });
        }
      } catch (retryError) {
        console.error("Geocoding retry also failed:", retryError);
      }
    } finally {
      setIsGeocoding(false);
      onGeocodingStateChange?.(false);
    }
  };

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-transparent`;

  return (

    <div className={`p-4 rounded-2xl ${contentClassName}`}>
      <input
        value={inputValue}
        onChange={handleInput}
        placeholder={placeholder}
        type="text"
        className="w-full h-full text-sm sm:text-xl md:text-2xl focus:outline-none min-w-0"
        autoFocus={true}
      />
      {suggestions.length > 0 && (
        <ul className="mt-3 sm:mt-5">
          {suggestions.slice(0, 5).map((suggestion) => (
            <li
              className="hover:bg-gray-100 p-2 sm:p-3 cursor-pointer text-sm sm:text-base rounded-md flex items-center gap-2.5"
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
              onMouseEnter={() => prefetchGeocode(suggestion.description)}
              data-testid="location-suggestion-item"
            >
              {showLocationIcon && <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              {suggestion.description.slice(0, -5)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
