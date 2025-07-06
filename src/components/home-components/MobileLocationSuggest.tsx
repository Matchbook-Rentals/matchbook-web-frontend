'use client';

import React, { useState } from "react";

// Move PRESET_CITIES outside component to prevent re-creation
const PRESET_CITIES = [
  { place_id: "preset_nyc", description: "New York City, NY", lat: 40.7128, lng: -74.0060 },
  { place_id: "preset_la", description: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { place_id: "preset_chicago", description: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { place_id: "preset_houston", description: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { place_id: "preset_miami", description: "Miami, FL", lat: 25.7617, lng: -80.1918 },
];

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
  const [apiSuggestions, setApiSuggestions] = useState<any[]>([]);
  const [showingPresets, setShowingPresets] = useState(true);

  const suggestions = showingPresets ? PRESET_CITIES : apiSuggestions;

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue.length > 0) {
      setShowingPresets(false);
      try {
        const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(newValue)}`);
        const data = await response.json();
        setApiSuggestions(data.predictions || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setApiSuggestions([]);
      }
    } else {
      setShowingPresets(true);
      setApiSuggestions([]);
    }
  };

  const handleSelect = async (description: string, place_id: string) => {
    const isPreset = place_id.startsWith('preset_');
    const trimmedDescription = isPreset ? description : description.slice(0, -5);
    
    setLocationDisplayValue(trimmedDescription);
    setInputValue("");
    setApiSuggestions([]);
    setShowingPresets(true);

    if (isPreset) {
      const presetCity = PRESET_CITIES.find(city => city.place_id === place_id);
      if (presetCity) {
        onLocationSelect({ 
          description: presetCity.description, 
          lat: presetCity.lat, 
          lng: presetCity.lng 
        });
      }
    } else {
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
    }
  };

  return (
    <div className="p-4">
      <input
        value={inputValue}
        onChange={handleInput}
        placeholder={
          selectedLocation?.description
            ? "Wrong place? Begin typing and select another"
            : "Enter an address or city"
        }
        type="text"
        className="w-full h-full text-base min-w-0 mb-4"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoFocus
      />
      <div className="transition-all duration-300 ease-in-out overflow-hidden max-h-80">
        <ul>
          {suggestions.map((suggestion) => (
            <li
              className={`hover:bg-gray-100 p-3 cursor-pointer text-sm rounded-md transition-colors duration-150 ${
                showingPresets ? 'text-gray-500' : 'text-gray-900'
              }`}
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
            >
              {showingPresets ? suggestion.description : suggestion.description.slice(0, -5)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MobileLocationSuggest;