import ListIcon from "@/components/ui/list-icon";
import PlusIcon from "@/components/ui/plus-icon";
import WindowIcon from "@/components/ui/window-icon";
import Image from "next/image";
import React from "react";
import prisma from "@/lib/prismadb";
import PropertyList from "./property-list";
import HostDashboardHeader from "./host-dashboard-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type Listing } from "@prisma/client";
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
      <h1 className="text-3xl my-3 font-semibold text-center">Your Properties</h1>
      <Button
        className="w-fit text-2xl  flex md:ml-auto md:mr-0 mx-auto"
        variant="ghost"
      >
        <Link className="flex" href="/platform/host-dashboard/add-property">
          <div className="bg-primaryBrand rounded-full mr-2 p-0">
            <span className="text-2xl font-bold rounded-full px-2 ">+</span>
          </div>
          Add a property
        </Link>
      </Button>
      <HostDashboardClient properties={userDbProperties} />
    </div>
  );
}
