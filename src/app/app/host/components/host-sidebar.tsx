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

interface SidebarMenuItem {
  title: string;
  url: string;
  icon: string;
  isActive?: boolean;
}

interface SidebarGroup {
  title?: string;
  items: SidebarMenuItem[];
}

interface HostSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: SidebarGroup[];
}

export function HostSidebar({ groups, ...props }: HostSidebarProps) {
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
        {groups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarMenu>
              {group.items.map((item) => (
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
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}