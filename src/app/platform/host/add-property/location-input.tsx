import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeocodeResponse } from "@/app/api/geocode/route";

// Using the same interface as in add-property-client.tsx
interface ListingLocation {
  locationString: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  streetAddress1: string | null;
  streetAddress2: string | null;
  postalCode: string | null;
  country: string | null;
}

interface Suggestion {
  place_id: string;
  description: string;
}

interface LocationInputProps {
  listingLocation: ListingLocation;
  setListingLocation: (location: ListingLocation) => void;
  validationErrors?: string[];
}

export default function LocationInput({ listingLocation, setListingLocation, validationErrors }: LocationInputProps) {
  
  // Salt Lake City, Utah
  const INITIAL_COORDINATES = { lat: 40.7608, lng: -111.8910 };
  const [coordinates, setCoordinates] = useState({
    lat: listingLocation.latitude || INITIAL_COORDINATES.lat,
    lng: listingLocation.longitude || INITIAL_COORDINATES.lng
  });
  
  const [inputValue, setInputValue] = useState(listingLocation.locationString || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize map only on first render
  useEffect(() => {
    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      const mapContainer = document.getElementById('property-location-map');
      if (!mapContainer) return;
      
      // Create new map
      const newMap = new maplibregl.Map({
        container: mapContainer,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [coordinates.lng, coordinates.lat],
        zoom: (coordinates.lat === INITIAL_COORDINATES.lat && coordinates.lng === INITIAL_COORDINATES.lng) ? 8 : 13,
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
  useEffect(() => {
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
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleSelect = async (description: string, placeId: string) => {
    try {
      const trimmedDescription = description.slice(0, -5);
      setInputValue(trimmedDescription);
      setOpen(false);
      setSuggestions([]);

      // Geocode the selected address
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json() as GeocodeResponse;
      
      let lat = 0, lng = 0;
      let street = "", city = "", state = "", zip = "", country = "";
      
      // Check for different possible formats of the geocode response
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        
        if (result.geometry && result.geometry.location) {
          // Google Maps API format
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
        }
        
        // Parse address components
        if (result.address_components) {
          for (const component of result.address_components) {
            const types = component.types;
            
            if (types.includes('street_number')) {
              street = component.long_name + ' ';
            } else if (types.includes('route')) {
              street += component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (types.includes('postal_code')) {
              zip = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          }
        }
      }
      
      // Only continue if we have valid coordinates
      if (lat && lng && lat !== 0 && lng !== 0) {
        // Update coordinates for the map
        setCoordinates({ lat: Number(lat), lng: Number(lng) });
        
        // Update listing location with complete address details
        setListingLocation({
          ...listingLocation,
          locationString: trimmedDescription,
          latitude: Number(lat),
          longitude: Number(lng),
          streetAddress1: street.trim(),
          city: city,
          state: state,
          postalCode: zip,
          country: country,
        });
      }
      
    } catch (error) {
      console.error("Error geocoding selected address:", error);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    // This method is not needed for this component since we're only doing address input
  };
  
  return (
    <main className="relative w-full max-w-[883px] min-h-[601px]">
      <section className="w-full h-full">

        {/* Validation Errors at the top */}
        {validationErrors && validationErrors.length > 0 && (
          <div className="w-full mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="w-full h-[547px] relative bg-gray-100">
          {/* Map container replaces the background image */}
          <div id="property-location-map" className="w-full h-full absolute inset-0"></div>

          {/* Address input overlay positioned at top */}
          <div className="absolute top-[34px] left-0 right-0 px-[107px]">
            <div className="w-full max-w-[670px] mx-auto relative">
              <Card className="w-full rounded-[30px] shadow-[0px_4px_4px_#00000040] border-none bg-background cursor-text">
                <CardContent className="p-0">
                  <Input
                    ref={inputRef}
                    className="h-14 border-none shadow-none rounded-[30px] pl-10 font-['Poppins',Helvetica] font-normal text-xl text-[#3f3f3f]"
                    placeholder="Enter property address"
                    value={inputValue}
                    onChange={handleInput}
                    onFocus={() => {
                      if (inputValue.length > 0) {
                        setOpen(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay closing to allow for click events
                      setTimeout(() => setOpen(false), 200);
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

      </section>
    </main>
  );
}
