"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const hostDashboardItems = [
  {
    title: "Overview",
    url: "/app/host/dashboard",
    icon: "📊",
  },
  {
    title: "Listings",
    url: "/app/host/dashboard/listings",
    icon: "🏠",
  },
  {
    title: "All Applications",
    url: "/app/host/dashboard/applications",
    icon: "👥",
    isActive: true,
  },
  {
    title: "All Bookings",
    url: "/app/host/dashboard/bookings",
    icon: "📅",
  },
  {
    title: "All Reviews",
    url: "/app/host/reviews",
    icon: "💬",
  },
  {
    title: "Payments",
    url: "/app/host/payments",
    icon: "💳",
  },
]

const otherItems = [
  {
    title: "Settings",
    url: "/app/host/settings",
    icon: "⚙️",
  },
]

export function HostSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/app/host">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img
                    className="size-6"
                    alt="Logo"
                    src="/logo.svg"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Matchbook</span>
                  <span className="text-xs">Host Dashboard</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {hostDashboardItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <a href={item.url} className="font-medium">
                    <span className="text-base">{item.icon}</span>
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            {otherItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    <span className="text-base">{item.icon}</span>
                    {item.title}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}