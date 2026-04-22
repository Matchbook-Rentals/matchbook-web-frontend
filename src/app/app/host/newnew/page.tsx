import React from "react";
import DashboardClient, { type DashboardData } from "./dashboard-client";

/* ---------------------------------------------------------------------------
   FAKE DATA — stand-in until real loaders wire in. Shape mirrors what a real
   fetch (see app/host/dashboard/overview/page.tsx) would return.
--------------------------------------------------------------------------- */
async function getDashboardData(): Promise<DashboardData> {
  return {
    user: { activeView: "Dashboard" },
    stats: [
      { id: "listings", label: "Listings", value: 20, icon: "home" },
      { id: "pending", label: "Pending Applications", value: 5, icon: "users" },
      { id: "bookings", label: "Active Bookings", value: 20, icon: "calendar" },
    ],
    nav: [
      { id: "dashboard", label: "Dashboard", icon: "grid" },
      { id: "listings", label: "Listings", icon: "home" },
      { id: "applications", label: "Applications", icon: "users", badge: 1 },
      { id: "bookings", label: "Bookings", icon: "calendar-clock", badge: 1 },
      { id: "calendar", label: "Calendar", icon: "calendar" },
      { id: "payments", label: "Payments", icon: "card" },
    ],
    todos: [
      { id: "stripe", label: "Set Up Stripe Account", icon: "coins", actionable: false },
      { id: "identity", label: "Complete Identity Verification", icon: "badge", actionable: false },
      { id: "host", label: "Review Host Agreement", icon: "clipboard", actionable: false },
      { id: "movein", label: "Add Move-In Instructions : Ogden Mountain Home", icon: "file", actionable: true },
    ],
    rent: {
      title: "Rent Collected",
      unit: "$",
      ticks: [0, 2000, 3000, 4000],
      bars: [
        { month: "Jan", amount: 2700, active: false },
        { month: "Feb", amount: 3200, active: false },
        { month: "Mar", amount: 3100, active: false },
        { month: "Apr", amount: 4000, active: true },
      ],
    },
    payments: [
      {
        id: 1,
        title: "123 Maple Avenue Springfield",
        date: "12 Sep 2024, 9:29",
        amount: 2400,
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop",
      },
      {
        id: 2,
        title: "Ogden Mountain Home",
        date: "10 Sep 2024, 9:29",
        amount: 1200,
        image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=200&fit=crop",
      },
      {
        id: 3,
        title: "Booking 987 Villa Street",
        date: "10 Sep 2024, 9:29",
        amount: 1200,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&h=200&fit=crop",
      },
    ],
  };
}

export default async function HostDashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={data} />;
}
