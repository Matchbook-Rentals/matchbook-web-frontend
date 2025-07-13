import React from "react";
import OverviewClient from "./overview-client";
import { auth, currentUser } from "@clerk/nextjs/server";

async function fetchOverviewData() {
  // Simulate data fetching delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return sample data to show non-empty dashboard state
  return null;
}

const sampleData = {
  totalListings: 3,
  activeApplications: 24,
  currentBookings: 3,
  averageRating: 4.5,
  monthlyRevenue: 8500
};

function buildStatisticsCards(data: typeof sampleData) {
  return [
    {
      id: "applications",
      title: "All Applications",
      value: data.activeApplications.toString(),
      iconName: "ClipboardList",
      iconBg: "bg-purple-50",
      iconColor: "text-gray-700",
      link: "/app/host/dashboard/applications",
      badges: [
        {
          text: "4 Approved",
          bg: "bg-green-50",
          valueColor: "text-green-600",
          labelColor: "text-gray-600",
        },
        {
          text: "3 Pending",
          bg: "bg-yellow-50",
          valueColor: "text-yellow-600",
          labelColor: "text-gray-600",
        },
        {
          text: "1 Declined",
          bg: "bg-red-50",
          valueColor: "text-red-600",
          labelColor: "text-gray-600",
        },
      ],
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
        type: "badges",
        badges: [
          {
            text: "2 Upcoming",
            bg: "bg-blue-50",
            valueColor: "text-blue-600",
            labelColor: "text-gray-600",
          },
          {
            text: "1 Active",
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
      subtitle: { text: "Listed Properties" },
    },
  ];
}

const zeroData = {
  totalListings: 0,
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
        type: "badges",
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
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  
  // Build mock cards with sample data
  const mockCards = buildStatisticsCards(sampleData);
  
  // Build real cards with zero values (since data is null)
  let realCards = buildZeroStatisticsCards();
  
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

  // Mock chart data
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

  return <OverviewClient cards={realCards} mockCards={mockCards} mockChartData={mockChartData} userFirstName={user?.firstName || null} />;
}
