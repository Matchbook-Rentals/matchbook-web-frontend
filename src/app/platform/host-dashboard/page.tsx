import React from "react";
import prisma from "@/lib/prismadb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import HostDashboardClient from "./host-dashboard-client";

const fetchListingsFromDb = async () => {
  "use server";

  try {
    const user = await currentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const listings = await prisma.listing.findMany({
      where: {
        userId: user.id,
      },
      include: {
        bedrooms: true,
        listingImages: true,
      },
    });
    return listings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error; // Re-throw the error for further handling
  }
  return [];
};

export default async function HostDashboard() {
  const userDbProperties = await fetchListingsFromDb();

  return (
    <div className="md:w-4/5 w-[95%] mx-auto">
      <Button
        className="w-fit text-xl  flex md:ml-auto md:mr-0 mx-auto"
        variant="ghost"
      >
        <Link className="flex" href="/platform/host-dashboard/add-property">
          <div className="bg-background border-2 border-charcoalBrand rounded-full mr-2 p-0">
            <span className="text-lg font-medium rounded-full px-2 ">+</span>
          </div>
          Add a property
        </Link>
      </Button>
      <HostDashboardClient properties={userDbProperties} />
    </div>
  );
}
