import React from "react";
import prisma from "@/lib/prismadb";
import ProgressBar from "./progress-bar";
import AddPropertyClient from "./app-property-client";
import { type Listing } from "@prisma/client";

const handleListingCreation = async (propertyDetails: Listing) => {
  "use server";

  const listing = await prisma.listing.create({
    data: {
      ...propertyDetails,
    },
  });
  console.log(listing);
  return listing;
};

export default function AddPropertyPage() {
  const steps = [
    "Property Type",
    "Details",
    "Photos",
    "Lease Terms",
    "Amenities",
  ];
  return (
    <div>
      <AddPropertyClient handleListingCreation={handleListingCreation} />
    </div>
  );
}
