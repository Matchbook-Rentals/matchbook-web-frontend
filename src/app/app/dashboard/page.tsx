import React from "react";
import prisma from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import CurrentStay from "./current-stay";
import UpcomingBookings from "./upcoming-bookings";
import RecentSearches from "./recent-searches";
import { Trip } from "@/types";

export default async function DashboardPage() {
  const { userId } = auth();
  const getTrips = async () => {
    "use server";
    let trips = await prisma.trip.findMany({ where: { userId } });
    return trips;
  };

  const allBookings = await prisma.booking.findMany({ where: { userId } });

  let trips: Trip[] = await getTrips();
  let userData = await currentUser();

  const upcomingBookings = trips.filter(
    (trip) => trip?.tripStatus === "reserved",
  );

  return (
    <div>
      {allBookings.map((booking) => (
        <div key={booking.id}>{booking.listingId}</div>
      ))}
      <h2 className="text-center text-4xl font-semibold pb-3 mb-10">
        Hey there, {userData?.firstName}
      </h2>
      <CurrentStay />
      <UpcomingBookings upcomingBookings={upcomingBookings} />
      <RecentSearches trips={trips} />
    </div>
  );
}
