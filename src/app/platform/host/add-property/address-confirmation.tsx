import React, { useState, useRef, useEffect } from "react";
import { AddressConfirmationForm } from "./address-confirmation-form";
import { useToast } from "@/components/ui/use-toast";
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

interface AddressConfirmationProps {
  listingLocation: ListingLocation;
  setListingLocation: (location: ListingLocation) => void;
  validationErrors?: string[];
}

export default function AddressConfirmation({ listingLocation, setListingLocation, validationErrors }: AddressConfirmationProps) {
  const { toast } = useToast();
  
  // Salt Lake City, Utah
  const INITIAL_COORDINATES = { lat: 40.7608, lng: -111.8910 };
  const [coordinates, setCoordinates] = useState({
    lat: listingLocation.latitude || INITIAL_COORDINATES.lat,
    lng: listingLocation.longitude || INITIAL_COORDINATES.lng
  });
  
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [marker, setMarker] = useState<maplibregl.Marker | null>(null);
  
  const [address, setAddress] = useState({
    street: listingLocation.streetAddress1 || "",
    street2: listingLocation.streetAddress2 || "",
    city: listingLocation.city || "",
    state: listingLocation.state || "",
    zip: listingLocation.postalCode || "",
  });

  // Debounced address update
  const [debouncedAddress, setDebouncedAddress] = useState(address);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize map only on first render
  useEffect(() => {
    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      const mapContainer = document.getElementById('address-confirmation-map');
      if (!mapContainer) return;
      
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

  // Debounce address changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedAddress(address);
    }, 200);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [address]);

  // Update map pin when debounced address changes
  useEffect(() => {
    const updateMapPin = async () => {
      // Only update if we have a complete address
      if (debouncedAddress.street && debouncedAddress.city && debouncedAddress.state && debouncedAddress.zip) {
        try {
          const addressString = `${debouncedAddress.street}, ${debouncedAddress.city}, ${debouncedAddress.state} ${debouncedAddress.zip}`;
          
          const response = await fetch(`/api/geocode?address=${encodeURIComponent(addressString)}`);
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
          
          // Only continue if we have valid coordinates
          if (lat && lng && lat !== 0 && lng !== 0) {
            // Update coordinates for the map
            setCoordinates({ lat: Number(lat), lng: Number(lng) });
          }
        } catch (error) {
          console.error("Error updating pin:", error);
        }
      }
    };

    updateMapPin();
  }, [debouncedAddress]);

  // Update listing location when address or coordinates change
  useEffect(() => {
    setListingLocation({
      ...listingLocation,
      streetAddress1: address.street,
      streetAddress2: address.street2,
      city: address.city,
      state: address.state,
      postalCode: address.zip,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });
  }, [address, coordinates]);

  return (
    <main className="relative w-full max-w-[883px]">
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

        {/* Address form */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-[670px] mx-auto bg-background">
            <AddressConfirmationForm 
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
              onUpdatePin={() => {
                // Force update pin with current address
                const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
                
                (async () => {
                  try {
                    const response = await fetch(`/api/geocode?address=${encodeURIComponent(addressString)}`);
                    const data = await response.json() as GeocodeResponse;
                    
                    let lat = 0, lng = 0;
                    
                    if (data.results && data.results.length > 0) {
                      if (data.results[0].geometry && data.results[0].geometry.location) {
                        lat = data.results[0].geometry.location.lat;
                        lng = data.results[0].geometry.location.lng;
                      }
                    }
                    
                    if (lat && lng && lat !== 0 && lng !== 0) {
                      setCoordinates({ lat: Number(lat), lng: Number(lng) });
                      
                      toast({
                        title: "Pin Updated",
                        description: "Map location has been updated based on your address.",
                      });
                    } else {
                      toast({
                        title: "Warning",
                        description: "Could not find a valid location for this address.",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    console.error("Error updating pin:", error);
                    toast({
                      title: "Error",
                      description: "There was a problem updating the map location.",
                      variant: "destructive"
                    });
                  }
                })();
              }}
            />
          </div>
        </div>

        {/* Map below the form */}
        <div className="w-full h-[400px] relative bg-gray-100">
          <div id="address-confirmation-map" className="w-full h-full absolute inset-0"></div>
        </div>

      </section>
    </main>
  );
}