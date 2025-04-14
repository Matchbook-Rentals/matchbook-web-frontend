import React from "react";
import prisma from "@/lib/prismadb";
import ProgressBar from "./progress-bar";
import AddPropertyClient from "./add-property-client";
import { type Listing, type Bedroom } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

const handleListingCreation = async (propertyDetails: Listing & { bedrooms: Bedroom[], listingImages: { url: string }[] }) => {
  "use server";

  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const listing = await prisma.listing.create({
      data: {
        ...propertyDetails,
        userId: user.id, // Associate the listing with the user
        bedrooms: {
          create: propertyDetails.bedrooms,
        },
        listingImages: {
          create: propertyDetails.listingImages,
        },
      },
    });
    console.log('TRUE', listing);


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
