import React from "react";
import OverviewClient from "./overview-client";
import { currentUser } from "@clerk/nextjs/server";
import type { StatisticsCardData } from "./overview-client";
import { getHostListingsCount } from "@/app/actions/listings";
import { getAllUserDrafts } from "@/app/actions/listings-in-creation";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import { getAllHostBookings } from "@/app/actions/bookings";
import { getHostUserData } from "@/app/actions/user";
import { refreshStripeVerificationStatus } from "@/app/actions/stripe-identity";

// Force dynamic rendering to ensure fresh Stripe status on every page load
export const dynamic = 'force-dynamic';

async function fetchOverviewData() {
  try {
    const [listingsCount, userDrafts, housingRequests, hostBookings] = await Promise.all([
      getHostListingsCount(),
      getAllUserDrafts(),
      getHostHousingRequests(),
      getAllHostBookings()
    ]);
    
    // Calculate applications breakdown
    const approvedCount = housingRequests.filter(hr => hr.status === 'approved').length;
    const pendingCount = housingRequests.filter(hr => hr.status === 'pending').length;
    const declinedCount = housingRequests.filter(hr => hr.status === 'declined').length;
    
    // Calculate bookings breakdown 
    const upcomingBookings = hostBookings.bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      const today = new Date();
      return startDate > today;
    }).length;
    
    const activeBookings = hostBookings.bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const today = new Date();
      return startDate <= today && endDate >= today;
    }).length;
    
    return {
      totalListings: listingsCount,
      draftsCount: userDrafts?.length || 0,
      activeApplications: housingRequests.length,
      currentBookings: hostBookings.bookings.length,
      averageRating: 0, // TODO: Calculate from reviews when available
      monthlyRevenue: 0, // TODO: Calculate from bookings when available
      applicationsBreakdown: {
        approved: approvedCount,
        pending: pendingCount,
        declined: declinedCount
      },
      bookingsBreakdown: {
        upcoming: upcomingBookings,
        active: activeBookings
      }
    };
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return {
      totalListings: 0,
      draftsCount: 0,
      activeApplications: 0,
      currentBookings: 0,
      averageRating: 0,
      monthlyRevenue: 0,
      applicationsBreakdown: {
        approved: 0,
        pending: 0,
        declined: 0
      },
      bookingsBreakdown: {
        upcoming: 0,
        active: 0
      }
    };
  }
}

const sampleData = {
  totalListings: 3,
  draftsCount: 2,
  activeApplications: 24,
  currentBookings: 3,
  averageRating: 4.5,
  monthlyRevenue: 8500
};

function buildStatisticsCards(data: typeof sampleData & { applicationsBreakdown?: { approved: number, pending: number, declined: number }, bookingsBreakdown?: { upcoming: number, active: number } }) {
  return [
    {
      id: "applications",
      title: "All Applications",
      value: data.activeApplications.toString(),
      iconName: "ClipboardList",
      iconBg: "bg-purple-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/applications",
      badges: [],
      footer: {
        type: "badges" as const,
        badges: [
          {
            text: `${data.applicationsBreakdown?.approved || 0} Approved`,
            bg: "bg-green-50",
            valueColor: "text-green-600",
            labelColor: "text-gray-600",
          },
          {
            text: `${data.applicationsBreakdown?.pending || 0} Pending`,
            bg: "bg-yellow-50",
            valueColor: "text-yellow-600",
            labelColor: "text-gray-600",
          },
          {
            text: `${data.applicationsBreakdown?.declined || 0} Declined`,
            bg: "bg-red-50",
            valueColor: "text-red-600",
            labelColor: "text-gray-600",
          },
        ],
      },
    },
    {
      id: "bookings",
      title: "All Bookings",
      value: data.currentBookings.toString(),
      iconName: "Calendar",
      iconBg: "bg-green-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/bookings",
      badges: [],
      footer: {
        type: "badges" as const,
        badges: [
          {
            text: `${data.bookingsBreakdown?.upcoming || 0} Upcoming`,
            bg: "bg-blue-50",
            valueColor: "text-blue-600",
            labelColor: "text-gray-600",
          },
          {
            text: `${data.bookingsBreakdown?.active || 0} Active`,
            bg: "bg-green-50",
            valueColor: "text-green-600",
            labelColor: "text-gray-600",
          },
          null, // Empty third column
        ],
      },
    },
    {
      id: "reviews",
      title: "All Reviews",
      value: data.averageRating.toString(),
      iconName: "Star",
      iconBg: "bg-blue-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/reviews",
      subtitle: {
        value: data.averageRating.toString(),
        name: "Average Rating",
        valueColor: "text-blue-600",
      },
    },
    {
      id: "listings",
      title: "All Listings",
      value: data.totalListings.toString(),
      iconName: "Home",
      iconBg: "bg-orange-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/listings",
      badges: [],
      ...(data.draftsCount > 0 && {
        footer: {
          type: "badges" as const,
          badges: [
            {
              text: `${data.draftsCount} Draft${data.draftsCount !== 1 ? 's' : ''}`,
              bg: "bg-yellow-50",
              valueColor: "text-yellow-600",
              labelColor: "text-gray-600",
            },
            null, // Empty second column
            null, // Empty third column
          ],
        },
      }),
      subtitle: { text: "Listed Properties" },
    },
  ];
}

