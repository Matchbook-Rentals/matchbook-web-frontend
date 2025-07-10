import React, { useState, useEffect } from "react";
import { AddressConfirmationForm } from "./address-confirmation-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

export default function AddressConfirmation({ listingLocation, setListingLocation, validationErrors, inputStyles, labelStyles }: AddressConfirmationProps) {
  const [address, setAddress] = useState({
    street: listingLocation.streetAddress1 || "",
    street2: listingLocation.streetAddress2 || "",
    city: listingLocation.city || "",
    state: listingLocation.state || "",
    zip: listingLocation.postalCode || "",
  });

  // Update listing location when address changes
  useEffect(() => {
    setListingLocation({
      ...listingLocation,
      streetAddress1: address.street,
      streetAddress2: address.street2,
      city: address.city,
      state: address.state,
      postalCode: address.zip,
    });
  }, [address]);

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