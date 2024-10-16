"use client";

import React from "react";
import HostDashboardHeader from "./host-dashboard-header";
import PropertyList from "./property-list";
import { Listing, ListingImage } from "@prisma/client";

interface HostDashboardClientProps {
  properties: Listing & { listingImages: ListingImage[] }[];
}

const HostDashboardClient: React.FC<HostDashboardClientProps> = ({
  properties,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [filteredProperties, setFilteredProperties] = React.useState<
    Listing & { listingImages: ListingImage[] }[]
  >(properties);

  React.useEffect(() => {
    if (statusFilter) {
      setFilteredProperties(
        properties.filter((property) => property.status === statusFilter),
      );
    } else {
      setFilteredProperties(properties);
    }
  }, [statusFilter, properties]);

  return (
    <>
      <HostDashboardHeader
        properties={properties}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <PropertyList properties={filteredProperties} filter={statusFilter} />
    </>
  );
};

export default HostDashboardClient;
