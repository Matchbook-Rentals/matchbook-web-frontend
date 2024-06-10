import React from "react";
import prisma from "@/lib/prismadb";
import ProgressBar from "./progress-bar";
import AddPropertyClient from "./app-property-client";
import { type Listing } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

const handleListingCreation = async (propertyDetails: Listing) => {
  "use server";

  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    // Fetch user data from Clerk

    const listing = await prisma.listing.create({
      data: {
        ...propertyDetails,
        userId: user.id, // Associate the listing with the user
      },
    });
    console.log('TRUE', listing);

    // Temporary code to automatically delete the created listing
    await prisma.listing.delete({
      where: {
        id: listing.id,
      },
    });
    console.log('Listing deleted:', listing.id);

    return 'true';
  } catch (error: any) {
    return error.message;
    throw error; // Re-throw the error if you want to propagate it further
  }
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
