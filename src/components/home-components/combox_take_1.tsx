"use client"

import React, { useState, useEffect, useMemo } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useLoadScript } from '@react-google-maps/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

export default function ComboboxDemo() {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const libraries = useMemo(() => ["places"], []);

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Initialize usePlacesAutocomplete with manual init
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    initOnMount: false,
    requestOptions: {
      types: ['(cities)'],
      componentRestrictions: { country: 'us' },
    },
  });

  useEffect(() => {
    // Manually initialize the hook when the script is ready
    if (isLoaded) init();
  }, [isLoaded, init]);

  useEffect(() => {
    if (status === "OK") {
      setSuggestions(data);
    } else {
      setSuggestions([]);
    }
  }, [status, data]);

  const handleInput = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValue(newValue);
  };

  const handleSelect = async (address, place_id) => {
    setInputValue(address);
    setValue(address, false);
    clearSuggestions();
    console.log('place ID', place_id)
    console.log('address', address)


    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    console.log("Selected location:", { lat, lng });
  };

  return (
    <div>
      <input
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Search an address"
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map(({ place_id, description }) => (
            <li key={place_id} onClick={() => handleSelect(description, place_id)}>
              {description}
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button>{inputValue ?
            inputValue : "Where to?"}</button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <input
            value={inputValue}
            onChange={handleInput}
            disabled={!ready}
            placeholder="Search an address"
            type="text"
            className="w-full h-full text-3xl" />
          {suggestions.length > 0 && (
            <ul>
              {suggestions.map(({ place_id, description }) => (
                <li key={place_id} onClick={() => handleSelect(description, place_id)}>
                  {description}
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
