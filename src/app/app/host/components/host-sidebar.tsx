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

interface BreadcrumbItem {
  title: string;
  icon: string;
}

interface HostSidebarProps extends React.ComponentProps<typeof Sidebar> {
  groups: SidebarGroup[];
  breadcrumb?: BreadcrumbItem;
}

export function HostSidebar({ groups, breadcrumb, ...props }: HostSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/app/host">
                  <img
                    className=""
                    alt="Logo"
                    src="/new-green-logo.png"
                  />
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
