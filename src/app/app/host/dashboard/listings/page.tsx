import React from "react";
import { getHostListings } from "@/app/actions/listings";
import { getAllUserDrafts } from "@/app/actions/listings-in-creation";
import HostDashboardListingsTab from "../../host-dashboard-listings-tab";
import { HOST_PAGE_STYLE } from "@/constants/styles";
import { HostPageTitle } from "../../[listingId]/(components)/host-page-title";

interface PageProps {
  searchParams: {
    page?: string;
  };
}


export default async function HostDashboardListingsPage({ searchParams }: PageProps) {
  console.log('HostDashboardListingsPage: Starting data fetch...');
  
  // Get current page from URL params (default to 1)
  const currentPage = parseInt(searchParams.page || '1', 10);
  const itemsPerPage = 100; // Fetch 100 at a time from server
  
  // Fetch both listings data and all user drafts in parallel
  const [listingsData, userDrafts] = await Promise.all([
    getHostListings(currentPage, itemsPerPage),
    getAllUserDrafts()
  ]);

  console.log('HostDashboardListingsPage: Data fetched successfully');
  console.log('- listings count:', listingsData.listings.length, 'of total:', listingsData.totalCount);
  console.log('- user drafts count:', userDrafts?.length || 0);

  return (
    <div className={`${HOST_PAGE_STYLE}`}>
      <HostPageTitle title="All Listings" subtitle="Manage all of your property listings" />
      <HostDashboardListingsTab 
        listings={listingsData.listings}
        paginationInfo={{
          totalCount: listingsData.totalCount,
          totalPages: listingsData.totalPages,
          currentPage: listingsData.currentPage,
          itemsPerPage
        }}
        userDrafts={userDrafts}
      />
    </div>
  );
}
