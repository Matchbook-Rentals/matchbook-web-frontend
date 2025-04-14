import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SuggestedLocation } from "@/types";

interface Suggestion {
  place_id: string;
  description: string;
}

export default function LocationForm() {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [inputValue, setInputValue] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);

  // Initialize map after component mounts
  React.useEffect(() => {
    const mapContainer = document.getElementById('property-location-map');
    if (!mapContainer) return;

    const newMap = new maplibregl.Map({
      container: mapContainer,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [coordinates.lng, coordinates.lat],
      zoom: 2,
    });

    // Add navigation controls
    newMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add a marker at the center
    const newMarker = new maplibregl.Marker({ color: '#FF0000' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(newMap);

    setMap(newMap);
    setMarker(newMarker);

    // Cleanup on unmount
    return () => {
      newMap.remove();
    };
  }, []);

  // Update map when coordinates change
  React.useEffect(() => {
    if (map && marker) {
      map.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 13,
        essential: true
      });
      marker.setLngLat([coordinates.lng, coordinates.lat]);
    }
  }, [coordinates, map, marker]);

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
      setOpen(true);
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
        
        // Update coordinates for the map
        setCoordinates({ lat, lng });

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

  return (
    <main className="relative w-full max-w-[883px] h-[601px]">
      <section className="w-full h-full">
        <h1 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica] mb-4">
          Where is your property located?
        </h1>

        <div className="w-full h-[547px] relative bg-gray-100">
          {/* Map container replaces the background image */}
          <div id="property-location-map" className="w-full h-full absolute inset-0"></div>
          
          {/* Address input overlay positioned at top */}
          <div className="absolute top-[34px] left-0 right-0 px-[107px]">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Card className="w-full max-w-[670px] mx-auto rounded-[30px] shadow-[0px_4px_4px_#00000040] border-none bg-white cursor-text">
                  <CardContent className="p-0">
                    <Input
                      className="h-14 border-none shadow-none rounded-[30px] pl-10 font-['Poppins',Helvetica] font-normal text-xl text-[#3f3f3f]"
                      placeholder="Enter property address"
                      value={displayValue || inputValue}
                      onChange={(e) => {
                        setDisplayValue("");
                        handleInput(e);
                      }}
                      onClick={() => setOpen(true)}
                    />
                  </CardContent>
                </Card>
              </PopoverTrigger>
              <PopoverContent className="w-[670px] p-0 rounded-[15px] shadow-lg">
                <div className="p-4 rounded-2xl">
                  <input
                    value={inputValue}
                    onChange={handleInput}
                    placeholder="Enter an address or city"
                    type="text"
                    className="w-full h-full text-xl focus:outline-none"
                    autoFocus={true}
                  />
                  {suggestions.length > 0 && (
                    <ul className="mt-5 max-h-[300px] overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <li
                          className="hover:bg-gray-100 p-2 cursor-pointer"
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
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>
    </main>
  );
}