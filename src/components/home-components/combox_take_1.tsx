"use client"

import React, { useState, useEffect, useMemo } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useLoadScript } from '@react-google-maps/api';


import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ComboboxDemo() {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const libraries = useMemo(() => ["places"], []); // Memoize libraries array

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['(cities)'],
      componentRestrictions: { country: 'us' },
    },
  });

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

  const handleSelect = async (address) => {
    setInputValue(address);
    setValue(address, false);
    clearSuggestions();

    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    console.log("Selected location:", { lat, lng });
  };

  return (
    <div>
      <input
        value={inputValue}
        onChange={handleInput}
        disabled={!isLoaded}
        placeholder="Search an address"
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map(({ place_id, description }) => (
            <li key={place_id} onClick={() => handleSelect(description)}>
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
