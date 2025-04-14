import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SuggestedLocation } from "@/types";

interface Suggestion {
  place_id: string;
  description: string;
}

export default function LocationForm() {
  const {toast} = useToast();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: ""
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize map only on first render when not in manual entry mode
  React.useEffect(() => {
    // Skip if in manual entry mode
    if (showManualEntry) {
      return;
    }
    
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
        zoom: coordinates.lat !== 0 && coordinates.lng !== 0 ? 13 : 2,
      });
      
      // Add navigation controls
      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      // Add a marker at the center
      const newMarker = new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(newMap);
      
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
  
  // Handle map visibility toggle - ALWAYS recreate map when coming back from manual entry
  React.useEffect(() => {
    if (showManualEntry) {
      // When switching to manual entry, just do nothing
      return;
    }
    
    // When switching back to map view, ALWAYS recreate the map
    // This ensures we get a fresh map instance
    console.log('Recreating map after manual entry toggle');
    
    // Small delay to ensure container is ready
    setTimeout(() => {
      const mapContainer = document.getElementById('property-location-map');
      if (!mapContainer) return;
      
      // Clean up any existing map
      if (map) {
        try {
          map.remove();
        } catch (e) {
          console.error("Error removing map:", e);
        }
      }
      
      // Create a fresh map instance
      const newMap = new maplibregl.Map({
        container: mapContainer,
        style: 'https://tiles.openfreemap.org/styles/bright',
        center: [coordinates.lng, coordinates.lat],
        zoom: coordinates.lat !== 0 && coordinates.lng !== 0 ? 13 : 2,
      });
      
      newMap.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      const newMarker = new maplibregl.Marker({ color: '#FF0000' })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(newMap);
      
      setMap(newMap);
      setMarker(newMarker);
      
      // Force a resize just to be sure
      setTimeout(() => {
        newMap.resize();
      }, 50);
    }, 50);
  }, [showManualEntry]);
  
  // Update marker position when coordinates change (if map exists)
  React.useEffect(() => {
    if (map && marker && !showManualEntry) {
      try {
        marker.setLngLat([coordinates.lng, coordinates.lat]);
        map.flyTo({
          center: [coordinates.lng, coordinates.lat],
          zoom: 13,
          essential: true
        });
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
      setSuggestions([]);
      setOpen(false);
    }
  };

  const handleSelect = async (description: string, place_id: string) => {
    const trimmedDescription = description.slice(0, -5); // Remove country code
    setInputValue(trimmedDescription);

    // Start timing
    const startTime = performance.now();

    setSuggestions([]);
    setOpen(false);

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(trimmedDescription)}`);
      const data = await response.json();
      
      let lat = 0, lng = 0;
      
      // Check for different possible formats of the geocode response
      if (data.results && data.results.length > 0) {
        if (data.results[0].geometry && data.results[0].geometry.location) {
          // Google Maps API format
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
        } else if (data.results[0].lat && data.results[0].lng) {
          // Direct lat/lng format
          lat = data.results[0].lat;
          lng = data.results[0].lng;
        } else if (Array.isArray(data.results[0]) && data.results[0].length >= 2) {
          // Array format [lat, lng]
          lat = data.results[0][0];
          lng = data.results[0][1];
        }
      } else if (data.lat && data.lng) {
        // Direct response format
        lat = data.lat;
        lng = data.lng;
      }
      
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
    
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`);
      const data = await response.json();
      
      // Show raw geocode result for debugging
      toast({
        title: "Geocode Result (Temporary)",
        description: JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : ''),
        duration: 10000,
        style: { backgroundColor: '#f0f9ff', border: 'blue solid 1px' }
      });
      
      let lat = 0, lng = 0;
      
      // Check for different possible formats of the geocode response
      if (data.results && data.results.length > 0) {
        if (data.results[0].geometry && data.results[0].geometry.location) {
          // Google Maps API format
          lat = data.results[0].geometry.location.lat;
          lng = data.results[0].geometry.location.lng;
        } else if (data.results[0].lat && data.results[0].lng) {
          // Direct lat/lng format
          lat = data.results[0].lat;
          lng = data.results[0].lng;
        } else if (Array.isArray(data.results[0]) && data.results[0].length >= 2) {
          // Array format [lat, lng]
          lat = data.results[0][0];
          lng = data.results[0][1];
        }
      } else if (data.lat && data.lng) {
        // Direct response format
        lat = data.lat;
        lng = data.lng;
      }
      
      // Log extracted coordinates for debugging
      console.log("Extracted coordinates:", { lat, lng });
      
      // Show coordinate format for debugging
      toast({
        title: "Extracted Coordinates (Temporary)",
        description: `Lat: ${lat}\nLng: ${lng}\nType: ${typeof lat}`,
        duration: 5000,
        style: { backgroundColor: '#f0fff4', border: 'green solid 1px' }
      });
      
      // Only continue if we have valid coordinates
      if (lat && lng && lat !== 0 && lng !== 0) {
        // Update coordinates for the map
        setCoordinates({ lat: Number(lat), lng: Number(lng) });
        setInputValue(fullAddress);
        
        // Show more detailed success info
        toast({
          title: "Address entered",
          description: `${fullAddress}\nCoordinates: ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`,
          style: { backgroundColor: '#f5f5f5', border: 'black solid 1px' }
        });
        
        // Switch to map view with proper handling
        toggleManualEntry(false);
      } else {
        toast({
          title: "Warning",
          description: "No valid location found for this address. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error geocoding manual address:", error);
      toast({
        title: "Error",
        description: "Could not find coordinates for this address",
        variant: "destructive"
      });
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const toggleManualEntry = (value: boolean) => {
    setShowManualEntry(value);
    // Our useEffect will handle the map initialization/cleanup
  };

  return (
    <main className="relative w-full max-w-[883px] h-[601px]">
      <section className="w-full h-full">
        <div className="w-full flex justify-between">
        <h1 className="font-medium text-2xl text-[#3f3f3f] font-['Poppins',Helvetica] mb-4">
          Where is your property located?
        </h1>
        <h2 
          onClick={() => toggleManualEntry(!showManualEntry)}
          className="font-medium text-lg cursor-pointer hover:underline text-[#3f3f3f] font-['Poppins',Helvetica] mb-4"
        >
          {showManualEntry ? "Use map" : "Enter address manually"}
        </h2>
        </div>

        {showManualEntry ? (
          <div className="w-full h-[547px] bg-white p-8 rounded-lg shadow">
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-lg">Street Address</label>
                <Input 
                  value={address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full p-3 text-lg"
                  placeholder="123 Main St"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 text-lg">City</label>
                <Input 
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full p-3 text-lg"
                  placeholder="New York"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-lg">State</label>
                  <Input 
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full p-3 text-lg"
                    placeholder="NY"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-lg">ZIP Code</label>
                  <Input 
                    value={address.zip}
                    onChange={(e) => handleAddressChange('zip', e.target.value)}
                    className="w-full p-3 text-lg"
                    placeholder="10001"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full p-6 text-lg mt-8">
                Submit Address
              </Button>
            </form>
          </div>
        ) : (
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
        )}
      </section>
    </main>
  );
}
