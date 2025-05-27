import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HostDashboardClient from "./host-dashboard-client";
// import { fetchListingsFromDb } from "./_actions";

export default function HostDashboard() {
  // Commented out to avoid duplicate fetching - data is now provided by layout through context
  // const userDbProperties = await fetchListingsFromDb();

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
      <HostDashboardClient />
    </div>
  );
}
