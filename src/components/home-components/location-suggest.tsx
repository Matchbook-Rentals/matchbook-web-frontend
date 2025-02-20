"use client";

import React, { useState, useEffect, useMemo } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { useLoadScript } from "@react-google-maps/api";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

export default function LocationSuggest({ setDestination }) {
  const [inputValue, setInputValue] = useState(""); // State for input field value
  const [displayValue, setDisplayValue] = useState(""); // Separate state for display value in the "Where to?" section
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
      types: ["(cities)"],
      componentRestrictions: { country: "us" },
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

  const handleSelect = async (description, place_id) => {
    setDestination(description);
    setDisplayValue(description); // Update the display value with the selected description
    setInputValue(""); // Optionally clear the input value or keep it based on your needs
    setValue(description, false); // Update the autocomplete value
    clearSuggestions(); // Uncomment if you want to clear suggestions after selection
    setOpen(false);
    console.log("place ID", place_id);
    console.log("description", description);

    const results = await getGeocode({ address: description });
    const { lat, lng } = await getLatLng(results[0]);
    console.log("Selected location:", { lat, lng });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="placeholder:text-gray-500 focus:outline-none rounded-full text-lg h-full p-5 md:p-8 cursor-pointer">
          {displayValue ? displayValue : "Where to?"}{" "}
          {/* Display the selected description or "Where to?" */}
        </button>
      </PopoverTrigger>
      <PopoverContent className="rounded-2xl">
        <input
          value={inputValue}
          onChange={handleInput}
          disabled={!ready}
          placeholder="Enter an address or city"
          type="text"
          className="w-full h-full text-2xl focus:outline-none"
        />
        {suggestions.length > 0 && (
          <ul className="mt-5">
            {suggestions.map(({ place_id, description }) => (
              <li
                className="hover:bg-gray-100"
                key={place_id}
                onClick={() => handleSelect(description.slice(0, -5), place_id)}
              >
                {description?.slice(0, -5)}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
