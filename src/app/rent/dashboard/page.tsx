import { getRenterDashboardData } from '@/app/actions/renter-dashboard';
import { checkAdminAccess } from "@/utils/roles";
import prisma from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Trip, Booking, Application } from "@prisma/client";
import RenterDashboardClient from './renter-dashboard-client';
import { getDemoData } from './lib/demo-data';

interface SearchParams {
  mode?: string;
}

export default async function RenterDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const mode = searchParams.mode;
  const isAdmin = await checkAdminAccess();
  const { userId } = auth();
  const user = await currentUser();
  
  let data;

  if (mode === 'demo' && isAdmin && userId) {
    // Load hardcoded sample data so QA can see every section populated
    data = getDemoData(
      userId,
      user?.firstName ?? null,
      user?.lastName ?? null,
      user?.imageUrl ?? '',
    );
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
      hasMoreFavorites: false,
    };
  } else {
    // Default: load normal dashboard data
    data = await getRenterDashboardData();
  }

  return <RenterDashboardClient data={data} isAdmin={isAdmin} currentMode={mode} />;
}
