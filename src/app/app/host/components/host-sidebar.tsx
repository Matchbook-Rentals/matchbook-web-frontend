"use client"

import * as React from "react"
import { LucideIcon, BarChart3, Home, Users, Calendar, MessageSquare, CreditCard, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
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
  const getIconComponent = (iconName: string) => {
    const icons = {
      BarChart3,
      Home,
      Users,
      Calendar,
      MessageSquare,
      CreditCard,
      Settings
    };
    return icons[iconName as keyof typeof icons] || BarChart3;
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/app/host">
                  <img
                    className="p-2"
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
            {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url} className="font-medium">
                        <IconComponent className="h-4 w-4" />
                        {item.title}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail>
      </SidebarRail>
    </Sidebar>
  )
}
