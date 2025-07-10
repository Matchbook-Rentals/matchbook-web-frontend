import React from "react";

async function fetchOverviewData() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    totalListings: 0,
    activeApplications: 0,
    currentBookings: 0,
    monthlyRevenue: 0
  };
}

export default async function OverviewPage() {
  const data = await fetchOverviewData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      </div>
      <div className="flex-1 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Listings</h3>
            <p className="text-2xl font-bold">{data.totalListings}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Applications</h3>
            <p className="text-2xl font-bold">{data.activeApplications}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Current Bookings</h3>
            <p className="text-2xl font-bold">{data.currentBookings}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
            <p className="text-2xl font-bold">${data.monthlyRevenue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}