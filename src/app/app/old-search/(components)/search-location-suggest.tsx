"use client";
//Imports
import React, { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useTripContext } from "@/contexts/trip-context-provider";
import { updateTrip } from "@/app/actions/trips";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

interface LocationSuggestProps {
  triggerClassName?: string;
  contentClassName?: string;
}

export default function LocationSuggest({ triggerClassName = "", contentClassName = "" }: LocationSuggestProps) {
  const { state, actions } = useTripContext();
  const [inputValue, setInputValue] = useState("");
  const [displayValue, setDisplayValue] = useState(state.trip?.locationString);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDisplayValue(state.trip?.locationString);
  }, [state.trip]);

  const handleInput = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.length > 2) {
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
    setDisplayValue(description);
    setInputValue("");
    setSuggestions([]);
    setOpen(false);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(description)}`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const newTrip = { ...state.trip, locationString: description, latitude: lat, longitude: lng }
        actions.setTrip(prev => ({ ...prev, locationString: description, latitude: lat, longitude: lng }));
        // Update the trip and handle the response
        const updatedTrip = await updateTrip(newTrip);
        if (updatedTrip) {
          toast({
            title: "Trip location changed successfully",
            description: "Shown listings may change",
            style: { backgroundColor: '#f5f5f5', border: 'black solid 1px' } // Equivalent to grey-100 in most CSS color systems
          });
          router.refresh();
        } else {
          // Handle the case where updateTrip fails or returns falsy
          toast({
            title: "Update failed",
            description: "There was an error updating your trip location. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' className={` focus:outline-none rounded-l-full text-[11px] xxs:text-[13px] sm:text-[15px] md:px-2 cursor-pointer ${triggerClassName}`}>
          <span className="inline-block translate-y-[1px]">
            {displayValue ? displayValue : "Where to?"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`rounded-2xl ${contentClassName}`}>
        <input
          value={inputValue}
          onChange={handleInput}
          placeholder="Enter an address or city"
          type="text"
          className="w-full h-full text-2xl focus:outline-none"
        />
        {suggestions.length > 0 && (
          <ul className="mt-5">
            {suggestions.map(({ place_id, description }) => (
              <li className="hover:bg-primaryBrand" key={place_id} onClick={() => handleSelect(description.slice(0, -5), place_id)}>
                {description?.slice(0, -5)}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover >
  );
}
