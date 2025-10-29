import React from "react";
import OverviewClient from "./overview-client";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import type { StatisticsCardData } from "./overview-client";
import { getHostListingsCount } from "@/app/actions/listings";
import { getAllUserDrafts } from "@/app/actions/listings-in-creation";
import { getHostHousingRequests } from "@/app/actions/housing-requests";
import { getAllHostBookings } from "@/app/actions/bookings";
import { getHostUserData } from "@/app/actions/user";
import { refreshStripeVerificationStatus } from "@/app/actions/stripe-identity";
import prisma from "@/lib/prismadb";

// Force dynamic rendering to ensure fresh Stripe status on every page load
export const dynamic = 'force-dynamic';

// Helper to get last 12 months
function getLast12Months() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      name: months[date.getMonth()],
      index: date.getMonth(),
      year: date.getFullYear()
    });
  }

  return result;
}

// Helper to check if a date is within the last 12 months
function isInLast12Months(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  return d >= twelveMonthsAgo && d <= now;
}

type HousingRequest = {
  status: string;
  createdAt: Date | string;
};

// Format applications chart data from housing requests
function formatApplicationsChartData(housingRequests: HousingRequest[]) {
  const last12Months = getLast12Months();

  const chartData = last12Months.map(({ name, index, year }) => {
    const monthRequests = housingRequests.filter(hr => {
      const createdDate = new Date(hr.createdAt);
      return (
        createdDate.getMonth() === index &&
        createdDate.getFullYear() === year &&
        isInLast12Months(hr.createdAt)
      );
    });

    const approved = monthRequests.filter(hr => hr.status === 'approved').length;
    const pending = monthRequests.filter(hr => hr.status === 'pending').length;
    const declined = monthRequests.filter(hr => hr.status === 'declined').length;

    return {
      month: name,
      approved,
      pending,
      declined,
      spacer1: 1,
      spacer2: 1,
      hasData: approved > 0 || pending > 0 || declined > 0
    };
  });

  // Find the first month with data
  const firstDataIndex = chartData.findIndex(month => month.hasData);

  // If no data exists, return empty array
  if (firstDataIndex === -1) {
    return [];
  }

  // Return data starting from first month with data
  return chartData.slice(firstDataIndex).map(({ hasData, ...rest }) => rest);
}

type Payment = {
  status: string;
  totalAmount: number;
  paymentCapturedAt: Date | string | null;
};

// Format revenue chart data from captured payments
function formatRevenueChartData(payments: Payment[]) {
  const last12Months = getLast12Months();

  // Filter to only captured payments in last 12 months
  const capturedPayments = payments.filter(payment =>
    payment.status === 'SUCCEEDED' &&
    payment.paymentCapturedAt &&
    isInLast12Months(payment.paymentCapturedAt)
  );

  const chartData = last12Months.map(({ name, index, year }) => {
    const monthRevenueCents = capturedPayments
      .filter(payment => {
        const capturedDate = new Date(payment.paymentCapturedAt!);
        return (
          capturedDate.getMonth() === index &&
          capturedDate.getFullYear() === year
        );
      })
      .reduce((sum, payment) => sum + payment.totalAmount, 0);

    return {
      month: name,
      revenue: monthRevenueCents / 100, // Convert cents to dollars
      hasData: monthRevenueCents > 0
    };
  });

  // Find the first month with data
  const firstDataIndex = chartData.findIndex(month => month.hasData);

  // If no data exists, return empty array
  if (firstDataIndex === -1) {
    return [];
  }

  // Return data starting from first month with data
  return chartData.slice(firstDataIndex).map(({ hasData, ...rest }) => rest);
}

async function fetchOverviewData() {
  try {
    const { userId } = auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const [listingsCount, userDrafts, housingRequests, hostBookings] = await Promise.all([
      getHostListingsCount(),
      getAllUserDrafts(),
      getHostHousingRequests(),
      getAllHostBookings()
    ]);

    // Fetch raw payment data for charts
    const bookingsWithPayments = await prisma.booking.findMany({
      where: {
        listing: {
          userId: userId
        }
      },
      include: {
        rentPayments: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            paymentCapturedAt: true,
          }
        }
      }
    });

    // Flatten all payments
    const allPayments = bookingsWithPayments.flatMap(booking =>
      booking.rentPayments.map(payment => ({
        status: payment.status,
        totalAmount: payment.totalAmount,
        paymentCapturedAt: payment.paymentCapturedAt
      }))
    );

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
      },
      housingRequests,  // Pass raw data for chart formatting
      payments: allPayments, // Pass raw payment data for revenue chart
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
      },
      housingRequests: [],
      payments: [],
    };
  }
}

function buildStatisticsCards(data: {
  totalListings: number;
  draftsCount: number;
  activeApplications: number;
  currentBookings: number;
  averageRating: number;
  monthlyRevenue: number;
  applicationsBreakdown?: { approved: number, pending: number, declined: number };
  bookingsBreakdown?: { upcoming: number, active: number };
}) {
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
  
  // Build cards with actual data or zero values
  const cards = data ? buildStatisticsCards(data) : buildZeroStatisticsCards();

  // Format chart data from fetched data
  const chartData = {
    applicationsData: formatApplicationsChartData(data.housingRequests),
    revenueData: formatRevenueChartData(data.payments)
  };

  return <OverviewClient
    cards={cards}
    chartData={chartData}
    userFirstName={user?.firstName || null}
    hostUserData={hostUserData}
    isAdminDev={isAdminDev}
  />;
}
