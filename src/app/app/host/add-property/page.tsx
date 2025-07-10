import React from "react";
import prisma from "@/lib/prismadb";
import ProgressBar from "./progress-bar";
import AddPropertyClient from "./add-property-client";
import { type Listing, type Bedroom, type ListingImage, type ListingInCreation } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { getUserDraftListings } from "@/app/actions/listings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export type DraftListingProps = {
  initialDraftListing?: ListingInCreation | null;
};

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

export default async function AddPropertyPage({
  searchParams
}: {
  searchParams: { draftId?: string; new?: string }
}) {
  // If user explicitly wants to create new or continue editing, show the form
  if (searchParams.draftId || searchParams.new) {
    return (
      <div>
        <AddPropertyClient 
          handleListingCreation={handleListingCreation} 
        />
      </div>
    );
  }

  // Get any draft listings for the current user
  let draftListings: ListingInCreation[] = [];
  try {
    draftListings = await getUserDraftListings();
  } catch (error) {
    console.error("Error fetching draft listings:", error);
  }

  // If no drafts found, just show the regular add property form
  if (!draftListings || draftListings.length === 0) {
    return (
      <div>
        <AddPropertyClient 
          handleListingCreation={handleListingCreation}
        />
      </div>
    );
  }

  // Otherwise, show drafts with options to continue or start new
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Saved Listing Drafts</h1>
      <p className="mb-6">
        You have previously saved listing drafts. Would you like to continue working on an existing draft or create a new listing?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {draftListings.map((listing) => (
          <Card key={listing.id} className="p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {listing.title || "Untitled Listing"}
              </h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(listing.lastModified || "").toLocaleDateString()}
              </p>
            </div>
            <div className="mb-4 flex-grow">
              <p className="text-sm">
                {listing.description?.substring(0, 100) || "No description yet"}
                {listing.description && listing.description.length > 100 ? "..." : ""}
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Link href={`/app/host/add-property?draftId=${listing.id}`} className="w-full">
                <Button variant="default" className="w-full">
                  Continue Editing
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/app/host/add-property?new=true">
          <Button variant="outline" className="mr-4">
            Create New Listing
          </Button>
        </Link>
        <Link href="/app/host/dashboard/listings">
          <Button variant="secondary">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
