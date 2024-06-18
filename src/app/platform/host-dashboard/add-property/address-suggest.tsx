"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useLoadScript, useJsApiLoader, Libraries } from '@react-google-maps/api';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface AddressSuggestProps {
  setPropertyDetails: (details: { locationString: string; latitude: number; longitude: number }) => void;
  initialValue?: string;
}

interface Suggestion {
  place_id: string;
  description: string;
}

export default function AddressSuggest({ setPropertyDetails, initialValue = '' }: AddressSuggestProps) {
  const [inputValue, setInputValue] = useState<string>(initialValue); // State for input field value
  const [displayValue, setDisplayValue] = useState<string>(""); // Separate state for display value in the "Where to?" section
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const libraries: Libraries = useMemo(() => ["places"], []);

  // Load Google Maps script
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
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

  // Effect to update inputValue when initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
    setValue(initialValue);
  }, [initialValue, setValue]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValue(newValue);
  };

  const handleSelect = async (description: string, place_id: string) => {
    setInputValue(description); // Optionally clear the input value or keep it based on your needs
    setValue(description, false); // Update the autocomplete value
    clearSuggestions(); // Uncomment if you want to clear suggestions after selection
    setOpen(false);
    console.log('place ID', place_id);
    console.log('description', description);

    const results = await getGeocode({ address: description });
    const { lat, lng } = await getLatLng(results[0]);
    setPropertyDetails((prev => {
      return { ...prev, locationString: description, latitude: lat, longitude: lng }
    }));
    console.log("Selected location:", { lat, lng, results });
  };

  const removeCountry = (address: string) => {
    return address.replace(', USA', '');
  }

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <input
          value={inputValue}
          onChange={handleInput}
          disabled={!ready}
          id="property-address"
          placeholder="Where's the party?"
          type="text"
          autoComplete="off"
          className="w-full h-full text-2xl focus:outline-none text-center" />
      </PopoverTrigger>
      {suggestions.length > 0 && (
        <PopoverContent className="rounded-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <ul className="mt-5">
            {suggestions.map(({ place_id, description }) => (
              <li className="hover:bg-primaryBrand" key={place_id} onClick={() => handleSelect(removeCountry(description), place_id)}>
                {removeCountry(description)}
              </li>
            ))}
          </ul>
        </PopoverContent>
      )}
    </Popover>
  );
}