const zeroData = {
  totalListings: 0,
  draftsCount: 0,
  activeApplications: 0,
  currentBookings: 0,
  averageRating: 0,
  monthlyRevenue: 0
};

function buildZeroStatisticsCards() {
  return [
    {
      id: "applications",
      title: "All Applications",
      value: "0",
      iconName: "ClipboardList",
      iconBg: "bg-purple-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/applications",
      badges: [],
      footer: {
        type: "badges" as const,
        badges: [
          {
            text: "0 Approved",
            bg: "bg-green-50",
            valueColor: "text-green-600",
            labelColor: "text-gray-600",
          },
          {
            text: "0 Pending",
            bg: "bg-yellow-50",
            valueColor: "text-yellow-600",
            labelColor: "text-gray-600",
          },
          {
            text: "0 Declined",
            bg: "bg-red-50",
            valueColor: "text-red-600",
            labelColor: "text-gray-600",
          },
        ],
      },
    },
    {
      id: "bookings",
      title: "All Bookings",
      value: "0",
      iconName: "Calendar",
      iconBg: "bg-green-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/bookings",
      badges: [],
      footer: {
        type: "badges" as const,
        badges: [
          {
            text: "0 Upcoming",
            bg: "bg-blue-50",
            valueColor: "text-blue-600",
            labelColor: "text-gray-600",
          },
          {
            text: "0 Active",
            bg: "bg-green-50",
            valueColor: "text-green-600",
            labelColor: "text-gray-600",
          },
          null, // Empty third column
        ],
      },
    },
    {
      id: "reviews",
      title: "All Reviews",
      value: "0",
      iconName: "Star",
      iconBg: "bg-blue-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/reviews",
      subtitle: {
        value: "0",
        name: "Average Rating",
        valueColor: "text-blue-600",
      },
    },
    {
      id: "listings",
      title: "All Listings",
      value: "0",
      iconName: "Home",
      iconBg: "bg-orange-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/listings",
      badges: [],
      subtitle: { text: "Listed Properties" },
    },
    {
      id: "mock-toggle",
      title: "Demo Mode",
      value: "Preview with sample data",
      iconName: "Database",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
      asLink: false,
      badges: [],
      subtitle: { text: "Loads mock data" },
    },
  ];
}

