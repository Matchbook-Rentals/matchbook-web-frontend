'use client';

import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface MobileLocationSuggestProps {
  selectedLocation: any;
  onLocationSelect: (location: any) => void;
  setLocationDisplayValue: (value: string) => void;
}

const MobileLocationSuggest: React.FC<MobileLocationSuggestProps> = ({ 
  selectedLocation, 
  onLocationSelect, 
  setLocationDisplayValue 
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

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
    const trimmedDescription = description.slice(0, -5);
    
    setLocationDisplayValue(trimmedDescription);
    setInputValue("");
    setSuggestions([]);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        onLocationSelect({ description: trimmedDescription, lat, lng });
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  return (
    <div className="p-4 ">
      <Input
        value={inputValue}
        onChange={handleInput}
        placeholder={
          selectedLocation?.description
            ? "Wrong place? Begin typing and select another"
            : "Enter an address or city"
        }
        className="h-10 border border-solid border-[#d0d5dd] rounded-md px-3 py-2.5 mb-4"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoFocus
      />
      {suggestions.length > 0 && (
        <div className="transition-all duration-300 ease-in-out overflow-hidden max-h-48 overflow-y-auto">
          <ul>
            {suggestions.map((suggestion) => (
              <li
                className="hover:bg-gray-100 p-3 cursor-pointer text-sm rounded-md transition-colors duration-150 text-gray-900"
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
                data-testid="location-suggestion-item"
              >
                {suggestion.description.slice(0, -5)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileLocationSuggest;
