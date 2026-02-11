import { getRenterDashboardData } from '@/app/actions/renter-dashboard';
import { checkAdminAccess } from "@/utils/roles";
import prisma from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Trip, Booking, Application } from "@prisma/client";
import RenterDashboardClient from './renter-dashboard-client';
import { redirect } from 'next/navigation';

interface SearchParams {
  mode?: string;
}

export default async function RenterDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Redirect to the new application page
  redirect('/app/rent/applications/general');

  const mode = searchParams.mode;
  const isAdmin = await checkAdminAccess();
  const { userId } = auth();
  const user = await currentUser();
  
  let data;

  if (mode === 'demo' && isAdmin && userId) {
    // Load demo data - use normal dashboard data but mark as demo mode
    // This ensures all data has proper structure
    data = await getRenterDashboardData();
  } else if (mode === 'empty' && isAdmin && userId) {
    // Log user data for debugging, but show empty states
    const allTrips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const allBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const allFavorites = await prisma.favorite.findMany({
      where: { tripId: { in: allTrips.map((t: Trip) => t.id) } },
      orderBy: { createdAt: "desc" },
    });

    const allApplications = await prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    console.log("=== DUMP MODE - USER DATA COUNTS ===", {
      trips: allTrips.length,
      bookings: allBookings.length,
      favorites: allFavorites.length,
      applications: allApplications.length,
    });

    // Return empty data to show empty states
    data = {
      user: user ? {
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl || '',
      } : null,
      recentSearches: [],
      bookings: [],
      matches: [],
      applications: [],
      favorites: [],
    };
  } else {
    // Default: load normal dashboard data
    data = await getRenterDashboardData();
  }

  return <RenterDashboardClient data={data} isAdmin={isAdmin} currentMode={mode} />;
}
