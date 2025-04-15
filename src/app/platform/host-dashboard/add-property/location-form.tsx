import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AddressEntryBox } from "@/components/AddressEntryBox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SuggestedLocation } from "@/types";
import { GeocodeResponse } from "@/app/api/geocode/route";

interface Suggestion {
  place_id: string;
  description: string;
}

export default function LocationForm() {
  // ...existing code...
  const observerRef = useRef<HTMLDivElement>(null);
  const {toast} = useToast();
  // Salt Lake City, Utah
  const INITIAL_COORDINATES = { lat: 40.7608, lng: -111.8910 };
  const [coordinates, setCoordinates] = useState(INITIAL_COORDINATES);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  const [addressSelected, setAddressSelected] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize map only on first render
  React.useEffect(() => {
    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      const mapContainer = document.getElementById('property-location-map');
      if (!mapContainer) return;
      
      console.log('Creating new map instance');
      
      // Create new map
      const newMap = new maplibregl.Map({
        container: mapContainer,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [coordinates.lng, coordinates.lat],
        zoom: (coordinates.lat === INITIAL_COORDINATES.lat && coordinates.lng === INITIAL_COORDINATES.lng) ? 4 : 13,
      });
      
      // Add navigation controls
      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Only add a marker if not at the initial coordinates
      let newMarker: maplibregl.Marker | null = null;
      if (coordinates.lat !== INITIAL_COORDINATES.lat || coordinates.lng !== INITIAL_COORDINATES.lng) {
        newMarker = new maplibregl.Marker({ color: '#FF0000' })
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(newMap);
      }
      // Update state with new map and marker
      setMap(newMap);
      setMarker(newMarker);
      
      // Setup resize handler for map
      const handleResize = () => {
        newMap.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      // Ensure the map renders correctly
      setTimeout(() => {
        newMap.resize();
      }, 100);
    });
    
    // Cleanup on unmount
    return () => {
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.error("Error removing map:", e);
        }
        setMap(null);
        setMarker(null);
      }
    };
  }, []);  // Empty dependency array - only run on first render
  

  
  // Update marker position when coordinates change (if map exists)
  React.useEffect(() => {
    if (map) {
      try {
        // If we're at the initial coordinates, remove the marker if it exists
        if (coordinates.lat === INITIAL_COORDINATES.lat && coordinates.lng === INITIAL_COORDINATES.lng) {
          if (marker) {
            marker.remove();
            setMarker(null);
          }
        } else {
          // If not at the initial coordinates, ensure marker exists and is updated
          if (!marker) {
            const newMarker = new maplibregl.Marker({ color: '#FF0000' })
              .setLngLat([coordinates.lng, coordinates.lat])
              .addTo(map);
            setMarker(newMarker);
          } else {
            marker.setLngLat([coordinates.lng, coordinates.lat]);
          }
          map.flyTo({
            center: [coordinates.lng, coordinates.lat],
            zoom: 13,
            essential: true
          });
        }
      } catch (e) {
        console.error("Error updating marker position:", e);
      }
    }
  }, [coordinates.lat, coordinates.lng]);

  // Maintain focus on the input field
  useEffect(() => {
    // Don't auto-focus on initial render, only when the popover state changes
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const prefetchGeocode = async (description: string) => {
    console.log("Prefetching geocode for:", description)
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
      setOpen(false);
    }
  };

  // Utility to format address from Google address_components
function formatAddress(components: any[]) {
  const get = (type: string) =>
    components.find(comp => comp.types.includes(type))?.long_name || "";

  const streetNumber = get("street_number");
  const route = get("route");
  const subpremise = get("subpremise");
  const city = get("locality");
  const state = get("administrative_area_level_1");
  const postalCode = get("postal_code");
  const country = get("country");

  // e.g. 4433 Northeast Crestmoor Lane, Apt 2, Ankeny, IA 50021, United States
  let street = [streetNumber, route].filter(Boolean).join(" ");
  if (subpremise) {
    street += `, Apt ${subpremise}`;
  }
  return [
    street,
    [city, state].filter(Boolean).join(", "),
    [postalCode, country].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
}

const handleSelect = async (description: string, place_id: string) => {
    // ...existing code...
    // After all other logic, scroll observer into view after 500ms
    setTimeout(() => {
      if (observerRef.current) {
        smoothScrollToElement(observerRef.current, 1000);
      }
    }, 1000);

    // Custom smooth scroll function
    function smoothScrollToElement(element: HTMLElement, duration: number) {
      const rect = element.getBoundingClientRect();
      const targetY = rect.top + window.pageYOffset - window.innerHeight / 2 + rect.height / 2;
      const startY = window.pageYOffset;
      const diff = targetY - startY;
      let start: number | null = null;
      function step(timestamp: number) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        window.scrollTo(0, startY + diff * progress);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      }
      window.requestAnimationFrame(step);
    }
    const trimmedDescription = description.slice(0, -5); // Remove country code
    setInputValue(trimmedDescription);
    setAddressSelected(true);

    // Start timing
    const startTime = performance.now();

    setSuggestions([]);
    setOpen(false);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json() as GeocodeResponse;
      
      let lat = 0, lng = 0;
      
      // Check for different possible formats of the geocode response
      if (data.results && data.results.length > 0) {
        if (data.results[0].geometry && data.results[0].geometry.location) {
          // Google Maps API format
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
        }
      }

      //console log
      console.log("Geocode response:", data.results[0].address_components);


      const components = data.results[0].address_components;
      console.log("Components:", components);

      let streetNumber = components.find((component) => component.types.includes('street_number'))?.short_name || '';
      let streetName = components.find((component) => component.types.includes('route'))?.short_name || '';
      let street2 = components.find((component) => component.types.includes('subpremise'))?.short_name || '';
      let city = components.find((component) => component.types.includes('locality'))?.short_name || '';
      let state = components.find((component) => component.types.includes('administrative_area_level_1'))?.long_name || '';
      let zip = components.find((component) => component.types.includes('postal_code'))?.short_name || '';

      let newAddress = {
        street: `${streetNumber} ${streetName}`,
        street2: street2,
        city: city,
        state: state,
        zip: zip,
      }
      console.log("New address:", newAddress);
      setAddress(newAddress);

      
      // Only continue if we have valid coordinates
      if (lat && lng && lat !== 0 && lng !== 0) {
        // Update coordinates for the map
        setCoordinates({ lat: Number(lat), lng: Number(lng) });

        // Calculate elapsed time
        const endTime = performance.now();
        const elapsedMs = Math.round(endTime - startTime);

        // Maintain focus after selection
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      } else {
        toast({
          title: "Warning",
          description: "No valid location found for this address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };



  const handleAddressChange = (field: string, value: string) => {
  setAddress((prev: typeof address) => ({
    ...prev,
    [field]: value
  }));
};
  


  return (
    <main className="relative w-full max-w-[883px] min-h-[601px]">
      <section className="w-full h-full">
        <div className="w-full flex justify-between">
          <h1 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica] mb-4">
            Where is your property located?
          </h1>
        </div>

        <div className="w-full h-[547px] relative bg-gray-100">
          {/* Map container replaces the background image */}
          <div id="property-location-map" className="w-full h-full absolute inset-0"></div>

          {/* Address input overlay positioned at top */}
          <div className="absolute top-[34px] left-0 right-0 px-[107px]">
            <div className="w-full max-w-[670px] mx-auto relative">
              <Card className="w-full rounded-[30px] shadow-[0px_4px_4px_#00000040] border-none bg-white cursor-text">
                <CardContent className="p-0">
                  <Input
                    ref={inputRef}
                    className="h-14 border-none shadow-none rounded-[30px] pl-10 font-['Poppins',Helvetica] font-normal text-xl text-[#3f3f3f]"
                    placeholder="Enter property address"
                    value={inputValue}
                    onChange={handleInput}
                    onFocus={() => {
                      if (inputValue.length > 0 && suggestions.length > 0) {
                        setOpen(true);
                      }
                    }}
                  />
                </CardContent>
              </Card>

              {/* Suggestions dropdown */}
              {open && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-[15px] shadow-lg">
                  <div className="p-4 rounded-2xl">
                    <ul className="max-h-[300px] overflow-y-auto">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address form appears below the map if an address is selected */}
        {addressSelected && (
          <div className="w-full flex justify-center mt-12 relative z-70 pointer-events-auto">
            <div className="w-full max-w-[670px] mx-auto bg-background">
              <AddressEntryBox 
                initialAddress={address} 
                onAddressChange={(updatedAddress) => {
                  // Map between the two address format structures
                  setAddress({
                    street: updatedAddress.street,
                    street2: updatedAddress.apt,
                    city: updatedAddress.city,
                    state: updatedAddress.state,
                    zip: updatedAddress.zip
                  });
                }}
              />
              {/* Observer div for scroll target */}
              <div ref={observerRef} style={{height: 1}} tabIndex={-1} aria-hidden="true" />
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