export default async function OverviewPage() {
  const data = await fetchOverviewData();

  // Get user data and check admin role
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const isAdminDev = user?.publicMetadata?.role === 'admin_dev';

  // Get host user data for onboarding checklist
  let hostUserData = await getHostUserData();

  // Poll Stripe for fresh verification status if user has a pending session
  // This ensures we catch verification completion even if webhooks are delayed
  if (hostUserData?.stripeVerificationSessionId &&
      hostUserData?.stripeVerificationStatus !== 'verified') {
    console.log('🔍 RSC polling triggered:', {
      sessionId: hostUserData.stripeVerificationSessionId,
      currentStatus: hostUserData.stripeVerificationStatus,
    });

    try {
      const stripeUpdateResult = await refreshStripeVerificationStatus();
      console.log('📊 RSC polling result:', stripeUpdateResult);

      if (stripeUpdateResult.success && stripeUpdateResult.statusChanged) {
        console.log('🔄 Verification status updated from Stripe poll:', stripeUpdateResult.status);
        // Re-fetch host user data to get updated status
        hostUserData = await getHostUserData();
        console.log('✅ Re-fetched host user data, new status:', hostUserData?.stripeVerificationStatus);
      } else if (stripeUpdateResult.success && !stripeUpdateResult.statusChanged) {
        console.log('ℹ️ Verification status unchanged from Stripe poll:', stripeUpdateResult.status);
      }
    } catch (error) {
      console.warn('⚠️ Could not poll Stripe for verification status:', error);
      // Don't block page load if polling fails
    }
  } else {
    console.log('⏭️ RSC polling skipped:', {
      hasSessionId: !!hostUserData?.stripeVerificationSessionId,
      currentStatus: hostUserData?.stripeVerificationStatus,
      reason: !hostUserData?.stripeVerificationSessionId
        ? 'No verification session exists'
        : hostUserData?.stripeVerificationStatus === 'verified'
        ? 'Already verified'
        : 'Unknown'
    });
  }
  
  // Build mock cards with sample data
  const mockCards = buildStatisticsCards(sampleData);
  
  // Build real cards with actual data or zero values
  let realCards = data ? buildStatisticsCards(data) : buildZeroStatisticsCards();
  
  // Handle mock data card visibility based on admin status
  if (isAdmin) {
    // For admin users, replace the "All Reviews" card with the existing mock data toggle card
    realCards = realCards.map(card => {
      if (card.id === "reviews") {
        // Find the existing mock-toggle card and use it to replace reviews
        const mockToggleCard = realCards.find(c => c.id === "mock-toggle");
        return mockToggleCard || card;
      }
      return card;
    });
    // Remove the duplicate mock-toggle card
    realCards = realCards.filter((card, index, arr) => {
      if (card.id === "mock-toggle") {
        return arr.findIndex(c => c.id === "mock-toggle") === index;
      }
      return true;
    });
  } else {
    // For non-admin users, remove the mock-toggle card entirely
    realCards = realCards.filter(card => card.id !== "mock-toggle");
  }

  // Mock chart data for sample mode
  const mockChartData = {
    applicationsData: [
      { month: "Jan", approved: 25, spacer1: 1, pending: 10, spacer2: 1, declined: 15 },
      { month: "Feb", approved: 43, spacer1: 1, pending: 21, spacer2: 1, declined: 31 },
      { month: "Mar", approved: 25, spacer1: 1, pending: 20, spacer2: 1, declined: 29 },
      { month: "Apr", approved: 11, spacer1: 1, pending: 77, spacer2: 1, declined: 15 },
      { month: "May", approved: 50, spacer1: 1, pending: 16, spacer2: 1, declined: 55 },
      { month: "Jun", approved: 25, spacer1: 1, pending: 46, spacer2: 1, declined: 15 },
      { month: "Jul", approved: 38, spacer1: 1, pending: 8, spacer2: 1, declined: 22 },
      { month: "Aug", approved: 71, spacer1: 1, pending: 27, spacer2: 1, declined: 15 },
      { month: "Sep", approved: 14, spacer1: 1, pending: 40, spacer2: 1, declined: 15 },
      { month: "Oct", approved: 63, spacer1: 1, pending: 37, spacer2: 1, declined: 16 },
      { month: "Nov", approved: 24, spacer1: 1, pending: 23, spacer2: 1, declined: 16 },
      { month: "Dec", approved: 47, spacer1: 1, pending: 32, spacer2: 1, declined: 32 },
    ],
    revenueData: [
      { month: "Jan", revenue: 45000 },
      { month: "Feb", revenue: 52000 },
      { month: "Mar", revenue: 48000 },
      { month: "Apr", revenue: 61000 },
      { month: "May", revenue: 55000 },
      { month: "Jun", revenue: 67000 },
      { month: "Jul", revenue: 72000 },
      { month: "Aug", revenue: 68000 },
      { month: "Sep", revenue: 59000 },
      { month: "Oct", revenue: 63000 },
      { month: "Nov", revenue: 58000 },
      { month: "Dec", revenue: 71000 },
    ]
  };
  
  // For now, real chart data will show empty states when not in demo mode
  // This could be enhanced later to show actual historical data
  const realChartData = {
    applicationsData: null, // No historical data available yet
    revenueData: null // No revenue tracking available yet
  };

  return <OverviewClient 
    cards={realCards} 
    mockCards={mockCards} 
    mockChartData={mockChartData} 
    realChartData={realChartData} 
    userFirstName={user?.firstName || null}
    hostUserData={hostUserData}
    isAdminDev={isAdminDev}
  />;
}
