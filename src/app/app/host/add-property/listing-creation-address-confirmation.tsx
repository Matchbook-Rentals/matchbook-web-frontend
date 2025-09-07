import React, { useState, useEffect, useRef } from "react";
import { AddressConfirmationForm } from "./address-confirmation-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { GeocodeResponse } from "@/app/api/geocode/route";

// Constants
const GEOCODE_DEBOUNCE_MS = 1000;
const DEFAULT_COUNTRY = "United States";

// Types
interface Address {
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
}

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
  inputStyles?: string;
  labelStyles?: string;
}

// Helper functions
const buildLocationString = (city: string, state: string): string | null => {
  return city && state ? `${city}, ${state}` : null;
};

const buildFullAddress = (address: Address): string => {
  const { street, city, state, zip } = address;
  return `${street}, ${city}, ${state} ${zip}`.trim();
};

const hasRequiredAddressFields = (address: Address): boolean => {
  return Boolean(address.street && address.city && address.state);
};

const extractCoordinates = (geocodeResponse: GeocodeResponse) => {
  if (!geocodeResponse.results?.length) return null;
  
  const location = geocodeResponse.results[0].geometry?.location;
  if (!location) return null;
  
  return {
    latitude: location.lat,
    longitude: location.lng
  };
};

export default function AddressConfirmation({ listingLocation, setListingLocation, validationErrors, inputStyles, labelStyles }: AddressConfirmationProps) {
  const [address, setAddress] = useState<Address>({
    street: listingLocation.streetAddress1 || "",
    street2: listingLocation.streetAddress2 || "",
    city: listingLocation.city || "",
    state: listingLocation.state || "",
    zip: listingLocation.postalCode || "",
  });
  const geocodeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const listingLocationRef = useRef(listingLocation);
  
  // Keep ref in sync
  useEffect(() => {
    listingLocationRef.current = listingLocation;
  }, [listingLocation]);

  // Geocode address and update listing location with debouncing
  useEffect(() => {
    // Clear any existing timer
    if (geocodeDebounceTimer.current) {
      clearTimeout(geocodeDebounceTimer.current);
    }

    // Debounce geocoding
    geocodeDebounceTimer.current = setTimeout(async () => {
      // Build base location update
      const locationString = buildLocationString(address.city, address.state);
      const updatedLocation = {
        ...listingLocationRef.current,
        streetAddress1: address.street,
        streetAddress2: address.street2,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        locationString: locationString,
        country: DEFAULT_COUNTRY
      };

      // Early return if missing required fields
      if (!hasRequiredAddressFields(address)) {
        setListingLocation(updatedLocation);
        return;
      }

      // Attempt geocoding
      try {
        const fullAddress = buildFullAddress(address);
        const response = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`);
        const data = await response.json() as GeocodeResponse;
        
        const coordinates = extractCoordinates(data);
        if (coordinates) {
          updatedLocation.latitude = coordinates.latitude;
          updatedLocation.longitude = coordinates.longitude;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }

      setListingLocation(updatedLocation);
    }, GEOCODE_DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (geocodeDebounceTimer.current) {
        clearTimeout(geocodeDebounceTimer.current);
      }
    };
  }, [address, setListingLocation]);

  return (
    <main className="relative w-full">
      <section className="w-full h-full">
        {/* Address form */}
        <div className="w-full flex justify-center">
          <div className="w-full mx-auto bg-background">
            <AddressConfirmationForm 
              initialAddress={address} 
              inputStyles={inputStyles}
              labelStyles={labelStyles}
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
          </div>
        </div>

      </section>
    </main>
  );
}