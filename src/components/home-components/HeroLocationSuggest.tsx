"use client";

import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
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
}

export default function HeroLocationSuggest({
  hasAccess,
  triggerClassName = "",
  contentClassName = "",
  onLocationSelect,
  setDisplayValue
}: HeroLocationSuggestProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

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

    // Start timing
    const startTime = performance.now();

    setInputValue("");
    setSuggestions([]);
    setOpen(false);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;

        if (onLocationSelect) {
          onLocationSelect({ description: trimmedDescription, lat, lng });
        }

        // Calculate elapsed time
        const endTime = performance.now();
        const elapsedMs = Math.round(endTime - startTime);

        toast({
          title: "Location selected",
          description: `${trimmedDescription} (processed in ${elapsedMs}ms)`,
          style: { backgroundColor: '#f5f5f5', border: 'black solid 1px' }
        });
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  const inputClasses = `w-full px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none ${hasAccess ? '' : 'cursor-not-allowed opacity-50'
    } bg-transparent`;

  return (

    <div className={`p-4 rounded-2xl ${contentClassName}`}>
      <input
        value={inputValue}
        onChange={handleInput}
        placeholder="Enter an address or city"
        type="text"
        className="w-full h-full text-2xl focus:outline-none"
        autoFocus={true}
      />
      {suggestions.length > 0 && (
        <ul className="mt-5">
          {suggestions.map((suggestion) => (
            <li
              className="hover:bg-primaryBrand p-2 cursor-pointer"
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
              onMouseEnter={() => prefetchGeocode(suggestion.description)}
            >
              {suggestion.description.slice(0, -5)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
